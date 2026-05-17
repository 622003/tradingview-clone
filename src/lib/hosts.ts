import { env } from "@/lib/env";

/**
 * Host-based routing helpers.
 *
 * Run as two websites from one codebase:
 *   - USER_HOST  → public + signed-in user pages (chart, watchlist, alerts, …)
 *   - ADMIN_HOST → admin panel only (users, symbols, ideas mod, …)
 *
 * The hostname comes from the request `Host` header (or `x-forwarded-host`
 * when behind a reverse proxy). Both `env.USER_HOST` and `env.ADMIN_HOST`
 * include the port for local dev but not in production behind a real proxy.
 */

export type Site = "user" | "admin";

/** Strip the optional `:port` so comparisons work regardless of forwarded port. */
function hostname(value: string): string {
  return value.split(":")[0]!.toLowerCase();
}

export function siteFromHost(host: string | null | undefined): Site {
  if (!host) return "user";
  const h = hostname(host);
  const adminHost = hostname(env.ADMIN_HOST);
  return h === adminHost ? "admin" : "user";
}

/** Absolute URL of the user site, suitable for cross-host redirects. */
export function userSiteUrl(path = "/"): string {
  return `${protocol()}://${env.USER_HOST}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Absolute URL of the admin site, suitable for cross-host redirects. */
export function adminSiteUrl(path = "/admin"): string {
  return `${protocol()}://${env.ADMIN_HOST}${path.startsWith("/") ? path : `/${path}`}`;
}

function protocol(): string {
  return env.NODE_ENV === "production" ? "https" : "http";
}
