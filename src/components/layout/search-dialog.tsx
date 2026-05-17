"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface SymbolResult {
  id: string;
  ticker: string;
  name: string;
  exchange: string;
  type: string;
}

export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [q, setQ] = React.useState("");
  const [results, setResults] = React.useState<SymbolResult[]>([]);
  const router = useRouter();

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpenChange]);

  React.useEffect(() => {
    if (!open) {
      setQ("");
      setResults([]);
    }
  }, [open]);

  React.useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetch(`/api/symbols?q=${encodeURIComponent(q)}&take=20`);
      const j = await res.json();
      if (j.ok) setResults(j.data);
    }, 120);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0">
        <DialogHeader className="border-b border-zinc-800 p-4">
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-4 w-4 text-zinc-400" />
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search symbol (e.g. AAPL, BTCUSD, gold)…"
              className="border-0 bg-transparent text-base focus-visible:ring-0"
            />
          </DialogTitle>
        </DialogHeader>
        <ul className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-4 py-6 text-xs text-zinc-500">No matches. Try AAPL, BTCUSD, EURUSD.</li>
          )}
          {results.map((r) => (
            <li key={r.id}>
              <button
                className="flex w-full items-center justify-between rounded px-3 py-2 text-left hover:bg-zinc-900"
                onClick={() => {
                  onOpenChange(false);
                  router.push(`/chart?symbol=${encodeURIComponent(r.ticker)}`);
                }}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-zinc-100">{r.ticker}</span>
                  <span className="text-xs text-zinc-500">{r.name}</span>
                </div>
                <span className="text-[10px] uppercase text-zinc-500">
                  {r.exchange} · {r.type}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
