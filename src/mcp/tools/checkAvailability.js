import { z } from "zod";
import { computeAvailability } from "../../domain/availabilityService.js";
import { parseNaturalAvailabilityRequest } from "../../domain/inputParser.js";

export function registerCheckAvailabilityTool(mcp) {
  mcp.tool(
    "thais_check_availability",
    {
      request: z
        .string()
        .optional()
        .describe(
          "Requête en français naturel. Ex: '2 adultes + 1 enfant du 7 au 12 février 2026'. Si fourni, remplace checkIn/checkOut."
        ),

      checkIn: z.string().optional().describe("Date d'arrivée (YYYY-MM-DD ou DD/MM/YYYY). Ex: 2026-02-07"),
      checkOut: z.string().optional().describe("Date de départ (YYYY-MM-DD ou DD/MM/YYYY). Ex: 2026-02-12"),

      adults: z.coerce.number().int().min(1).optional().describe("Nombre d'adultes (>=1)"),
      children: z.coerce.number().int().min(0).optional().describe("Nombre d'enfants (>=0)"),
      infants: z.coerce.number().int().min(0).optional().describe("Nombre de bébés (>=0)"),
    },
    async (input) => {
      console.log("[MCP] thais_check_availability", input);

      let checkIn, checkOut, adults, children, infants;

      if (input.request) {
        const parsed = parseNaturalAvailabilityRequest(input.request);
        ({ checkIn, checkOut, adults, children, infants } = parsed);
      } else {
        checkIn = input.checkIn;
        checkOut = input.checkOut;
        adults = input.adults;
        children = input.children ?? 0;
        infants = input.infants ?? 0;
      }

      if (!checkIn || !checkOut || !adults) {
        return {
          content: [
            {
              type: "text",
              text:
                "Entrée incomplète. Fournis soit request (ex: '2 adultes + 1 enfant du 7 au 12 février 2026'), soit checkIn/checkOut/adults.",
            },
          ],
          data: { ok: false },
        };
      }

      const result = await computeAvailability({ checkIn, checkOut, adults, children, infants });

      const text = result.humanReadable ?? result.summary ?? "Résultat disponibilité calculé.";
      return { content: [{ type: "text", text }], data: result };
    }
  );
}
