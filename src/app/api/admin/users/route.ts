import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const role = url.searchParams.get("role") ?? undefined;
    const status = url.searchParams.get("status") ?? undefined;

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { email: { contains: q } },
        { username: { contains: q } },
        { displayName: { contains: q } },
      ];
    }
    if (role) where.role = role;
    if (status) where.status = status;

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        maxAlerts: true,
        maxWatchlists: true,
        canPostIdeas: true,
        canUseScreener: true,
        canExportData: true,
      },
    });
    return ok(users);
  } catch (e) {
    return handleError(e);
  }
}
