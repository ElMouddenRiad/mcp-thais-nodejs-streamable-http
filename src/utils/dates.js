export function isIsoDate(s) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(s));
}

export function normalizeDate(input) {
  const s = String(input).trim();

  // YYYY-MM-DD
  if (isIsoDate(s)) return s;

  // DD/MM/YYYY
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s);
  if (m) {
    const [, dd, mm, yyyy] = m;
    return `${yyyy}-${mm}-${dd}`;
  }

  throw new Error(`Invalid date format: ${s}`);
}

export function addDays(isoDate, days) {
  if (!isIsoDate(isoDate)) {
    throw new Error(`Invalid isoDate (expected YYYY-MM-DD): ${isoDate}`);
  }
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + Number(days));
  return d.toISOString().slice(0, 10);
}

export function nightsBetween(checkInIso, checkOutIso) {
  if (!isIsoDate(checkInIso) || !isIsoDate(checkOutIso)) {
    throw new Error(`nightsBetween expects ISO dates, got: ${checkInIso} / ${checkOutIso}`);
  }
  const a = new Date(`${checkInIso}T00:00:00Z`);
  const b = new Date(`${checkOutIso}T00:00:00Z`);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}
