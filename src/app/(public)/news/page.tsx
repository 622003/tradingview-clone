import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const items = await prisma.newsItem.findMany({
    orderBy: { publishedAt: "desc" },
    include: { symbol: true },
    take: 50,
  });

  return (
    <div className="p-3">
      <div className="mb-3 px-1">
        <h1 className="text-lg font-semibold text-zinc-100">News</h1>
        <p className="text-xs text-zinc-500">Latest market headlines from connected sources.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {items.map((n) => (
          <Card key={n.id}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center gap-2 text-[10px] uppercase text-zinc-500">
                <span>{n.source}</span>
                <span>·</span>
                <span>{formatDistanceToNow(n.publishedAt, { addSuffix: true })}</span>
                {n.symbol && (
                  <Link href={`/chart?symbol=${n.symbol.ticker}`}>
                    <Badge variant="info">{n.symbol.ticker}</Badge>
                  </Link>
                )}
              </div>
              <div className="text-sm font-semibold leading-snug text-zinc-100">{n.title}</div>
              <div className="text-xs leading-relaxed text-zinc-400">{n.summary}</div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="rounded-md border border-zinc-800 p-6 text-center text-xs text-zinc-500">
            No news yet — admins can publish from the admin panel.
          </div>
        )}
      </div>
    </div>
  );
}
