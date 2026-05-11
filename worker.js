const encoder = new TextEncoder();

const LOGIN_PATH = "/login";
const LOGOUT_PATH = "/logout";
const FAVICON_PATH = "/favicon.ico";
const COOKIE_NAME = "kenchan_auth";
const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 7;
const DEFAULT_PASSWORD = "ケンシロウスペシャル";

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const expectedPassword = env.BASIC_AUTH_PASSWORD || DEFAULT_PASSWORD;
      const authToken = createAuthToken(expectedPassword, env.AUTH_COOKIE_SALT);

      if (url.pathname === FAVICON_PATH) {
        return new Response(null, {
          status: 204,
          headers: { "cache-control": "public, max-age=3600" },
        });
      }

      if (url.pathname === LOGIN_PATH) {
        if (request.method === "GET") {
          return renderLoginPage(getNextPath(url.searchParams.get("next")), url.searchParams.get("e") === "1");
        }
        if (request.method === "POST") {
          return handleLogin(request, url, expectedPassword, authToken);
        }
        return new Response("Method Not Allowed", { status: 405 });
      }

      if (url.pathname === LOGOUT_PATH) {
        return handleLogout(url);
      }

      if (!hasValidSession(request, authToken)) {
        return redirectToLogin(url);
      }

      try {
        return await env.ASSETS.fetch(request);
      } catch {
        return new Response("Not Found", { status: 404 });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown worker error";
      return new Response(`Worker runtime error: ${message}`, {
        status: 500,
        headers: { "content-type": "text/plain; charset=UTF-8", "cache-control": "no-store" },
      });
    }
  },
};

async function handleLogin(request, url, expectedPassword, authToken) {
  let submittedPassword = "";
  let nextPath = "/";

  try {
    const form = await request.formData();
    submittedPassword = String(form.get("password") || "");
    nextPath = getNextPath(form.get("next"));
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  if (!timingSafeEqual(submittedPassword, expectedPassword)) {
    const failureUrl = new URL(LOGIN_PATH, url.origin);
    failureUrl.searchParams.set("e", "1");
    failureUrl.searchParams.set("next", nextPath);
    return Response.redirect(failureUrl.toString(), 302);
  }

  const successUrl = new URL(nextPath, url.origin);
  const response = Response.redirect(successUrl.toString(), 302);
  response.headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=${authToken}; Path=/; Max-Age=${COOKIE_TTL_SECONDS}; HttpOnly; Secure; SameSite=Lax`
  );
  return response;
}

function handleLogout(url) {
  const response = Response.redirect(new URL(LOGIN_PATH, url.origin).toString(), 302);
  response.headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`
  );
  return response;
}

function hasValidSession(request, token) {
  const cookies = parseCookies(request.headers.get("Cookie") || "");
  return cookies[COOKIE_NAME] === token;
}

function parseCookies(cookieHeader) {
  const cookies = {};
  for (const part of cookieHeader.split(";")) {
    const [rawKey, ...rawValue] = part.trim().split("=");
    if (!rawKey) continue;
    cookies[rawKey] = rawValue.join("=");
  }
  return cookies;
}

function redirectToLogin(url) {
  const loginUrl = new URL(LOGIN_PATH, url.origin);
  loginUrl.searchParams.set("next", `${url.pathname}${url.search}`);
  return Response.redirect(loginUrl.toString(), 302);
}

function getNextPath(rawNext) {
  const nextValue = String(rawNext || "/");
  if (!nextValue.startsWith("/")) return "/";
  if (nextValue.startsWith("//")) return "/";
  return nextValue;
}

function createAuthToken(password, salt = "kenchan-cookie") {
  const source = `${password}:${salt}`;
  let hash = 2166136261;
  for (let i = 0; i < source.length; i += 1) {
    hash ^= source.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `k${(hash >>> 0).toString(16)}`;
}

function timingSafeEqual(a, b) {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  const maxLen = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length === bBytes.length ? 0 : 1;
  for (let i = 0; i < maxLen; i += 1) {
    const av = i < aBytes.length ? aBytes[i] : 0;
    const bv = i < bBytes.length ? bBytes[i] : 0;
    diff |= av ^ bv;
  }
  return diff === 0;
}

function renderLoginPage(nextPath, showError) {
  const errorHtml = showError ? "<p class='error'>パスワードが違います。</p>" : "";
  const html = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ログイン | けんちゃんゲーム</title>
  <link rel="icon" href="data:," />
  <style>
    :root { color-scheme: light; }
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      font-family: "Hiragino Sans", "Yu Gothic UI", sans-serif;
      background: linear-gradient(165deg, #2b1408, #5b3219 55%, #2f160a);
      color: #2b1a12;
    }
    .card {
      width: min(92vw, 420px);
      padding: 28px 24px;
      border-radius: 18px;
      background: rgba(255, 245, 226, 0.96);
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.34);
    }
    h1 { margin: 0 0 10px; font-size: 1.45rem; }
    p { margin: 0 0 16px; line-height: 1.5; }
    input {
      width: 100%;
      box-sizing: border-box;
      padding: 12px 14px;
      border-radius: 10px;
      border: 1px solid #c2a989;
      font-size: 1rem;
      outline: none;
    }
    input:focus { border-color: #8b3d26; box-shadow: 0 0 0 3px rgba(139, 61, 38, 0.15); }
    button {
      width: 100%;
      margin-top: 12px;
      border: 0;
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 1rem;
      font-weight: 700;
      color: #fff;
      background: linear-gradient(180deg, #b92f28, #8f1b16);
      cursor: pointer;
    }
    .error {
      margin: 0 0 12px;
      color: #b00020;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <main class="card">
    <h1>けんちゃんゲーム</h1>
    <p>パスワードを入力してゲームに入ってください。</p>
    ${errorHtml}
    <form method="post" action="${LOGIN_PATH}">
      <input type="hidden" name="next" value="${escapeHtml(nextPath)}" />
      <input type="password" name="password" placeholder="パスワード" autocomplete="current-password" required />
      <button type="submit">入る</button>
    </form>
  </main>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=UTF-8",
      "cache-control": "no-store",
    },
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
