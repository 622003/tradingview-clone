import { NextRequest } from "next/server";
import { priceQuote } from "@/lib/market/simulator";
import { handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tickers = (url.searchParams.get("symbols") ?? "")
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    if (tickers.length === 0) return ok([]);
    const quotes = tickers.map((t) => priceQuote(t));
    return ok(quotes);
  } catch (e) {
    return handleError(e);
  }
}
