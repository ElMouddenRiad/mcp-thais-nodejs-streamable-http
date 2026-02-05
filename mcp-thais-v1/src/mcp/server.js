import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpTransport } from "./transport.js";

import { registerCheckAvailabilityTool } from "./tools/checkAvailability.js";
import { registerListRoomTypesTool } from "./tools/listRoomTypes.js";
import { registerGetRoomDetailsTool } from "./tools/getRoomDetails.js";
import { registerCreateEReservationTool } from "./tools/createEReservation.js";

import { registerGetPricingTool } from "./tools/getPricing.js";
import { registerGetRoomDetailsBulkTool } from "./tools/getRoomDetailsBulk.js";
import { registerListRateIdsTool } from "./tools/listRateIds.js";

export async function createMcpServer() {
  const mcp = new McpServer({ name: "mcp-thais-v1", version: "1.0.0" });

  registerCheckAvailabilityTool(mcp);
  registerListRoomTypesTool(mcp);

  registerGetRoomDetailsTool(mcp);
  registerGetRoomDetailsBulkTool(mcp);

  registerListRateIdsTool(mcp);
  registerGetPricingTool(mcp);

  registerCreateEReservationTool(mcp);

  const transport = createMcpTransport();
  await mcp.connect(transport);

  return { mcp, transport };
}
