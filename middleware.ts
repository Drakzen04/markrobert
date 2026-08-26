import { NextRequest, NextResponse } from "next/server";

async function hashPassword(pw: string): Promise<string> {
  const data = new TextEncoder().encode(pw);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Ces chemins ont leur propre mécanisme d'auth (secret dédié) et ne passent pas par le cookie.
const PUBLIC_PATHS = ["/login", "/api/auth", "/api/cron", "/api/bridge"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const expected = process.env.DASHBOARD_PASSWORD;
  if (!expected) {
    // Si la variable n'est pas configurée, on bloque tout par sécurité plutôt que de laisser un accès libre.
    return new NextResponse("DASHBOARD_PASSWORD non configuré.", { status: 503 });
  }

  const cookie = req.cookies.get("casper_auth")?.value;
  if (cookie === (await hashPassword(expected))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
