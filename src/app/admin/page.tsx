import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [
    users,
    activeUsers,
    bannedUsers,
    admins,
    alerts,
    ideas,
    watchlists,
    news,
    symbols,
    recentActivity,
    recentAudit,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: "BANNED" } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.alert.count(),
    prisma.idea.count(),
    prisma.watchlist.count(),
    prisma.newsItem.count(),
    prisma.symbol.count(),
    prisma.activityLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    }),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { actor: true, target: true },
    }),
  ]);

  const stats: { label: string; value: number; href?: string }[] = [
    { label: "Users", value: users, href: "/admin/users" },
    { label: "Active", value: activeUsers, href: "/admin/users" },
    { label: "Banned", value: bannedUsers, href: "/admin/users" },
    { label: "Admins", value: admins, href: "/admin/users" },
    { label: "Symbols", value: symbols, href: "/admin/symbols" },
    { label: "Alerts", value: alerts },
    { label: "Ideas", value: ideas, href: "/admin/ideas" },
    { label: "News", value: news, href: "/admin/news" },
    { label: "Watchlists", value: watchlists },
  ];

  return (
    <div className="p-3">
      <div className="mb-3 px-1">
        <h1 className="text-lg font-semibold text-zinc-100">Admin dashboard</h1>
        <p className="text-xs text-zinc-500">Operational overview of the TradeView instance.</p>
      </div>
      <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
        {stats.map((s) => {
          const inner = (
            <Card className="hover:border-zinc-700">
              <CardContent className="p-3">
                <div className="text-[10px] uppercase text-zinc-500">{s.label}</div>
                <div className="text-xl font-semibold text-zinc-100">{s.value}</div>
              </CardContent>
            </Card>
          );
          return s.href ? (
            <Link key={s.label} href={s.href}>
              {inner}
            </Link>
          ) : (
            <div key={s.label}>{inner}</div>
          );
        })}
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent user activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            {recentActivity.length === 0 ? (
              <div className="text-zinc-500">No activity yet.</div>
            ) : (
              recentActivity.map((a) => (
                <div key={a.id} className="flex items-center justify-between border-b border-zinc-900 py-1.5 last:border-b-0">
                  <span className="text-zinc-400">
                    <span className="text-zinc-200">@{a.user.username}</span> <span className="text-zinc-500">{a.action}</span>
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {formatDistanceToNow(a.createdAt, { addSuffix: true })}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent admin actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            {recentAudit.length === 0 ? (
              <div className="text-zinc-500">No admin actions yet.</div>
            ) : (
              recentAudit.map((a) => (
                <div key={a.id} className="flex items-center justify-between border-b border-zinc-900 py-1.5 last:border-b-0">
                  <span className="text-zinc-400">
                    <span className="text-zinc-200">@{a.actor.username}</span>
                    <Badge variant="info" className="ml-1">
                      {a.action}
                    </Badge>
                    {a.target && <span className="ml-1 text-zinc-500">→ @{a.target.username}</span>}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {formatDistanceToNow(a.createdAt, { addSuffix: true })}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
