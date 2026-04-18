import test from "node:test";
import assert from "node:assert/strict";

import { normalizeDate, nightsBetween, addDays } from "../src/utils/dates.js";

test("normalizeDate handles ISO and FR formats", () => {
  assert.equal(normalizeDate("2026-02-06"), "2026-02-06");
  assert.equal(normalizeDate("06/02/2026"), "2026-02-06");
});

test("nightsBetween computes stay length", () => {
  assert.equal(nightsBetween("2026-02-06", "2026-02-12"), 6);
});

test("addDays supports negative offsets", () => {
  assert.equal(addDays("2026-02-12", -1), "2026-02-11");
});

test("normalizeDate rejects unsupported values", () => {
  assert.throws(() => normalizeDate("2026/02/06"), /Invalid date format/);
});
