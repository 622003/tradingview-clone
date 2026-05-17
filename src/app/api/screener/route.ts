import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { priceQuote } from "@/lib/market/simulator";
import { requireUser, getCurrentUser } from "@/lib/auth/session";
import { handleError, ok, err } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    // Admin gate via feature flag
    const flag = await prisma.featureFlag.findUnique({ where: { key: "screener.enabled" } });
    if (flag && !flag.enabled && user?.role !== "ADMIN") {
      return err("Screener is currently disabled", 403, "DISABLED");
    }
    if (user && !user.canUseScreener && user.role !== "ADMIN") {
      return err("Screener is disabled for your account", 403, "USER_DISABLED");
    }
    const url = new URL(req.url);
    const type = url.searchParams.get("type") ?? undefined;
    const exchange = url.searchParams.get("exchange") ?? undefined;
    const minPct = Number(url.searchParams.get("minPct") ?? "");
    const maxPct = Number(url.searchParams.get("maxPct") ?? "");
    const minPrice = Number(url.searchParams.get("minPrice") ?? "");
    const maxPrice = Number(url.searchParams.get("maxPrice") ?? "");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (exchange) where.exchange = exchange;

    const symbols = await prisma.symbol.findMany({ where });
    const quotes = symbols.map((s) => ({ ...s, quote: priceQuote(s.ticker) }));
    const filtered = quotes.filter((s) => {
      if (Number.isFinite(minPct) && s.quote.changePct < minPct) return false;
      if (Number.isFinite(maxPct) && s.quote.changePct > maxPct) return false;
      if (Number.isFinite(minPrice) && s.quote.price < minPrice) return false;
      if (Number.isFinite(maxPrice) && s.quote.price > maxPrice) return false;
      return true;
    });
    return ok(filtered);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST() {
  try {
    await requireUser();
    return ok({});
  } catch (e) {
    return handleError(e);
  }
}
