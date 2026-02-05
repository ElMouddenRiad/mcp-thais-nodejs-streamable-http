// src/index.js
import "dotenv/config";

import { createMcpServer } from "./mcp/server.js";
import { createApp } from "./app.js";

const PORT = Number(process.env.PORT ?? 3333);
const HOST = process.env.HOST ?? "127.0.0.1";

async function main() {
  // 1) MCP server + transport (stateless)
  const { transport } = await createMcpServer();

  // 2) Express app
  const app = createApp({ mcpTransport: transport });

  // 3) Listen
  app.listen(PORT, HOST, () => {
    console.log(`✅ MCP Thaïs V1: http://${HOST}:${PORT}/mcp`);
    console.log(`🔎 Debug: http://${HOST}:${PORT}/debug/check`);
    console.log(`🔎 Debug: http://${HOST}:${PORT}/debug/tool`);
  });
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
