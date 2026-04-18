import express from "express";
import { createDebugRouter } from "./debug/routes.js";

export function createApp({ mcpTransport }) {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "mcp-thais-v1" });
  });

  app.post("/mcp", async (req, res) => {
    try {
      await mcpTransport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("Error handling MCP request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  app.get("/mcp", (req, res) => res.status(405).send("Method not allowed"));
  app.delete("/mcp", (req, res) => res.status(405).send("Method not allowed"));

  // Monte le router sur /debug
  app.use("/debug", createDebugRouter());

  return app;
}
