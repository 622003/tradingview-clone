"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  CandlestickChart,
  Activity,
  LineChart as LineIcon,
  AreaChart as AreaIcon,
  Bell,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChartView, DEFAULT_INDICATORS, type IndicatorConfig, type Interval } from "@/components/chart/chart-view";
import { cn, formatPercent, formatPrice, priceColor } from "@/lib/utils";
import { SearchDialog } from "@/components/layout/search-dialog";

interface Quote {
  ticker: string;
  price: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  change: number;
  changePct: number;
  volume: number;
  time: number;
}

interface SymbolInfo {
  id: string;
  ticker: string;
  name: string;
  exchange: string;
  type: string;
  sector?: string | null;
  description?: string | null;
}

interface ChartPageProps {
  initialSymbol: string;
  isAuthed: boolean;
}

const INTERVALS: { value: Interval; label: string }[] = [
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1h" },
  { value: "4h", label: "4h" },
  { value: "1d", label: "D" },
  { value: "1w", label: "W" },
];

export function ChartPage({ initialSymbol, isAuthed }: ChartPageProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [symbol, setSymbol] = React.useState(initialSymbol);
  const [interval, setIntervalValue] = React.useState<Interval>("1d");
  const [candles, setCandles] = React.useState<{ time: number; open: number; high: number; low: number; close: number; volume: number }[]>([]);
  const [quote, setQuote] = React.useState<Quote | null>(null);
  const [info, setInfo] = React.useState<SymbolInfo | null>(null);
  const [chartType, setChartType] = React.useState<"candles" | "line" | "area">("candles");
  const [indicators, setIndicators] = React.useState<IndicatorConfig>(DEFAULT_INDICATORS);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const fromUrl = params.get("symbol");
    if (fromUrl && fromUrl !== symbol) setSymbol(fromUrl);
  }, [params, symbol]);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    async function fetchAll() {
      try {
        const [candleRes, quoteRes, infoRes] = await Promise.all([
          fetch(`/api/candles?symbol=${encodeURIComponent(symbol)}&interval=${interval}&limit=500`),
          fetch(`/api/symbols/${encodeURIComponent(symbol)}/quote`),
          fetch(`/api/symbols/${encodeURIComponent(symbol)}`),
        ]);
        const candleJ = await candleRes.json();
        const quoteJ = await quoteRes.json();
        const infoJ = await infoRes.json();
        if (!cancelled) {
          if (candleJ.ok) setCandles(candleJ.data);
          if (quoteJ.ok) setQuote(quoteJ.data);
          if (infoJ.ok) setInfo(infoJ.data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [symbol, interval]);

  // Live updating quote every 5s
  React.useEffect(() => {
    const t = setInterval(async () => {
      const res = await fetch(`/api/symbols/${encodeURIComponent(symbol)}/quote?t=${Date.now()}`);
      const j = await res.json();
      if (j.ok) setQuote(j.data);
    }, 5000);
    return () => clearInterval(t);
  }, [symbol]);

  async function addToWatchlist() {
    if (!isAuthed) {
      router.push("/login");
      return;
    }
    const res = await fetch("/api/watchlists/default/items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ticker: symbol }),
    });
    const j = await res.json();
    if (j.ok) toast.success(`Added ${symbol} to watchlist`);
    else toast.error(j.error?.message ?? "Failed");
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 bg-zinc-950 px-3 py-2">
        <Button variant="secondary" size="sm" onClick={() => setSearchOpen(true)} className="gap-2 font-mono">
          <Search className="h-3.5 w-3.5" />
          <span className="font-bold text-zinc-100">{symbol}</span>
          {info && <span className="hidden md:inline text-zinc-500">· {info.name}</span>}
        </Button>

        {quote && (
          <div className="flex items-center gap-3 px-2">
            <span className="font-mono text-lg font-bold text-zinc-100">{formatPrice(quote.price)}</span>
            <span className={cn("font-mono text-sm", priceColor(quote.change))}>
              {formatPrice(quote.change)} ({formatPercent(quote.changePct)})
            </span>
          </div>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-900 p-0.5">
            {INTERVALS.map((iv) => (
              <button
                key={iv.value}
                onClick={() => setIntervalValue(iv.value)}
                className={cn(
                  "rounded px-2 py-1 text-xs font-medium transition-colors",
                  interval === iv.value ? "bg-zinc-700 text-zinc-50" : "text-zinc-400 hover:text-zinc-100",
                )}
              >
                {iv.label}
              </button>
            ))}
          </div>

          <div className="flex items-center rounded-md border border-zinc-800 bg-zinc-900 p-0.5">
            <button
              onClick={() => setChartType("candles")}
              className={cn("rounded p-1.5", chartType === "candles" ? "bg-zinc-700 text-zinc-50" : "text-zinc-400")}
              title="Candles"
            >
              <CandlestickChart className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setChartType("line")}
              className={cn("rounded p-1.5", chartType === "line" ? "bg-zinc-700 text-zinc-50" : "text-zinc-400")}
              title="Line"
            >
              <LineIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setChartType("area")}
              className={cn("rounded p-1.5", chartType === "area" ? "bg-zinc-700 text-zinc-50" : "text-zinc-400")}
              title="Area"
            >
              <AreaIcon className="h-3.5 w-3.5" />
            </button>
          </div>

          <Select
            value={undefined}
            onValueChange={(v) => {
              const key = v as keyof IndicatorConfig;
              setIndicators((prev) => ({ ...prev, [key]: !prev[key] }));
            }}
          >
            <SelectTrigger className="w-36">
              <Activity className="mr-2 h-3.5 w-3.5" />
              <SelectValue placeholder="Indicators" />
            </SelectTrigger>
            <SelectContent>
              {(
                [
                  ["ema20", "EMA 20"],
                  ["ema50", "EMA 50"],
                  ["ema200", "EMA 200"],
                  ["bollinger", "Bollinger Bands"],
                  ["volume", "Volume"],
                  ["rsi", "RSI (14)"],
                  ["macd", "MACD"],
                ] as const
              ).map(([k, label]) => (
                <SelectItem key={k} value={k}>
                  {indicators[k] ? "✓ " : ""}
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button size="sm" variant="secondary" onClick={addToWatchlist} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Watchlist
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setAlertOpen(true)} className="gap-1.5">
            <Bell className="h-3.5 w-3.5" /> Alert
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
        {quote && (
          <div className="grid grid-cols-2 gap-2 px-2 text-xs font-mono text-zinc-400 sm:grid-cols-5 lg:flex lg:flex-wrap">
            <Stat label="O" value={formatPrice(quote.open)} />
            <Stat label="H" value={formatPrice(quote.high)} valueClass="text-emerald-400" />
            <Stat label="L" value={formatPrice(quote.low)} valueClass="text-rose-400" />
            <Stat label="C" value={formatPrice(quote.price)} />
            <Stat label="Vol" value={Math.round(quote.volume).toLocaleString()} />
            {info && (
              <Badge variant="info" className="ml-auto">
                {info.exchange} · {info.type.toUpperCase()}
              </Badge>
            )}
          </div>
        )}

        <div className="min-h-0 flex-1 rounded-md border border-zinc-800 bg-zinc-950 p-2">
          {candles.length > 0 ? (
            <ChartView candles={candles} indicators={indicators} chartType={chartType} height={520} />
          ) : (
            <div className="flex h-[520px] items-center justify-center text-xs text-zinc-500">
              {loading ? "Loading…" : "No data."}
            </div>
          )}
        </div>
      </div>

      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
      <CreateAlertDialog
        open={alertOpen}
        onOpenChange={setAlertOpen}
        symbol={symbol}
        currentPrice={quote?.price ?? 0}
        isAuthed={isAuthed}
      />
    </div>
  );
}

function Stat({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-zinc-500">{label}</span>
      <span className={cn("text-zinc-200", valueClass)}>{value}</span>
    </div>
  );
}

function CreateAlertDialog({
  open,
  onOpenChange,
  symbol,
  currentPrice,
  isAuthed,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  symbol: string;
  currentPrice: number;
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [condition, setCondition] = React.useState("PRICE_ABOVE");
  const [value, setValue] = React.useState(() => currentPrice.toString());

  React.useEffect(() => {
    if (open) setValue(currentPrice.toString());
  }, [open, currentPrice]);

  async function submit() {
    if (!isAuthed) {
      onOpenChange(false);
      router.push("/login");
      return;
    }
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ticker: symbol, condition, value: Number(value) }),
    });
    const j = await res.json();
    if (j.ok) {
      toast.success(`Alert created on ${symbol}`);
      onOpenChange(false);
    } else {
      toast.error(j.error?.message ?? "Failed");
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-sm rounded-md border border-zinc-800 bg-zinc-950 p-4">
        <div className="mb-3 text-sm font-semibold text-zinc-100">Create alert for {symbol}</div>
        <div className="space-y-3">
          <div>
            <div className="mb-1 text-[10px] uppercase text-zinc-500">Condition</div>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs"
            >
              <option value="PRICE_ABOVE">Price rises above</option>
              <option value="PRICE_BELOW">Price falls below</option>
              <option value="PCT_CHANGE">Daily % change ≥</option>
              <option value="VOLUME_ABOVE">Volume ≥</option>
            </select>
          </div>
          <div>
            <div className="mb-1 text-[10px] uppercase text-zinc-500">Value</div>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={submit}>
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}
