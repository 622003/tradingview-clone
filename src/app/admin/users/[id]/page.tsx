"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface UserDetail {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  maxAlerts: number;
  maxWatchlists: number;
  canPostIdeas: boolean;
  canUseScreener: boolean;
  canExportData: boolean;
  _count: { alerts: number; ideas: number; watchlists: number; sessions: number };
  sessions: { id: string; ip: string | null; userAgent: string | null; createdAt: string; expiresAt: string }[];
}

export default function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [u, setU] = React.useState<UserDetail | null>(null);
  const [form, setForm] = React.useState<Partial<UserDetail>>({});

  async function load() {
    const res = await fetch(`/api/admin/users/${params.id}`);
    const j = await res.json();
    if (j.ok) {
      setU(j.data);
      setForm(j.data);
    }
  }
  React.useEffect(() => {
    load();
  }, [params.id]);

  async function save() {
    const res = await fetch(`/api/admin/users/${params.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        role: form.role,
        status: form.status,
        displayName: form.displayName,
        bio: form.bio,
        maxAlerts: form.maxAlerts,
        maxWatchlists: form.maxWatchlists,
        canPostIdeas: form.canPostIdeas,
        canUseScreener: form.canUseScreener,
        canExportData: form.canExportData,
      }),
    });
    const j = await res.json();
    if (j.ok) {
      toast.success("Saved");
      load();
    } else {
      toast.error(j.error?.message ?? "Failed");
    }
  }

  async function revokeSessions() {
    if (!confirm("Revoke all sessions for this user?")) return;
    const res = await fetch(`/api/admin/users/${params.id}/sessions`, { method: "DELETE" });
    const j = await res.json();
    if (j.ok) {
      toast.success("Sessions revoked");
      load();
    }
  }

  async function deleteUser() {
    if (!confirm("Delete this user permanently? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/users/${params.id}`, { method: "DELETE" });
    const j = await res.json();
    if (j.ok) {
      toast.success("User deleted");
      router.push("/admin/users");
    } else {
      toast.error(j.error?.message ?? "Failed");
    }
  }

  if (!u) return <div className="p-6 text-xs text-zinc-500">Loading…</div>;

  return (
    <div className="p-3">
      <div className="mb-3 flex items-center justify-between px-1">
        <Link href="/admin/users" className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-100">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to users
        </Link>
        <Button onClick={deleteUser} size="sm" variant="ghost" className="text-rose-400">
          Delete user
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {u.displayName ?? u.username}{" "}
              <span className="text-xs font-normal text-zinc-500">@{u.username}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Role</Label>
                <select
                  value={form.role ?? u.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs"
                >
                  <option value="USER">USER</option>
                  <option value="PRO">PRO</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
              <div>
                <Label>Status</Label>
                <select
                  value={form.status ?? u.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="BANNED">BANNED</option>
                </select>
              </div>
            </div>
            <div>
              <Label>Display name</Label>
              <Input
                value={form.displayName ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
              />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea
                rows={3}
                value={form.bio ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Max alerts</Label>
                <Input
                  type="number"
                  value={form.maxAlerts ?? u.maxAlerts}
                  onChange={(e) => setForm((f) => ({ ...f, maxAlerts: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label>Max watchlists</Label>
                <Input
                  type="number"
                  value={form.maxWatchlists ?? u.maxWatchlists}
                  onChange={(e) => setForm((f) => ({ ...f, maxWatchlists: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Toggle
                label="Post ideas"
                value={form.canPostIdeas ?? u.canPostIdeas}
                onChange={(v) => setForm((f) => ({ ...f, canPostIdeas: v }))}
              />
              <Toggle
                label="Use screener"
                value={form.canUseScreener ?? u.canUseScreener}
                onChange={(v) => setForm((f) => ({ ...f, canUseScreener: v }))}
              />
              <Toggle
                label="Export data"
                value={form.canExportData ?? u.canExportData}
                onChange={(v) => setForm((f) => ({ ...f, canExportData: v }))}
              />
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={save}>Save changes</Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-xs">
              <Row label="Email" value={u.email} />
              <Row label="Joined" value={new Date(u.createdAt).toLocaleString()} />
              <Row label="Last login" value={u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "—"} />
              <Row label="Alerts" value={String(u._count.alerts)} />
              <Row label="Ideas" value={String(u._count.ideas)} />
              <Row label="Watchlists" value={String(u._count.watchlists)} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Sessions ({u._count.sessions})</CardTitle>
              <Button size="sm" variant="ghost" onClick={revokeSessions} className="text-rose-400">
                Revoke all
              </Button>
            </CardHeader>
            <CardContent className="space-y-1 p-2">
              {u.sessions.length === 0 ? (
                <div className="p-2 text-xs text-zinc-500">No active sessions.</div>
              ) : (
                u.sessions.map((s) => (
                  <div key={s.id} className="rounded border border-zinc-900 p-2 text-[10px]">
                    <div className="text-zinc-400">{s.userAgent ?? "Unknown UA"}</div>
                    <div className="text-zinc-500">
                      {s.ip ?? "—"} · expires {new Date(s.expiresAt).toLocaleString()}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={
        "flex h-9 items-center justify-between rounded-md border px-3 text-xs " +
        (value
          ? "border-emerald-700/60 bg-emerald-950/40 text-emerald-300"
          : "border-zinc-800 bg-zinc-900 text-zinc-400")
      }
    >
      <span>{label}</span>
      <Badge variant={value ? "success" : "outline"}>{value ? "ON" : "OFF"}</Badge>
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-900 py-1.5 last:border-b-0">
      <span className="text-[10px] uppercase text-zinc-500">{label}</span>
      <span className="text-zinc-200">{value}</span>
    </div>
  );
}
