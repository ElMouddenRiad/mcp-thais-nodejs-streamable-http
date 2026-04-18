import { z } from "zod";
import { getRoomTypeDetails } from "../../domain/roomDetailsService.js";

export function registerGetRoomDetailsBulkTool(mcp) {
  mcp.tool(
    "thais_get_room_details_bulk",
    {
      roomTypeIds: z.array(z.number().int()).min(1).describe("Liste d'IDs room_type"),
      includeRooms: z.boolean().optional().describe("Inclure les rooms physiques (default: false)"),
    },
    async ({ roomTypeIds, includeRooms = false }) => {
      console.log("[MCP] thais_get_room_details_bulk", { roomTypeIds, includeRooms });

      const items = [];
      for (const roomTypeId of roomTypeIds) {
        const details = await getRoomTypeDetails({ roomTypeId, includeRooms });

        items.push({
          roomTypeId,
          ok: details.ok,
          roomType: details.roomType ?? null,
          roomsCount: Array.isArray(details.rooms) ? details.rooms.length : 0,
          summary: details.summary ?? null,
        });
      }

      const okCount = items.filter((x) => x.ok).length;
      return {
        content: [
          {
            type: "text",
            text: `Détails récupérés: ${okCount}/${items.length}.`,
          },
        ],
        data: { ok: true, count: items.length, items },
      };
    }
  );
}
