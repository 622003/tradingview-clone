"use client";

import * as React from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SymbolRow } from "@/components/watchlist/symbol-row";

interface WatchlistItem {
  id: string;
  symbol: { id: string; ticker: string; name: string; exchange: string; type: string };
}
interface Watchlist {
  id: string;
  name: string;
  isDefault: boolean;
  items: WatchlistItem[];
}
interface Quote {
  ticker: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
}

export default function WatchlistPage() {
  const [watchlists, setWatchlists] = React.useState<Watchlist[]>([]);
  const [active, setActive] = React.useState<string | null>(null);
  const [quotes, setQuotes] = React.useState<Record<string, Quote>>({});
  const [newName, setNewName] = React.useState("");
  const [addTicker, setAddTicker] = React.useState("");

  async function load() {
    const res = await fetch("/api/watchlists");
    const j = await res.json();
    if (j.ok) {
      setWatchlists(j.data);
      if (!active && j.data[0]) setActive(j.data[0].id);
    }
  }

  React.useEffect(() => {
    load();
  }, []);

  const current = watchlists.find((w) => w.id === active);

  React.useEffect(() => {
    if (!current) return;
    const tickers = current.items.map((i) => i.symbol.ticker);
    if (tickers.length === 0) return;
    fetch(`/api/quotes?symbols=${tickers.join(",")}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          const map: Record<string, Quote> = {};
          for (const q of j.data) map[q.ticker] = q;
          setQuotes(map);
        }
      });
    const i = setInterval(() => {
      fetch(`/api/quotes?symbols=${tickers.join(",")}`)
        .then((r) => r.json())
        .then((j) => {
          if (j.ok) {
            const map: Record<string, Quote> = {};
            for (const q of j.data) map[q.ticker] = q;
            setQuotes(map);
          }
        });
    }, 5000);
    return () => clearInterval(i);
  }, [current?.id, current?.items.length]);

  async function createWatchlist() {
    if (!newName.trim()) return;
    const res = await fetch("/api/watchlists", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    const j = await res.json();
    if (j.ok) {
      setNewName("");
      load();
    } else {
      toast.error(j.error?.message ?? "Failed");
    }
  }

  async function addItem() {
    if (!current || !addTicker.trim()) return;
    const res = await fetch(`/api/watchlists/${current.id}/items`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ticker: addTicker.toUpperCase() }),
    });
    const j = await res.json();
    if (j.ok) {
      setAddTicker("");
      load();
    } else {
      toast.error(j.error?.message ?? "Failed");
    }
  }

  async function removeItem(symbolId: string) {
    if (!current) return;
    const res = await fetch(`/api/watchlists/${current.id}/items/${symbolId}`, { method: "DELETE" });
    const j = await res.json();
    if (j.ok) load();
  }

  async function deleteWatchlist() {
    if (!current || current.isDefault) return;
    const res = await fetch(`/api/watchlists/${current.id}`, { method: "DELETE" });
    const j = await res.json();
    if (j.ok) {
      setActive(null);
      load();
    } else {
      toast.error(j.error?.message ?? "Failed");
    }
  }

  return (
    <div className="grid h-full grid-cols-1 gap-3 p-3 md:grid-cols-[260px_1fr]">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle>Your watchlists</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-2">
          {watchlists.map((wl) => (
            <button
              key={wl.id}
              onClick={() => setActive(wl.id)}
              className={
                "flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-xs " +
                (active === wl.id ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-900")
              }
            >
              <span>{wl.name}</span>
              <span className="text-[10px] text-zinc-500">{wl.items.length}</span>
            </button>
          ))}
          <div className="flex gap-1 pt-2">
            <Input
              placeholder="New watchlist…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-8 text-xs"
            />
            <Button size="sm" onClick={createWatchlist}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="min-h-[60vh]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{current?.name ?? "—"}</CardTitle>
          {current && !current.isDefault && (
            <Button variant="ghost" size="sm" onClick={deleteWatchlist} className="text-rose-400">
              Delete watchlist
            </Button>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {current && (
            <>
              <div className="flex gap-1 border-b border-zinc-800 p-2">
                <Input
                  placeholder="Add symbol (e.g. AAPL)…"
                  value={addTicker}
                  onChange={(e) => setAddTicker(e.target.value)}
                  className="h-8 text-xs"
                />
                <Button size="sm" onClick={addItem}>
                  Add
                </Button>
              </div>
              {current.items.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500">Empty watchlist. Add a symbol above.</div>
              ) : (
                current.items.map((item) => (
                  <SymbolRow
                    key={item.id}
                    ticker={item.symbol.ticker}
                    name={item.symbol.name}
                    exchange={item.symbol.exchange}
                    type={item.symbol.type}
                    quote={quotes[item.symbol.ticker]}
                    onRemove={() => removeItem(item.symbol.id)}
                  />
                ))
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
