import "dotenv/config";

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env ${name}`);
  }
  return value;
}

function optional(name, fallback) {
  return process.env[name] ?? fallback;
}

function optionalNumber(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === null || raw === "") {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric env ${name}: ${raw}`);
  }
  return parsed;
}

export const env = {
  port: optionalNumber("PORT", 3333),
  host: optional("HOST", "127.0.0.1"),
  thaisBaseUrl: required("THAIS_BASE_URL"),
  thaisUsername: required("THAIS_USERNAME"),
  thaisPassword: required("THAIS_PASSWORD"),
  thaisRateIds: optional("THAIS_RATE_IDS", ""),
  thaisDefaultRateId: optionalNumber("THAIS_DEFAULT_RATE_ID", NaN),
};
