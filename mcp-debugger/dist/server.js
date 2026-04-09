import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
const toolRegistry = new Map();
function registerTool(definition, handler) {
    toolRegistry.set(definition.name, { definition, handler });
}
// ---------------------------------------------------------------------------
// SSE client registry
// ---------------------------------------------------------------------------
const sseClients = new Set();
function broadcastEvent(event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const res of sseClients) {
        try {
            res.write(payload);
        }
        catch {
            sseClients.delete(res);
        }
    }
}
// ---------------------------------------------------------------------------
// Voorbeeld-tool: system_check
// ---------------------------------------------------------------------------
registerTool({
    name: "system_check",
    description: "Geeft serverinformatie terug: timestamp, uptime, Node-versie en geheugengebruik. " +
        "Gebruik dit om te controleren of de debugger correct werkt.",
    inputSchema: {
        type: "object",
        properties: {
            includeMemory: {
                type: "boolean",
                description: "Voeg geheugenstatistieken toe aan de response (standaard: true)",
            },
        },
    },
}, async (args) => {
    const mem = process.memoryUsage();
    return {
        timestamp: new Date().toISOString(),
        uptime_seconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
        platform: process.platform,
        ...(args.includeMemory !== false && {
            memory: {
                rss_mb: Math.round(mem.rss / 1024 / 1024),
                heapUsed_mb: Math.round(mem.heapUsed / 1024 / 1024),
                heapTotal_mb: Math.round(mem.heapTotal / 1024 / 1024),
            },
        }),
    };
});
// ---------------------------------------------------------------------------
// MCP client: verbind met externe MCP-server via StdIO
// MCP_SERVER_PATH = absoluut pad naar dist/index.js van de doelserver
// ---------------------------------------------------------------------------
async function connectMcpServer(serverPath) {
    const client = new Client({ name: "mcp-debugger-client", version: "1.0.0" }, { capabilities: {} });
    const transport = new StdioClientTransport({
        command: "node",
        args: [serverPath],
    });
    await client.connect(transport);
    const { tools } = await client.listTools();
    for (const tool of tools) {
        registerTool(tool, async (args) => {
            const result = await client.callTool({ name: tool.name, arguments: args });
            // Retourneer de tekst-content direct (MCP-servers sturen markdown als text-blok)
            const textBlock = result.content
                .find((c) => c.type === "text");
            return textBlock?.text ?? result.content;
        });
    }
    console.error(`${tools.length} tools geladen van MCP-server: ${serverPath}\n` +
        tools.map((t) => `  • ${t.name}`).join("\n"));
}
// ---------------------------------------------------------------------------
// Express app
// ---------------------------------------------------------------------------
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));
// GET /api/tools — lijst van beschikbare tools
app.get("/api/tools", (_req, res) => {
    const tools = Array.from(toolRegistry.values()).map((e) => e.definition);
    res.json(tools);
});
// POST /api/call — tool uitvoeren
app.post("/api/call", async (req, res) => {
    const { tool, args = {} } = req.body;
    const requestId = randomUUID();
    const timestamp = new Date().toISOString();
    broadcastEvent("request", { requestId, tool, args, timestamp });
    const start = Date.now();
    const entry = toolRegistry.get(tool);
    if (!entry) {
        const error = `Tool niet gevonden: ${tool}`;
        broadcastEvent("response", { requestId, error, durationMs: 0 });
        res.json({ error });
        return;
    }
    try {
        const result = await entry.handler(args);
        const durationMs = Date.now() - start;
        broadcastEvent("response", { requestId, result, durationMs });
        res.json({ result });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const stack = err instanceof Error ? err.stack : undefined;
        const durationMs = Date.now() - start;
        broadcastEvent("response", { requestId, error: { message }, durationMs });
        res.json({ error: { message, stack } });
    }
});
// GET /api/events — SSE stream
app.get("/api/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    res.write('event: connected\ndata: {"status":"ok"}\n\n');
    sseClients.add(res);
    const ping = setInterval(() => {
        try {
            res.write("event: ping\ndata: {}\n\n");
        }
        catch {
            clearInterval(ping);
        }
    }, 30_000);
    req.on("close", () => {
        clearInterval(ping);
        sseClients.delete(res);
    });
});
// GET /health — Docker healthcheck
app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: Math.floor(process.uptime()) });
});
// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
const port = parseInt(process.env.PORT ?? "3000", 10);
// MCP-server verbinden vóór de HTTP-server start
const mcpServerPath = process.env.MCP_SERVER_PATH;
if (mcpServerPath) {
    try {
        await connectMcpServer(mcpServerPath);
    }
    catch (err) {
        console.error(`Waarschuwing: MCP-server niet bereikbaar (${mcpServerPath}):`, err);
    }
}
app.listen(port, () => {
    console.error(`MCP Debugger gestart op poort ${port}`);
    console.error(`Tools geregistreerd: ${[...toolRegistry.keys()].join(", ")}`);
});
process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason);
});
