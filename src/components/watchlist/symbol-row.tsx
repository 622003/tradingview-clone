"use client";

import Link from "next/link";
import * as React from "react";
import { cn, formatPercent, formatPrice, priceColor } from "@/lib/utils";

interface Quote {
  ticker: string;
  price: number;
  change: number;
  changePct: number;
  volume: number;
}

export function SymbolRow({
  ticker,
  name,
  exchange,
  type,
  quote,
  onRemove,
}: {
  ticker: string;
  name?: string | null;
  exchange?: string | null;
  type?: string | null;
  quote?: Quote | null;
  onRemove?: () => void;
}) {
  return (
    <div className="group flex items-center gap-3 border-b border-zinc-900 px-3 py-2 hover:bg-zinc-900/40">
      <Link href={`/chart?symbol=${encodeURIComponent(ticker)}`} className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-zinc-800 text-[10px] font-bold text-zinc-300">
          {ticker.slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-100">
            {ticker}
            {exchange && <span className="text-[10px] font-normal text-zinc-500">{exchange}</span>}
          </div>
          {name && <div className="truncate text-xs text-zinc-500">{name}</div>}
        </div>
      </Link>
      <div className="text-right font-mono text-xs">
        <div className="text-zinc-100">{quote ? formatPrice(quote.price) : "—"}</div>
        {quote && (
          <div className={cn("text-[10px]", priceColor(quote.change))}>
            {formatPercent(quote.changePct)}
          </div>
        )}
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-2 hidden text-[10px] text-zinc-500 hover:text-rose-400 group-hover:inline"
          title="Remove"
        >
          ✕
        </button>
      )}
    </div>
  );
}
