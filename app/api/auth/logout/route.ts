import { NextResponse } from "next/server";
import { isSameOrigin, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: Request) {
  if (!isSameOrigin(req))
    return Response.json({ error: "Origine refusée." }, { status: 403 });
  const response = NextResponse.redirect(new URL("/login", process.env.APP_URL || req.url), 303);
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
