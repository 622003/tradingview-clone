import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { priceQuote } from "@/lib/market/simulator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatPercent, formatPrice, priceColor } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SymbolPage({ params }: { params: { ticker: string } }) {
  const ticker = decodeURIComponent(params.ticker).toUpperCase();
  const sym = await prisma.symbol.findUnique({
    where: { ticker },
    include: { ideas: { take: 5, orderBy: { createdAt: "desc" }, include: { user: true } }, newsItems: { take: 10, orderBy: { publishedAt: "desc" } } },
  });
  if (!sym) notFound();
  const q = priceQuote(sym.ticker);
  return (
    <div className="p-3">
      <div className="mb-3 flex items-center justify-between px-1">
        <div>
          <div className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
            {sym.ticker}
            <Badge variant="info">
              {sym.exchange} · {sym.type.toUpperCase()}
            </Badge>
          </div>
          <div className="text-xs text-zinc-500">{sym.name}</div>
        </div>
        <div className="text-right font-mono">
          <div className="text-2xl text-zinc-100">{formatPrice(q.price)}</div>
          <div className={cn("text-sm", priceColor(q.change))}>
            {formatPrice(q.change)} ({formatPercent(q.changePct)})
          </div>
        </div>
      </div>
      <div className="mb-3 px-1">
        <Link href={`/chart?symbol=${sym.ticker}`} className="text-xs text-blue-400 hover:underline">
          Open advanced chart →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>About {sym.ticker}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-zinc-400">
            <p>{sym.description ?? "No description available."}</p>
            <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] uppercase text-zinc-500">
              {sym.sector && <div>Sector: <span className="text-zinc-300 normal-case">{sym.sector}</span></div>}
              {sym.industry && <div>Industry: <span className="text-zinc-300 normal-case">{sym.industry}</span></div>}
              {sym.country && <div>Country: <span className="text-zinc-300 normal-case">{sym.country}</span></div>}
              <div>Exchange: <span className="text-zinc-300 normal-case">{sym.exchange}</span></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Key stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 font-mono text-xs">
            <Stat label="Open" value={formatPrice(q.open)} />
            <Stat label="High" value={formatPrice(q.high)} />
            <Stat label="Low" value={formatPrice(q.low)} />
            <Stat label="Prev close" value={formatPrice(q.prevClose)} />
            <Stat label="Volume" value={Math.round(q.volume).toLocaleString()} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent ideas</CardTitle>
          </CardHeader>
          <CardContent>
            {sym.ideas.length === 0 ? (
              <div className="text-xs text-zinc-500">No ideas yet.</div>
            ) : (
              <ul className="space-y-2">
                {sym.ideas.map((i) => (
                  <li key={i.id} className="rounded border border-zinc-900 p-2">
                    <div className="text-[10px] uppercase text-zinc-500">
                      {i.bias} · @{i.user.username}
                    </div>
                    <div className="text-sm font-semibold text-zinc-100">{i.title}</div>
                    <div className="text-xs text-zinc-400 line-clamp-2">{i.content}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent news</CardTitle>
          </CardHeader>
          <CardContent>
            {sym.newsItems.length === 0 ? (
              <div className="text-xs text-zinc-500">No news yet.</div>
            ) : (
              <ul className="space-y-2">
                {sym.newsItems.map((n) => (
                  <li key={n.id} className="rounded border border-zinc-900 p-2">
                    <div className="text-[10px] uppercase text-zinc-500">{n.source}</div>
                    <div className="text-sm font-semibold text-zinc-100">{n.title}</div>
                    <div className="text-xs text-zinc-400">{n.summary}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-900 py-1 last:border-b-0">
      <span className="text-[10px] uppercase text-zinc-500">{label}</span>
      <span className="text-zinc-200">{value}</span>
    </div>
  );
}
