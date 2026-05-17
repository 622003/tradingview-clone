"use client";

import * as React from "react";
import Link from "next/link";
import { cn, formatPercent, formatPrice, priceColor } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Row {
  id: string;
  ticker: string;
  name: string;
  exchange: string;
  type: string;
  quote: { price: number; change: number; changePct: number; volume: number };
}

export default function ScreenerPage() {
  const [type, setType] = React.useState("");
  const [exchange, setExchange] = React.useState("");
  const [minPct, setMinPct] = React.useState("");
  const [maxPct, setMaxPct] = React.useState("");
  const [minPrice, setMinPrice] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [rows, setRows] = React.useState<Row[]>([]);
  const [sort, setSort] = React.useState<{ key: keyof Row | "pct" | "price" | "vol"; dir: 1 | -1 }>({
    key: "pct",
    dir: -1,
  });
  const [error, setError] = React.useState<string | null>(null);

  async function run() {
    setError(null);
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (exchange) params.set("exchange", exchange);
    if (minPct) params.set("minPct", minPct);
    if (maxPct) params.set("maxPct", maxPct);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    const res = await fetch(`/api/screener?${params.toString()}`);
    const j = await res.json();
    if (j.ok) setRows(j.data);
    else setError(j.error?.message ?? "Failed");
  }

  React.useEffect(() => {
    run();
  }, []);

  const sorted = React.useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      const ax =
        sort.key === "pct" ? a.quote.changePct : sort.key === "price" ? a.quote.price : sort.key === "vol" ? a.quote.volume : (a[sort.key as keyof Row] as never);
      const bx =
        sort.key === "pct" ? b.quote.changePct : sort.key === "price" ? b.quote.price : sort.key === "vol" ? b.quote.volume : (b[sort.key as keyof Row] as never);
      if (ax === bx) return 0;
      return ax > bx ? sort.dir : -sort.dir;
    });
    return arr;
  }, [rows, sort]);

  return (
    <div className="p-3">
      <div className="mb-3 px-1">
        <h1 className="text-lg font-semibold text-zinc-100">Screener</h1>
        <p className="text-xs text-zinc-500">Filter the symbol universe by type, exchange, price and change.</p>
      </div>
      <Card className="mb-3">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          <div className="space-y-1">
            <Label>Type</Label>
            <select
              className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 text-xs"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="">all</option>
              <option value="stock">stock</option>
              <option value="crypto">crypto</option>
              <option value="forex">forex</option>
              <option value="commodity">commodity</option>
              <option value="index">index</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>Exchange</Label>
            <Input value={exchange} onChange={(e) => setExchange(e.target.value)} placeholder="NASDAQ" />
          </div>
          <div className="space-y-1">
            <Label>Min %</Label>
            <Input type="number" value={minPct} onChange={(e) => setMinPct(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Max %</Label>
            <Input type="number" value={maxPct} onChange={(e) => setMaxPct(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Min price</Label>
            <Input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Max price</Label>
            <Input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button onClick={run} className="w-full">
              Apply
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="mb-3 rounded-md border border-amber-700/40 bg-amber-950/40 p-3 text-xs text-amber-300">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead className="text-[10px] uppercase text-zinc-500">
              <tr>
                <Th label="Symbol" onClick={() => setSort({ key: "ticker", dir: sort.dir === 1 ? -1 : 1 })} />
                <Th label="Type" />
                <Th label="Exchange" />
                <Th
                  label="Price"
                  align="right"
                  onClick={() => setSort({ key: "price", dir: sort.dir === 1 ? -1 : 1 })}
                />
                <Th
                  label="24h %"
                  align="right"
                  onClick={() => setSort({ key: "pct", dir: sort.dir === 1 ? -1 : 1 })}
                />
                <Th
                  label="Vol"
                  align="right"
                  onClick={() => setSort({ key: "vol", dir: sort.dir === 1 ? -1 : 1 })}
                />
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => (
                <tr key={r.id} className="border-t border-zinc-900 hover:bg-zinc-900/40">
                  <td className="px-3 py-2 font-mono">
                    <Link href={`/chart?symbol=${r.ticker}`}>{r.ticker}</Link>
                    <div className="text-[10px] text-zinc-500">{r.name}</div>
                  </td>
                  <td className="px-3 py-2 text-zinc-400">{r.type}</td>
                  <td className="px-3 py-2 text-zinc-400">{r.exchange}</td>
                  <td className="px-3 py-2 text-right font-mono">{formatPrice(r.quote.price)}</td>
                  <td className={cn("px-3 py-2 text-right font-mono", priceColor(r.quote.change))}>
                    {formatPercent(r.quote.changePct)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-zinc-500">
                    {Math.round(r.quote.volume).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sorted.length === 0 && (
            <div className="p-6 text-center text-xs text-zinc-500">No symbols matched the filters.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Th({ label, onClick, align }: { label: string; onClick?: () => void; align?: "right" }) {
  return (
    <th
      className={cn("px-3 py-2", align === "right" ? "text-right" : "text-left", onClick && "cursor-pointer")}
      onClick={onClick}
    >
      {label}
    </th>
  );
}
