import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { priceQuote } from "@/lib/market/simulator";
import { cn, formatPercent, formatPrice, priceColor } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const GROUPS: { title: string; type: string }[] = [
  { title: "Crypto", type: "crypto" },
  { title: "Stocks", type: "stock" },
  { title: "Forex", type: "forex" },
  { title: "Commodities", type: "commodity" },
  { title: "Indices & ETFs", type: "index" },
];

export default async function MarketsPage() {
  const groups = await Promise.all(
    GROUPS.map(async (g) => ({
      ...g,
      symbols: (await prisma.symbol.findMany({ where: { type: g.type }, orderBy: { ticker: "asc" } })).map(
        (s) => ({ ...s, quote: priceQuote(s.ticker) }),
      ),
    })),
  );

  return (
    <div className="p-3">
      <div className="mb-3 px-1">
        <h1 className="text-lg font-semibold text-zinc-100">Markets</h1>
        <p className="text-xs text-zinc-500">
          Live quotes from the local simulator. Click any symbol to open its chart.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {groups.map((g) => (
          <Card key={g.type}>
            <CardHeader>
              <CardTitle>{g.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-xs">
                <thead className="text-[10px] uppercase text-zinc-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Symbol</th>
                    <th className="px-3 py-2 text-right">Price</th>
                    <th className="px-3 py-2 text-right">24h %</th>
                    <th className="px-3 py-2 text-right">Vol</th>
                  </tr>
                </thead>
                <tbody>
                  {g.symbols.map((s) => (
                    <tr key={s.id} className="border-t border-zinc-900 hover:bg-zinc-900/40">
                      <td className="px-3 py-2">
                        <Link href={`/chart?symbol=${s.ticker}`} className="block">
                          <div className="font-mono font-semibold text-zinc-100">{s.ticker}</div>
                          <div className="truncate text-[10px] text-zinc-500">{s.name}</div>
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{formatPrice(s.quote.price)}</td>
                      <td className={cn("px-3 py-2 text-right font-mono", priceColor(s.quote.change))}>
                        {formatPercent(s.quote.changePct)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-zinc-500">
                        {Math.round(s.quote.volume).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
