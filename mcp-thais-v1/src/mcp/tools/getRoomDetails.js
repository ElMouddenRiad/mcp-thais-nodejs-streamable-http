import { z } from "zod";
import { getRoomTypeDetails } from "../../domain/roomDetailsService.js";

export function registerGetRoomDetailsTool(mcp) {
  mcp.tool(
    "thais_get_room_details",
    {
      roomTypeId: z.coerce.number().int().describe("ID du room_type"),
      includeRooms: z.boolean().optional().describe("Inclure les rooms physiques (default: false)"),
    },
    async ({ roomTypeId, includeRooms = false }) => {
      console.log("[MCP] thais_get_room_details", { roomTypeId, includeRooms });

      const data = await getRoomTypeDetails({ roomTypeId, includeRooms });

      if (!data.ok) {
        return { content: [{ type: "text", text: data.summary ?? "Room type introuvable." }], data };
      }

      const rt = data.roomType;
      const desc = (rt.description ?? "").trim();

      const text =
        `Room type [id=${rt.id}] "${rt.label}"\n` +
        `- Capacité: ${rt.minPersons}-${rt.maxPersons}\n` +
        `- public=${rt.public}, pricing=${rt.subject_to_pricing}\n` +
        (desc ? `- Description: ${desc}\n` : "") +
        `- Rooms physiques trouvées: ${Array.isArray(data.rooms) ? data.rooms.length : 0}`;

      return { content: [{ type: "text", text }], data };
    }
  );
}
