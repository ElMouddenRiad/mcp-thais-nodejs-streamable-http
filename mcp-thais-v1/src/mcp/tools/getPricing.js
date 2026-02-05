import { z } from "zod";
import { computePricingSummary } from "../../domain/pricingService.js";

export function registerGetPricingTool(mcp) {
  mcp.tool(
    "thais_get_pricing",
    description="Obtenir le tarif total et la taxe de séjour pour un room_type et rate_id donnés sur une période donnée.",
    {
      checkIn: z.string().describe("YYYY-MM-DD ou DD/MM/YYYY"),
      checkOut: z.string().describe("YYYY-MM-DD ou DD/MM/YYYY"),
      roomTypeId: z.number().int(),
      rateId: z.number().int(),
      adults: z.number().int().min(1),
      children: z.number().int().min(0).optional(),
      infants: z.number().int().min(0).optional(),
    },
    async (input) => {
      console.log("[MCP] thais_get_pricing", input);

      const data = await computePricingSummary(input);

      const text = data.ok
        ? `Tarif OK. Total: ${data.totalPrice ?? "N/A"} (taxe: ${data.touristTax ?? "N/A"}).`
        : `Tarif KO. ${JSON.stringify(data.messages ?? data.raw?.messages ?? {})}`;

      return { content: [{ type: "text", text }], data };
    }
  );
}
