import { NextResponse } from "next/server";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function err(message: string, status = 400, code?: string) {
  return NextResponse.json({ ok: false, error: { message, code } }, { status });
}

export function handleError(e: unknown) {
  const msg = e instanceof Error ? e.message : "Unknown error";
  if (msg === "UNAUTHORIZED") return err("Authentication required", 401, "UNAUTHORIZED");
  if (msg === "FORBIDDEN") return err("Forbidden", 403, "FORBIDDEN");
  // Zod validation errors carry user-safe field info; surface them.
  if (e instanceof Error && e.name === "ZodError") {
    return err(msg, 400, "VALIDATION_ERROR");
  }
  console.error("[api] error:", e);
  return err("Internal server error", 500, "INTERNAL_ERROR");
}
