"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Symbol {
  id: string;
  ticker: string;
  name: string;
  exchange: string;
  type: string;
  sector: string | null;
}

export default function AdminSymbolsPage() {
  const [symbols, setSymbols] = React.useState<Symbol[]>([]);
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ ticker: "", name: "", exchange: "", type: "stock", sector: "", description: "" });

  async function load() {
    const res = await fetch("/api/admin/symbols");
    const j = await res.json();
    if (j.ok) setSymbols(j.data);
  }
  React.useEffect(() => {
    load();
  }, []);

  async function create() {
    const res = await fetch("/api/admin/symbols", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const j = await res.json();
    if (j.ok) {
      toast.success("Symbol created");
      setOpen(false);
      setForm({ ticker: "", name: "", exchange: "", type: "stock", sector: "", description: "" });
      load();
    } else {
      toast.error(j.error?.message ?? "Failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete symbol? Linked candles, ideas and news will also be deleted.")) return;
    const res = await fetch(`/api/admin/symbols/${id}`, { method: "DELETE" });
    const j = await res.json();
    if (j.ok) load();
  }

  const filtered = q
    ? symbols.filter((s) => s.ticker.includes(q.toUpperCase()) || s.name.toLowerCase().includes(q.toLowerCase()))
    : symbols;

  return (
    <div className="p-3">
      <div className="mb-3 px-1 flex items-end justify-between">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Symbols</h1>
          <p className="text-xs text-zinc-500">Manage the tradable universe.</p>
        </div>
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="mr-1 h-3.5 w-3.5" /> New symbol
        </Button>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <CardTitle className="flex-1">All symbols ({symbols.length})</CardTitle>
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="h-8 w-48" />
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead className="text-[10px] uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2 text-left">Ticker</th>
                <th className="px-3 py-2 text-left">Name</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Exchange</th>
                <th className="px-3 py-2">Sector</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-t border-zinc-900 hover:bg-zinc-900/40">
                  <td className="px-3 py-2 font-mono font-semibold text-zinc-100">{s.ticker}</td>
                  <td className="px-3 py-2 text-zinc-400">{s.name}</td>
                  <td className="px-3 py-2 text-center text-zinc-400">{s.type}</td>
                  <td className="px-3 py-2 text-center text-zinc-400">{s.exchange}</td>
                  <td className="px-3 py-2 text-center text-zinc-400">{s.sector ?? "—"}</td>
                  <td className="px-3 py-2 text-right">
                    <Button size="sm" variant="ghost" className="text-rose-400" onClick={() => remove(s.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-md border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-3 text-sm font-semibold text-zinc-100">New symbol</div>
            <div className="space-y-2">
              <Field label="Ticker" value={form.ticker} onChange={(v) => setForm({ ...form, ticker: v.toUpperCase() })} />
              <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Type</Label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs"
                  >
                    <option value="stock">stock</option>
                    <option value="crypto">crypto</option>
                    <option value="forex">forex</option>
                    <option value="commodity">commodity</option>
                    <option value="index">index</option>
                  </select>
                </div>
                <Field label="Exchange" value={form.exchange} onChange={(v) => setForm({ ...form, exchange: v })} />
              </div>
              <Field label="Sector (optional)" value={form.sector} onChange={(v) => setForm({ ...form, sector: v })} />
              <div>
                <Label>Description (optional)</Label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs"
                />
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={create}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
