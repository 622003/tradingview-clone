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
  console.error("[api] error:", e);
  return err(msg, 500);
}
