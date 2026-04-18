import test from "node:test";
import assert from "node:assert/strict";

import { parseNaturalAvailabilityRequest } from "../src/domain/inputParser.js";

test("parseNaturalAvailabilityRequest parses occupancy and date range", () => {
  const parsed = parseNaturalAvailabilityRequest(
    "2 adultes + 1 enfant du 6 au 12 fevrier 2026"
  );

  assert.equal(parsed.adults, 2);
  assert.equal(parsed.children, 1);
  assert.equal(parsed.infants, 0);
  assert.equal(parsed.checkIn, "2026-02-06");
  assert.equal(parsed.checkOut, "2026-02-12");
});

test("parseNaturalAvailabilityRequest supports person fallback", () => {
  const parsed = parseNaturalAvailabilityRequest("3 personnes du 10 au 13 mars 2026");

  assert.equal(parsed.adults, 3);
  assert.equal(parsed.checkIn, "2026-03-10");
  assert.equal(parsed.checkOut, "2026-03-13");
});

test("parseNaturalAvailabilityRequest rejects empty request", () => {
  assert.throws(() => parseNaturalAvailabilityRequest(""), /request est vide/);
});
