import { z } from "zod";
import { env } from "../../config/env.js";

export function registerListRateIdsTool(mcp) {
  mcp.tool(
    "thais_list_rate_ids",
    {
      includeDefault: z.boolean().optional().describe("Inclure defaultRateId (default: true)"),
    },
    async ({ includeDefault = true } = {}) => {
      const raw = env.thaisRateIds;
      const rateIds = raw
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean)
        .map((x) => Number(x))
        .filter((n) => Number.isInteger(n) && n > 0);

      const defaultRateId = Number(env.thaisDefaultRateId);
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
