import { NextResponse } from "next/server";
import {
  createSession,
  getAdminKey,
  isSameOrigin,
  safeReturnPath,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  verifyAdminKey,
} from "@/lib/auth";
import { readBody } from "@/lib/http";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isSameOrigin(req))
    return Response.json({ error: "Origine refusée." }, { status: 403 });
  if (!getAdminKey())
    return Response.json(
      { error: "L’accès privé doit être configuré par le propriétaire." },
      { status: 503 },
    );
  try {
    const body = await readBody(req, 4096);
    const form = await new Request(req.url, {
      method: "POST",
      headers: req.headers,
      body: Buffer.from(body),
    }).formData();
    const password = form.get("password");
    const next = safeReturnPath(form.get("next"));
    if (
      typeof password !== "string" ||
      password.length > 512 ||
      !verifyAdminKey(password)
    ) {
      const url = new URL("/login", process.env.APP_URL || req.url);
      url.searchParams.set("error", "invalid");
      url.searchParams.set("next", next);
      return NextResponse.redirect(url, 303);
    }
    const response = NextResponse.redirect(new URL(next, process.env.APP_URL || req.url), 303);
    response.cookies.set(SESSION_COOKIE, createSession(), {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_TTL_SECONDS,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return Response.json(
      { error: "Le formulaire de connexion est invalide." },
      { status: 400 },
    );
  }
}
