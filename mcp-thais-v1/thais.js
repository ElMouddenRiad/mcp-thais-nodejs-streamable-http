import "dotenv/config";

const BASE_URL = process.env.THAIS_BASE_URL;
const USERNAME = process.env.THAIS_USERNAME;
const PASSWORD = process.env.THAIS_PASSWORD;

let cache = null;

async function login() {
  const res = await fetch(`${BASE_URL}/hub/api/partner/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });

  if (!res.ok) throw new Error(`Thaïs login failed: ${res.status} ${await res.text()}`);

  const { token } = await res.json();
  // Le token dure environ 10 minutes, on prend une marge
  return { token, expiresAtMs: Date.now() + 9 * 60 * 1000 };
}

export async function getToken() {
  if (cache && Date.now() < cache.expiresAtMs) return cache.token;
  cache = await login();
  return cache.token;
}

export async function thaisGet(path, query = {}) {
  const token = await getToken();

  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, String(v));

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) throw new Error(`Thaïs GET failed: ${res.status} ${await res.text()}`);

  return res.json();
}
