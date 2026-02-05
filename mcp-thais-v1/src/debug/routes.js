import { Router } from "express";
import { computeAvailability } from "../domain/availabilityService.js";
import { getRoomTypes, getAvailabilitiesCurrents } from "../thais/endpoints.js";

export function createDebugRouter() {
  const router = Router();

  router.get("/check", async (req, res) => {
    try {
      const checkIn = String(req.query.checkIn ?? "2021-03-15");
      const checkOut = String(req.query.checkOut ?? "2021-03-25");
      const adults = Number(req.query.adults ?? 2);
      const partySize = adults + children + infants;

      const roomTypes = await getRoomTypes();
      const compatible = roomTypes
        .filter((rt) => rt.public === true)
        .filter((rt) => rt.subject_to_pricing === true)
        .filter((rt) => rt.deleted === false)

.filter((rt) => partySize >= rt.nb_persons_min && partySize <= rt.nb_persons_max)

      const ids = new Set(compatible.map((x) => x.id));
      const avails = await getAvailabilitiesCurrents({ from: checkIn, to: checkOut });

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

  router.get("/tool", async (req, res) => {
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

  return router;
}
