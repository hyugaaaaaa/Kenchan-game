const encoder = new TextEncoder();
const decoder = new TextDecoder();
const AUTH_REALM = 'Kenchan Game';
const DEFAULT_USER = "admin";

export default {
  async fetch(request, env) {
    const expectedUser = env.BASIC_AUTH_USERNAME || DEFAULT_USER;
    const expectedPass = env.BASIC_AUTH_PASSWORD;

    if (!expectedPass) {
      return new Response("Authentication is not configured on this deployment.", {
        status: 500,
        headers: {
          "cache-control": "no-store",
          "content-type": "text/plain; charset=UTF-8",
        },
      });
    }

    if (!isAuthorized(request, expectedUser, expectedPass)) {
      return new Response("認証が必要です", {
        status: 401,
        headers: {
          "WWW-Authenticate": `Basic realm="${AUTH_REALM}", charset="UTF-8"`,
          "cache-control": "no-store",
          "content-type": "text/plain; charset=UTF-8",
        },
      });
    }

    return env.ASSETS.fetch(request);
  },
};

function isAuthorized(request, expectedUser, expectedPass) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) return false;

  const [scheme, encoded] = authHeader.split(" ");
  if (scheme !== "Basic" || !encoded) return false;

  let decoded;
  try {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    decoded = decoder.decode(bytes);
  } catch {
    return false;
  }

  const separator = decoded.indexOf(":");
  if (separator < 0) return false;

  const user = decoded.slice(0, separator);
  const pass = decoded.slice(separator + 1);

  return timingSafeEqual(expectedUser, user) && timingSafeEqual(expectedPass, pass);
}

function timingSafeEqual(a, b) {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);

  if (aBytes.byteLength !== bBytes.byteLength) {
    return !crypto.subtle.timingSafeEqual(aBytes, aBytes);
  }

  return crypto.subtle.timingSafeEqual(aBytes, bBytes);
}
