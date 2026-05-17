"use client";

import * as React from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Flag {
  id: string;
  key: string;
  enabled: boolean;
  description: string | null;
}

const FLAG_LABELS: Record<string, { label: string; description: string }> = {
  "registration.open": {
    label: "Open registration",
    description: "Allow new users to register accounts on the public sign-up page.",
  },
  "ideas.enabled": {
    label: "Ideas social feed",
    description: "Show the public Ideas page and allow posting from authorized users.",
  },
  "screener.enabled": {
    label: "Screener",
    description: "Enable the symbol screener tool. Per-user permission still applies.",
  },
  "news.enabled": {
    label: "News feed",
    description: "Show the News page and per-symbol news.",
  },
  "alerts.enabled": {
    label: "Alerts",
    description: "Allow users to create price/volume alerts.",
  },
};

export default function AdminSettingsPage() {
  const [flags, setFlags] = React.useState<Flag[]>([]);

  async function load() {
    const res = await fetch("/api/admin/flags");
    const j = await res.json();
    if (j.ok) setFlags(j.data);
  }
  React.useEffect(() => {
    load();
  }, []);

  async function toggle(key: string, enabled: boolean) {
    const res = await fetch("/api/admin/flags", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key, enabled }),
    });
    const j = await res.json();
    if (j.ok) {
      toast.success(`${key} ${enabled ? "enabled" : "disabled"}`);
      load();
    }
  }

  const knownKeys = Object.keys(FLAG_LABELS);
  const merged = knownKeys.map((k) => {
    const f = flags.find((x) => x.key === k);
    return { key: k, enabled: f?.enabled ?? true, description: FLAG_LABELS[k].description, label: FLAG_LABELS[k].label };
  });

  return (
    <div className="p-3">
      <div className="mb-3 px-1">
        <h1 className="text-lg font-semibold text-zinc-100">Platform settings</h1>
        <p className="text-xs text-zinc-500">Toggle features globally for all users.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Feature flags</CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-zinc-900 p-0">
          {merged.map((f) => (
            <div key={f.key} className="flex items-start justify-between p-3">
              <div className="pr-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
                  {f.label}
                  <span className="font-mono text-[10px] text-zinc-500">{f.key}</span>
                </div>
                <div className="text-xs text-zinc-500">{f.description}</div>
              </div>
              <button
                onClick={() => toggle(f.key, !f.enabled)}
                className={
                  "rounded-full px-3 py-1 text-[10px] font-semibold transition " +
                  (f.enabled
                    ? "bg-emerald-950/60 text-emerald-300 hover:bg-emerald-950"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800")
                }
              >
                <Badge variant={f.enabled ? "success" : "outline"}>{f.enabled ? "ENABLED" : "DISABLED"}</Badge>
              </button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
