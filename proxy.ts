import { NextRequest, NextResponse } from "next/server";
import { hasSession } from "@/lib/auth";

export function proxy(req: NextRequest) {
  if (hasSession(req)) return NextResponse.next();
  const login = new URL("/login", process.env.APP_URL || req.url);
  login.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search);
  return NextResponse.redirect(login);
}

// API handlers and database readers also enforce authentication themselves.
export const config = {
  matcher: [
    "/40k/:path*",
    "/fab/:path*",
    "/games/:path*",
    "/add-game",
    "/api/import",
  ],
};
