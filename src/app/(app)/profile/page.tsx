import { getCurrentUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [alerts, watchlists, ideas] = await Promise.all([
    prisma.alert.count({ where: { userId: user.id } }),
    prisma.watchlist.count({ where: { userId: user.id } }),
    prisma.idea.count({ where: { userId: user.id } }),
  ]);
  return (
    <div className="p-3">
      <div className="mb-3 px-1 text-lg font-semibold text-zinc-100">Profile</div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-zinc-400">
            <Row label="Username" value={user.username} />
            <Row label="Email" value={user.email} />
            <Row label="Display name" value={user.displayName ?? "—"} />
            <Row
              label="Role"
              value={
                <Badge variant={user.role === "ADMIN" ? "warning" : user.role === "PRO" ? "info" : "default"}>
                  {user.role}
                </Badge>
              }
            />
            <Row
              label="Status"
              value={
                <Badge variant={user.status === "ACTIVE" ? "success" : "danger"}>
                  {user.status}
                </Badge>
              }
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-zinc-400">
            <Row label="Watchlists" value={`${watchlists} / ${user.maxWatchlists}`} />
            <Row label="Active alerts" value={`${alerts} / ${user.maxAlerts}`} />
            <Row label="Ideas posted" value={String(ideas)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-zinc-400">
            <Row label="Post ideas" value={user.canPostIdeas ? "✓" : "—"} />
            <Row label="Use screener" value={user.canUseScreener ? "✓" : "—"} />
            <Row label="Export data" value={user.canExportData ? "✓" : "—"} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-900 py-1.5 last:border-b-0">
      <span className="text-[10px] uppercase text-zinc-500">{label}</span>
      <span className="text-zinc-200">{value}</span>
    </div>
  );
}
