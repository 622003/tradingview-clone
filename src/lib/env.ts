import { z } from "zod";

/**
 * Server-side environment validation.
 *
 * Imported once at module load. If any required variable is missing or invalid,
 * the process will throw a readable error at boot rather than failing at runtime.
 *
 * Keep this list small and well-documented — every new env var is friction for
 * future contributors. Prefer feature flags in the DB over new env vars.
 */
const schema = z.object({
  // Prisma reads this directly; we just assert it's present.
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Public-facing hostnames (no scheme). Used by middleware to route between
  // the user and admin websites, and by the auth layer to set a parent-domain
  // cookie so a single sign-in works across both hosts.
  //
  // Defaults work for local dev via `lvh.me` (a DNS service that resolves
  // *.lvh.me → 127.0.0.1) — no /etc/hosts edits needed.
  USER_HOST: z.string().min(1).default("app.lvh.me:3000"),
  ADMIN_HOST: z.string().min(1).default("admin.lvh.me:3000"),

  // Parent domain for the session cookie. Must be a suffix shared by both
  // USER_HOST and ADMIN_HOST. Leave empty in production-without-subdomains
  // single-host deployments — the cookie will then be scoped to the request
  // host only.
  COOKIE_DOMAIN: z.string().default(".lvh.me"),

  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

function parse() {
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const lines = parsed.error.errors.map((e) => `  - ${e.path.join(".")}: ${e.message}`);
    throw new Error(
      [
        "Invalid environment configuration:",
        ...lines,
        "",
        "See .env.example for the full list of variables.",
      ].join("\n"),
    );
  }
  return parsed.data;
}

export const env = parse();
export type Env = z.infer<typeof schema>;
