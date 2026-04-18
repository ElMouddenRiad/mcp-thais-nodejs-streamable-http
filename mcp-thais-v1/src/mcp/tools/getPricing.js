import { z } from "zod";
import { computePricingSummary } from "../../domain/pricingService.js";

export function registerGetPricingTool(mcp) {
  mcp.tool(
    "thais_get_pricing",
    {
      // Keep the schema explicit and strict so LLMs call the tool with valid args.
      checkIn: z.string().describe("YYYY-MM-DD ou DD/MM/YYYY"),
      checkOut: z.string().describe("YYYY-MM-DD ou DD/MM/YYYY"),
      roomTypeId: z.coerce.number().int(),
      rateId: z.coerce.number().int(),
      adults: z.coerce.number().int().min(1),
      children: z.coerce.number().int().min(0).optional(),
      infants: z.coerce.number().int().min(0).optional(),
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
