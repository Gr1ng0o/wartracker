import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import {
  authorizeApi,
  createSession,
  getAdminKey,
  isSameOrigin,
  safeReturnPath,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  verifySession,
} from "../lib/auth";
import { POST as login } from "../app/api/auth/login/route";
import { POST as logout } from "../app/api/auth/logout/route";

const originalKey = process.env.ADMIN_KEY;
const originalUrl = process.env.APP_URL;
const key = "local-test-key-with-at-least-32-characters";
beforeEach(() => {
  process.env.ADMIN_KEY = key;
  delete process.env.APP_URL;
});
afterEach(() => {
  if (originalKey === undefined) delete process.env.ADMIN_KEY;
  else process.env.ADMIN_KEY = originalKey;
  if (originalUrl === undefined) delete process.env.APP_URL;
  else process.env.APP_URL = originalUrl;
});

test("sessions expire, reject tampering and are invalidated by key rotation", () => {
  const now = Date.now();
  const token = createSession(now);
  assert.equal(verifySession(token, now), true);
  assert.equal(verifySession(token, now + SESSION_TTL_SECONDS * 1000), false);
  assert.equal(
    verifySession(token.slice(0, -1) + (token.endsWith("a") ? "b" : "a"), now),
    false,
  );
  assert.equal(verifySession("invalid", now), false);
  process.env.ADMIN_KEY = key + "rotated";
  assert.equal(verifySession(token, now), false);
});

test("missing or short configuration fails closed", () => {
  for (const value of ["", "short"]) {
    process.env.ADMIN_KEY = value;
    assert.equal(getAdminKey(), null);
    assert.equal(
      authorizeApi(new Request("https://local.test/api/games"))?.status,
      503,
    );
  }
});

test("writes require a valid session or an API key", () => {
  assert.equal(
    authorizeApi(new Request("https://local.test/api/games"))?.status,
    401,
  );
  assert.equal(
    authorizeApi(
      new Request("https://local.test/api/games", {
        headers: { "x-admin-key": "wrong" },
      }),
    )?.status,
    401,
  );
  assert.equal(
    authorizeApi(
      new Request("https://local.test/api/games", {
        headers: { "x-admin-key": key },
      }),
    ),
    null,
  );
  const headers = {
    cookie: `${SESSION_COOKIE}=${createSession()}`,
    origin: "https://local.test",
  };
  assert.equal(
    authorizeApi(new Request("https://local.test/api/games", { headers })),
    null,
  );
  assert.equal(
    authorizeApi(
      new Request("https://local.test/api/games", {
        headers: { ...headers, origin: "https://evil.test" },
      }),
    )?.status,
    403,
  );
  assert.equal(
    authorizeApi(
      new Request("https://local.test/api/games", {
        headers: { cookie: headers.cookie, "sec-fetch-site": "cross-site" },
      }),
    )?.status,
    403,
  );
});

test("deployment origin can be configured without trusting forwarded headers", () => {
  process.env.APP_URL = "https://wartracker.example";
  assert.equal(
    isSameOrigin(
      new Request("http://internal:3000", {
        headers: { origin: "https://wartracker.example" },
      }),
    ),
    true,
  );
  assert.equal(
    isSameOrigin(
      new Request("http://internal:3000", {
        headers: {
          origin: "https://evil.test",
          "x-forwarded-host": "evil.test",
        },
      }),
    ),
    false,
  );
});

test("return URLs cannot redirect to an external site", () => {
  for (const value of [
    "//evil.test",
    "/\\evil.test",
    "https://evil.test",
    "/\r\nevil",
    null,
  ])
    assert.equal(safeReturnPath(value), "/");
  assert.equal(
    safeReturnPath("/fab/games?search=Enigma"),
    "/fab/games?search=Enigma",
  );
});

test("login issues an HttpOnly session, rejects a wrong key and logout expires the cookie", async () => {
  const request = (password: string) =>
    new Request("https://local.test/api/auth/login", {
      method: "POST",
      headers: { origin: "https://local.test" },
      body: new URLSearchParams({ password, next: "/fab/games" }),
    });
  const denied = await login(request("wrong"));
  assert.equal(denied.status, 303);
  assert.equal(denied.headers.get("set-cookie"), null);
  const accepted = await login(request(key));
  assert.equal(accepted.status, 303);
  assert.equal(
    accepted.headers.get("location"),
    "https://local.test/fab/games",
  );
  const cookie = accepted.headers.get("set-cookie")!;
  assert.match(cookie, /HttpOnly/i);
  assert.match(cookie, /SameSite=strict/i);
  const token = cookie.split(";")[0].slice(SESSION_COOKIE.length + 1);
  assert.equal(verifySession(token), true);
  const exited = await logout(
    new Request("https://local.test/api/auth/logout", {
      method: "POST",
      headers: { origin: "https://local.test" },
    }),
  );
  assert.match(exited.headers.get("set-cookie")!, /Max-Age=0/i);
});

test("login rejects cross-origin form submissions and missing server configuration", async () => {
  const request = () =>
    new Request("https://local.test/api/auth/login", {
      method: "POST",
      headers: { origin: "https://evil.test" },
      body: new URLSearchParams({ password: key }),
    });
  assert.equal((await login(request())).status, 403);
  delete process.env.ADMIN_KEY;
  assert.equal(
    (
      await login(
        new Request("https://local.test/api/auth/login", { method: "POST" }),
      )
    ).status,
    503,
  );
});

test("login redirects to the configured public origin behind a reverse proxy", async () => {
  process.env.APP_URL = "https://wartracker.example";
  const response = await login(new Request("http://internal:3000/api/auth/login", {
    method: "POST",
    headers: { origin: "https://wartracker.example" },
    body: new URLSearchParams({ password: key, next: "/fab/games" }),
  }));
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), "https://wartracker.example/fab/games");
});

test("production login cookies require HTTPS", async () => {
  const previous = process.env.NODE_ENV;
  try {
    Reflect.set(process.env, "NODE_ENV", "production");
    const response = await login(new Request("https://local.test/api/auth/login", {
      method: "POST",
      headers: { origin: "https://local.test" },
      body: new URLSearchParams({ password: key }),
    }));
    assert.match(response.headers.get("set-cookie")!, /; Secure/i);
  } finally {
    if (previous === undefined) Reflect.deleteProperty(process.env, "NODE_ENV");
    else Reflect.set(process.env, "NODE_ENV", previous);
  }
});
