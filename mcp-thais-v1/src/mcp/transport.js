import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

export function createMcpTransport() {
  // Stateless: Claude Desktop peut ouvrir/fermer sans maintenir de session côté serveur
  return new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
}
