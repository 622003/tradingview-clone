import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, ok, err } from "@/lib/api";
import { generateCandles, type Interval } from "@/lib/market/simulator";

export const dynamic = "force-dynamic";

const VALID: Interval[] = ["1m", "5m", "15m", "1h", "4h", "1d", "1w"];

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const ticker = (url.searchParams.get("symbol") ?? "").toUpperCase();
    const interval = (url.searchParams.get("interval") ?? "1d") as Interval;
    const limit = Math.min(2000, Math.max(10, Number(url.searchParams.get("limit") ?? 500)));
    if (!ticker) return err("symbol is required", 400);
    if (!VALID.includes(interval)) return err("invalid interval", 400);

    const sym = await prisma.symbol.findUnique({ where: { ticker } });
    if (!sym) return err("Symbol not found", 404);

    const rows = await prisma.candle.findMany({
      where: { symbolId: sym.id, interval },
      orderBy: { time: "asc" },
      take: limit,
    });

    if (rows.length > 0) {
      const mapped = rows.map((r) => ({
        time: Math.floor(r.time.getTime() / 1000),
        open: r.open,
        high: r.high,
        low: r.low,
        close: r.close,
        volume: r.volume,
      }));
      return ok(mapped);
    }

    // Fallback if seed hasn't been run for this interval — synthesize on the fly.
    const synth = generateCandles(ticker, interval, limit);
    return ok(synth);
  } catch (e) {
    return handleError(e);
  }
}
