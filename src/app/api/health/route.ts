import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Liveness + readiness probe for load balancers / orchestrators.
 *
 *  200 → DB reachable, app is serving traffic.
 *  503 → DB unreachable. Take this pod out of rotation.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, status: "healthy", time: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        status: "unhealthy",
        error: e instanceof Error ? e.message : "unknown",
      },
      { status: 503 },
    );
  }
}
