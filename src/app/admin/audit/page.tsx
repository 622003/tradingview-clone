import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const logs = await prisma.auditLog.findMany({
    take: 200,
    orderBy: { createdAt: "desc" },
    include: { actor: true, target: true },
  });
  return (
    <div className="p-3">
      <div className="mb-3 px-1">
        <h1 className="text-lg font-semibold text-zinc-100">Audit log</h1>
        <p className="text-xs text-zinc-500">All admin actions taken on this instance.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Last 200 entries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead className="text-[10px] uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2 text-left">Actor</th>
                <th className="px-3 py-2 text-left">Action</th>
                <th className="px-3 py-2 text-left">Target</th>
                <th className="px-3 py-2 text-left">Details</th>
                <th className="px-3 py-2">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-zinc-900 align-top">
                  <td className="px-3 py-2 text-zinc-200">@{l.actor.username}</td>
                  <td className="px-3 py-2">
                    <Badge variant="info">{l.action}</Badge>
                  </td>
                  <td className="px-3 py-2 text-zinc-300">
                    {l.target ? `@${l.target.username}` : l.targetId ? `id:${l.targetId}` : "—"}
                  </td>
                  <td className="px-3 py-2 text-zinc-500">
                    <pre className="max-w-md whitespace-pre-wrap break-words text-[10px]">{l.details ?? ""}</pre>
                  </td>
                  <td className="px-3 py-2 text-center text-[10px] text-zinc-500">
                    {formatDistanceToNow(l.createdAt, { addSuffix: true })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
