import "dotenv/config";
import express from "express";
import { z } from "zod";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

import { thaisGet } from "./thais.js";

const PORT = Number(process.env.PORT ?? 3333);
const HOST = "127.0.0.1";

function assertIsoDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw new Error(`Invalid date format (expected YYYY-MM-DD): ${s}`);
  }
}

function nightsBetween(checkIn, checkOut) {
  const a = new Date(`${checkIn}T00:00:00Z`);
  const b = new Date(`${checkOut}T00:00:00Z`);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

// ---- Core business logic (factorisée) ----
async function computeAvailability({ checkIn, checkOut, adults }) {
  checkIn = normalizeDate(checkIn);
  checkOut = normalizeDate(checkOut);

  //assertIsoDate(checkIn);
  //assertIsoDate(checkOut);

  const lastNightDate = addDays(checkOut, -1);

  const nights = nightsBetween(checkIn, checkOut);
  if (nights <= 0) {
    return {
      ok: false,
      query: { checkIn, checkOut, adults },
      summary: "checkOut doit être après checkIn.",
    };
  }

  const roomTypes = await thaisGet("/hub/api/partner/hotel/room-types");

  const compatible = roomTypes
    .filter((rt) => rt.deleted === false)
    .filter((rt) => rt.public === true)
    .filter((rt) => rt.subject_to_pricing === true)
    .filter((rt) => typeof rt.nb_persons_min === "number" && typeof rt.nb_persons_max === "number")
    .filter((rt) => adults >= rt.nb_persons_min && adults <= rt.nb_persons_max)
    .map((rt) => ({
      id: rt.id,
      label: rt.label,
      minPersons: rt.nb_persons_min,
      maxPersons: rt.nb_persons_max,
      public: rt.public,
    }));

  if (compatible.length === 0) {
    return {
      ok: true,
      query: { checkIn, checkOut, adults },
      nights,
      availableRoomTypes: [],
      topOptions: [],
      notAvailableRoomTypesCount: 0,
      summary: `Aucun type de chambre ne supporte ${adults} adulte(s) (selon room-types).`,
      humanReadable: `Je ne trouve aucun type de chambre compatible avec ${adults} adulte(s).`,
      debug: { compatibleRoomTypesCount: 0, availRowsReceived: 0 },
    };
  }

  const compatibleIds = new Set(compatible.map((x) => x.id));

  const avails = await thaisGet("/hub/api/partner/hotel/apr/availabilities/currents", {
    from: checkIn,
    to: checkOut,
  });

  const minByType = new Map(); // typeId -> { min, datesCount }
  for (const row of avails) {
    const typeId = row.room_type_id;
    if (!compatibleIds.has(typeId)) continue;

    const avail = Number(row.availability ?? 0);
    const prev = minByType.get(typeId);
    if (!prev) minByType.set(typeId, { min: avail, datesCount: 1 });
    else {
      prev.min = Math.min(prev.min, avail);
      prev.datesCount += 1;
    }
  }

  const availableRoomTypes = compatible
    .map((rt) => {
      const stats = minByType.get(rt.id) ?? { min: 0, datesCount: 0 };
      return {
        ...rt,
        minAvailabilityOverPeriod: stats.min,
        samples: stats.datesCount,
        isAvailable: stats.min > 0,
      };
    })
    .filter((x) => x.isAvailable)
    .sort((a, b) => b.minAvailabilityOverPeriod - a.minAvailabilityOverPeriod);

  const notAvailableCount = compatible.length - availableRoomTypes.length;

  const summary =
    availableRoomTypes.length > 0
      ? `Oui : ${availableRoomTypes.length} type(s) de chambre dispo pour ${adults} adulte(s) du ${checkIn} au ${lastNightDate} (${nights} nuit(s))..`
      : `Non : aucune disponibilité pour ${adults} adulte(s) du ${checkIn} au ${checkOut} (selon l'inventaire).`;

  const humanReadable =
    availableRoomTypes.length > 0
      ? `Oui, il y a de la disponibilité pour ${adults} adulte(s) du ${checkIn} au ${lastNightDate} (${nights} nuit(s)).\n` +
        `Options disponibles :\n` +
        availableRoomTypes
          .slice(0, 3)
          .map(
            (rt) =>
              `- ${rt.label} (capacité ${rt.minPersons}-${rt.maxPersons}, dispo min: ${rt.minAvailabilityOverPeriod})`
          )
          .join("\n")
      : `Non, je ne vois aucune disponibilité pour ${adults} adulte(s) du ${checkIn} au ${lastNightDate} (${nights} nuit(s)).`;

  const topOptions = availableRoomTypes.slice(0, 3).map((rt) => ({
    roomTypeId: rt.id,
    label: rt.label,
    capacity: { min: rt.minPersons, max: rt.maxPersons },
    minAvailabilityOverPeriod: rt.minAvailabilityOverPeriod,
  }));

  return {
    ok: true,
    query: { checkIn, checkOut, adults },
    nights,
    availableRoomTypes,
    topOptions,
    notAvailableRoomTypesCount: notAvailableCount,
    summary,
    humanReadable,
    debug: {
      compatibleRoomTypesCount: compatible.length,
      availRowsReceived: Array.isArray(avails) ? avails.length : null,
    },
  };
}

// ---- MCP server ----
const mcp = new McpServer({ name: "mcp-thais-v1", version: "1.0.0" });

mcp.tool(
  "thais_check_availability",
  {
    checkIn: z.string().describe(
      "Date d'arrivée (YYYY-MM-DD ou DD/MM/YYYY). IMPORTANT: ne pas refuser les dates passées (environnement de démo)."
    ),
    checkOut: z.string().describe(
      "Date de départ (YYYY-MM-DD ou DD/MM/YYYY). IMPORTANT: ne pas refuser les dates passées (environnement de démo)."
    ),
    adults: z.number().int().min(1).describe("Nombre d'adultes"),
  },
  async ({ checkIn, checkOut, adults }) => {
    console.log("[MCP] thais_check_availability", { checkIn, checkOut, adults });

    const result = await computeAvailability({ checkIn, checkOut, adults });

    return {
      content: [
        {
          type: "text",
          text: result.humanReadable ?? result.summary ?? "Résultat disponibilité calculé.",
        },
      ],
      data: result,
    };
  }
);


mcp.tool(
  "thais_list_room_types",
  {
    includePrivate: z.boolean().optional().describe("Inclure les room-types non publics"),
  },
  async ({ includePrivate } = {}) => {
    console.log("[MCP] thais_list_room_types", { includePrivate });
    const roomTypes = await thaisGet("/hub/api/partner/hotel/room-types");

    const list = roomTypes
      .filter((rt) => rt.deleted === false)
      .filter((rt) => (includePrivate ? true : rt.public === true))
      .map((rt) => ({
        id: rt.id,
        label: rt.label,
        minPersons: rt.nb_persons_min,
        maxPersons: rt.nb_persons_max,
        subject_to_pricing: rt.subject_to_pricing,
        public: rt.public,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return {
      content: [{ type: "text", text: `Room types récupérés: ${list.length}.` }],
      data: {
        ok: true,
        count: list.length,
        roomTypes: list,
      },
    };
  }
);

// ---- Express app ----
const app = express();
app.use(express.json({ limit: "2mb" }));

// Debug endpoints
app.get("/debug/check", async (req, res) => {
  try {
    const checkIn = String(req.query.checkIn ?? "2021-03-15");
    const checkOut = String(req.query.checkOut ?? "2021-03-25");
    const adults = Number(req.query.adults ?? 2);

    const roomTypes = await thaisGet("/hub/api/partner/hotel/room-types");
    const compatible = roomTypes
      .filter((rt) => rt.public === true)
      .filter((rt) => rt.subject_to_pricing === true)
      .filter((rt) => rt.deleted === false)
      .filter((rt) => adults >= rt.nb_persons_min && adults <= rt.nb_persons_max);

    const ids = new Set(compatible.map((x) => x.id));

    const avails = await thaisGet("/hub/api/partner/hotel/apr/availabilities/currents", {
      from: checkIn,
      to: checkOut,
    });

    const minByType = new Map();
    for (const row of avails) {
      if (!ids.has(row.room_type_id)) continue;
      const avail = Number(row.availability ?? 0);
      const prev = minByType.get(row.room_type_id);
      minByType.set(row.room_type_id, prev == null ? avail : Math.min(prev, avail));
    }

    const available = compatible
      .map((rt) => ({
        id: rt.id,
        label: rt.label,
        minAvail: minByType.get(rt.id) ?? 0,
        capacity: `${rt.nb_persons_min}-${rt.nb_persons_max}`,
      }))
      .filter((x) => x.minAvail > 0);

    res.json({ ok: true, query: { checkIn, checkOut, adults }, available });
  } catch (e) {
    res.status(500).send(String(e?.message ?? e));
  }
});

app.get("/debug/tool", async (req, res) => {
  try {
    const checkIn = String(req.query.checkIn ?? "2021-03-15");
    const checkOut = String(req.query.checkOut ?? "2021-03-25");
    const adults = Number(req.query.adults ?? 2);

    const result = await computeAvailability({ checkIn, checkOut, adults });
    res.json(result);
  } catch (e) {
    res.status(500).send(String(e?.message ?? e));
  }
});

// MCP Streamable HTTP route
// --- Transport unique (stateless) ---
const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined, // stateless
});
await mcp.connect(transport);

// Route MCP
app.post("/mcp", async (req, res) => {
  try {
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

// Optionnel : refuser GET/DELETE proprement
app.get("/mcp", (req, res) => res.status(405).send("Method not allowed"));
app.delete("/mcp", (req, res) => res.status(405).send("Method not allowed"));


function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function normalizeDate(s) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (m) {
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }
  throw new Error(`Invalid date format: ${s}`);
}

app.listen(PORT, HOST, () => {
  console.log(`✅ MCP Thaïs V1: http://${HOST}:${PORT}/mcp`);
  console.log(`🔎 Debug: http://${HOST}:${PORT}/debug/check`);
  console.log(`🔎 Debug: http://${HOST}:${PORT}/debug/tool`);
});
