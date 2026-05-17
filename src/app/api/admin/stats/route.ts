import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { handleError, ok } from "@/lib/api";

export async function GET() {
  try {
    await requireAdmin();
    const [users, active, banned, suspended, alerts, ideas, watchlists, news, symbols] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: "ACTIVE" } }),
      prisma.user.count({ where: { status: "BANNED" } }),
      prisma.user.count({ where: { status: "SUSPENDED" } }),
      prisma.alert.count(),
      prisma.idea.count(),
      prisma.watchlist.count(),
      prisma.newsItem.count(),
      prisma.symbol.count(),
    ]);
    const recent = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: { user: { select: { username: true, displayName: true } } },
    });
    const audit = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        actor: { select: { username: true } },
        target: { select: { username: true } },
      },
    });
    return ok({ counts: { users, active, banned, suspended, alerts, ideas, watchlists, news, symbols }, recent, audit });
  } catch (e) {
    return handleError(e);
  }
}
