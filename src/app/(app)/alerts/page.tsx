"use client";

import * as React from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface Alert {
  id: string;
  condition: string;
  value: number;
  status: string;
  createdAt: string;
  triggeredAt: string | null;
  symbol: { ticker: string; name: string };
}

export default function AlertsPage() {
  const [alerts, setAlerts] = React.useState<Alert[]>([]);

  async function load() {
    const res = await fetch("/api/alerts");
    const j = await res.json();
    if (j.ok) setAlerts(j.data);
  }
  React.useEffect(() => {
    load();
  }, []);

  async function toggle(id: string, current: string) {
    const next = current === "active" ? "disabled" : "active";
    const res = await fetch(`/api/alerts/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const j = await res.json();
    if (j.ok) load();
    else toast.error(j.error?.message ?? "Failed");
  }

  async function remove(id: string) {
    const res = await fetch(`/api/alerts/${id}`, { method: "DELETE" });
    const j = await res.json();
    if (j.ok) load();
  }

  return (
    <div className="p-3">
      <div className="mb-3 px-1">
        <h1 className="text-lg font-semibold text-zinc-100">Alerts</h1>
        <p className="text-xs text-zinc-500">Price and volume alerts you’ve created.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Active alerts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {alerts.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-500">
              No alerts yet — open a chart and use the “Alert” button to create one.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="text-[10px] uppercase text-zinc-500">
                <tr>
                  <th className="px-3 py-2 text-left">Symbol</th>
                  <th className="px-3 py-2 text-left">Condition</th>
                  <th className="px-3 py-2 text-right">Value</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Created</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id} className="border-t border-zinc-900">
                    <td className="px-3 py-2 font-mono font-semibold text-zinc-100">{a.symbol.ticker}</td>
                    <td className="px-3 py-2 text-zinc-400">{a.condition}</td>
                    <td className="px-3 py-2 text-right font-mono">{a.value}</td>
                    <td className="px-3 py-2">
                      <Badge variant={a.status === "active" ? "success" : a.status === "triggered" ? "warning" : "outline"}>
                        {a.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-[10px] text-zinc-500">
                      {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                    </td>
                    <td className="space-x-1 px-3 py-2 text-right">
                      <Button size="sm" variant="ghost" onClick={() => toggle(a.id, a.status)}>
                        {a.status === "active" ? "Disable" : "Enable"}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-rose-400" onClick={() => remove(a.id)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
