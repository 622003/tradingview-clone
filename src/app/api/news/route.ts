import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const ticker = url.searchParams.get("symbol")?.toUpperCase();
    const take = Math.min(50, Math.max(1, Number(url.searchParams.get("take") ?? 20)));
    const where: Record<string, unknown> = {};
    if (ticker) {
      const sym = await prisma.symbol.findUnique({ where: { ticker } });
      if (!sym) return ok([]);
      where.symbolId = sym.id;
    }
    const items = await prisma.newsItem.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take,
      include: { symbol: true },
    });
    return ok(items);
  } catch (e) {
    return handleError(e);
  }
}
