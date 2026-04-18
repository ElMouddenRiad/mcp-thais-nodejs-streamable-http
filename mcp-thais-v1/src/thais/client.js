import { env } from "../config/env.js";

const BASE_URL = env.thaisBaseUrl;
const USERNAME = env.thaisUsername;
const PASSWORD = env.thaisPassword;

let cache = null; // { token, expiresAtMs }

async function login() {
  const res = await fetch(`${BASE_URL}/hub/api/partner/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });

  if (!res.ok) {
    throw new Error(`Thaïs login failed: ${res.status} ${await res.text()}`);
  }

  const { token } = await res.json();
  // Token ~10 min, on prend marge 9 min
  return { token, expiresAtMs: Date.now() + 9 * 60 * 1000 };
}

export async function getToken() {
  if (cache && Date.now() < cache.expiresAtMs) return cache.token;
  cache = await login();
  return cache.token;
}

function buildUrl(path, query = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    url.searchParams.set(k, String(v));
  }
  return url;
}

async function requestJson(method, path, { query, body } = {}) {
  const token = await getToken();
  const url = buildUrl(path, query);

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Thaïs ${method} failed: ${res.status} ${await res.text()}`);
  }

  return res.json();
}

export function thaisGet(path, query = {}) {
  return requestJson("GET", path, { query });
}

// (optionnel maintenant, utile plus tard)
export function thaisPost(path, body = {}, query = {}) {
  return requestJson("POST", path, { query, body });
}
