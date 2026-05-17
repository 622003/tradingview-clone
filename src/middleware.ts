import { NextRequest, NextResponse } from "next/server";

/**
 * Host-based routing for the two-site setup.
 *
 *   USER_HOST  (default app.lvh.me:3000)   →  public pages, /chart, /watchlist, …
 *   ADMIN_HOST (default admin.lvh.me:3000) →  /admin/** only
 *
 * Cookie auth (set via `Domain=COOKIE_DOMAIN`) lets a single sign-in cover
 * both hosts. Per-request role enforcement still happens in the route
 * handlers / layouts — this middleware only enforces the URL-shape contract
 * (admin host → admin URLs, user host → user URLs).
 *
 * Edge runtime: we deliberately avoid importing `@/lib/env` here because
 * Next.js middleware runs on the edge and the Zod-validated env relies on
 * Node APIs in places. Instead we read raw `process.env` with conservative
 * defaults that match `src/lib/env.ts`.
 */

const USER_HOST = (process.env.USER_HOST ?? "app.lvh.me:3000").split(":")[0]!.toLowerCase();
const ADMIN_HOST = (process.env.ADMIN_HOST ?? "admin.lvh.me:3000").split(":")[0]!.toLowerCase();

function hostHeader(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-host");
  const direct = req.headers.get("host");
  return (forwarded ?? direct ?? "").split(":")[0]!.toLowerCase();
}

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/") || pathname.startsWith("/api/admin");
}

export function middleware(req: NextRequest) {
  const host = hostHeader(req);
  const { pathname, search } = req.nextUrl;

  const proto = req.nextUrl.protocol.replace(":", "");
  const userFullHost = process.env.USER_HOST ?? "app.lvh.me:3000";
  const adminFullHost = process.env.ADMIN_HOST ?? "admin.lvh.me:3000";

  // On the admin host: only allow admin URLs, the login flow, shared API
  // (auth + health), and Next.js internals. Everything else bounces to the
  // user host so a logged-in non-admin or accidental link lands somewhere
  // useful instead of bouncing in circles.
  if (host === ADMIN_HOST) {
    const allowed =
      isAdminPath(pathname) ||
      pathname === "/login" ||
      pathname === "/logout" ||
      pathname.startsWith("/api/auth/") ||
      pathname.startsWith("/api/health") ||
      pathname.startsWith("/_next") ||
      pathname === "/favicon.ico";
    if (!allowed) {
      return NextResponse.redirect(`${proto}://${userFullHost}${pathname}${search}`);
    }
    return NextResponse.next();
  }

  // On the user host (or any unknown host that falls through): block admin
  // URLs and bounce them to the admin host so admins land in the right place.
  if (host === USER_HOST && isAdminPath(pathname)) {
    return NextResponse.redirect(`${proto}://${adminFullHost}${pathname}${search}`);
  }

  return NextResponse.next();
}

export const config = {
  // Skip static assets and Next.js internals — middleware is only useful on
  // pages and API routes.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
