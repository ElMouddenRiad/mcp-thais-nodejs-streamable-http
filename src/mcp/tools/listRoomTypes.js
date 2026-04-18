import { z } from "zod";
import { getRoomTypes } from "../../thais/endpoints.js";

export const listRoomTypesSchema = {
  includePrivate: z.boolean().optional().describe("Inclure les room-types non publics (default: false)"),
  limit: z.coerce.number().int().min(1).max(50).optional().describe("Nombre max d'éléments affichés (default: 20)"),
};

export function registerListRoomTypesTool(mcp) {
  mcp.tool("thais_list_room_types", listRoomTypesSchema, async ({ includePrivate = false, limit = 20 } = {}) => {
    console.log("[MCP] thais_list_room_types", { includePrivate, limit });

    const roomTypes = await getRoomTypes();

    const list = roomTypes
      .filter((rt) => rt.deleted === false)
      .filter((rt) => (includePrivate ? true : rt.public === true))
      .map((rt) => ({
        id: Number(rt.id),
        label: String(rt.label ?? ""),
        minPersons: Number(rt.nb_persons_min),
        maxPersons: Number(rt.nb_persons_max),
        subject_to_pricing: Boolean(rt.subject_to_pricing),
        public: Boolean(rt.public),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const preview = list
      .slice(0, limit)
      .map((rt) => `- [id=${rt.id}] ${rt.label} (capacité ${rt.minPersons}-${rt.maxPersons})`);

    const text =
      `Room types récupérés: ${list.length}.\n` +
      (preview.length ? preview.join("\n") : "Aucun room-type.");

    return {
      content: [{ type: "text", text }],
      data: { ok: true, count: list.length, roomTypes: list },
    };
  });
}
