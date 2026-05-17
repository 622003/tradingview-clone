import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const take = Math.min(200, Math.max(1, Number(url.searchParams.get("take") ?? 100)));
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take,
      include: {
        actor: { select: { username: true, displayName: true } },
        target: { select: { username: true, displayName: true } },
      },
    });
    return ok(logs);
  } catch (e) {
    return handleError(e);
  }
}
