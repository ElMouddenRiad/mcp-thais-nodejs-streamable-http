import { z } from "zod";

export function registerListRateIdsTool(mcp) {
  mcp.tool(
    "thais_list_rate_ids",
    {
      includeDefault: z.boolean().optional().describe("Inclure defaultRateId (default: true)"),
    },
    async ({ includeDefault = true } = {}) => {
      const raw = process.env.THAIS_RATE_IDS ?? "";
      const rateIds = raw
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
        .map((x) => Number(x))
        .filter((n) => Number.isInteger(n) && n > 0);

      const defaultRateId = Number(process.env.THAIS_DEFAULT_RATE_ID ?? "");
      const hasDefault = Number.isInteger(defaultRateId) && defaultRateId > 0;

      console.log("[MCP] thais_list_rate_ids", { rateIds, defaultRateId: hasDefault ? defaultRateId : null });

      return {
        content: [{ type: "text", text: `rateIds dispo: ${rateIds.join(", ") || "aucun"}.` }],
        data: {
          ok: true,
          rateIds,
          defaultRateId: includeDefault && hasDefault ? defaultRateId : null,
        },
      };
    }
  );
}
