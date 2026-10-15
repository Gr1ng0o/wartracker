import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const SESSION_COOKIE = "wartracker_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export function getAdminKey(): string | null {
  const key = process.env.ADMIN_KEY;
  return key && key.length >= 32 && key.length <= 512 ? key : null;
}

function equalSecrets(a: string, b: string): boolean {
  return timingSafeEqual(
    createHash("sha256").update(a).digest(),
    createHash("sha256").update(b).digest(),
  );
}

export function verifyAdminKey(value: string): boolean {
  const key = getAdminKey();
  return key !== null && equalSecrets(value, key);
}

export function createSession(now = Date.now()): string {
  const key = getAdminKey();
  if (!key) throw new Error("ADMIN_KEY must contain at least 32 characters");
  const expires = Math.floor(now / 1000) + SESSION_TTL_SECONDS;
  const payload = `${expires}.${randomBytes(24).toString("base64url")}`;
  return `${payload}.${createHmac("sha256", key).update(payload).digest("base64url")}`;
}

export function verifySession(
  token: string | undefined,
  now = Date.now(),
): boolean {
  const key = getAdminKey();
  if (!key || !token || token.length > 256) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expires, nonce, signature] = parts;
  if (
    !/^\d+$/.test(expires) ||
    !/^[\w-]{32}$/.test(nonce) ||
    !/^[\w-]{43}$/.test(signature)
  )
    return false;
  const timestamp = Number(expires);
  const nowSeconds = Math.floor(now / 1000);
  if (
    !Number.isSafeInteger(timestamp) ||
    timestamp <= nowSeconds ||
    timestamp > nowSeconds + SESSION_TTL_SECONDS
  )
    return false;
  const expected = createHmac("sha256", key)
    .update(`${expires}.${nonce}`)
    .digest("base64url");
  return equalSecrets(signature, expected);
}

export function hasSession(req: Request): boolean {
  const token = req.headers
    .get("cookie")
    ?.split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  return verifySession(token);
}

export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site";
  try {
    return (
      new URL(origin).origin === new URL(process.env.APP_URL || req.url).origin
    );
  } catch {
    return false;
  }
}

export function authorizeApi(req: Request): Response | null {
  if (!getAdminKey())
    return Response.json(
      { error: "L’accès privé doit être configuré par le propriétaire." },
      { status: 503 },
    );
  const apiKey = req.headers.get("x-admin-key");
  if (apiKey && verifyAdminKey(apiKey)) return null;
  if (!hasSession(req))
    return Response.json(
      { error: "Connecte-toi pour continuer." },
      { status: 401 },
    );
  if (!isSameOrigin(req))
    return Response.json(
      { error: "Origine de la requête refusée." },
      { status: 403 },
    );
  return null;
}

export function safeReturnPath(value: unknown): string {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\r\n]/.test(value)
  )
    return "/";
  try {
    const url = new URL(value, "https://wartracker.invalid");
    return url.origin === "https://wartracker.invalid"
      ? `${url.pathname}${url.search}`
      : "/";
  } catch {
    return "/";
  }
}
