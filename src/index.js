import { createMcpServer } from "./mcp/server.js";
import { createApp } from "./app.js";
import { env } from "./config/env.js";

const PORT = env.port;
const HOST = env.host;

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
