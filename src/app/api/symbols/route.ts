import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleError, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.trim() ?? "";
    const type = url.searchParams.get("type") ?? undefined;
    const exchange = url.searchParams.get("exchange") ?? undefined;
    const take = Math.min(100, Math.max(1, Number(url.searchParams.get("take") ?? 25)));

    const where: Record<string, unknown> = {};
    if (q) {
      where.OR = [
        { ticker: { contains: q } },
        { name: { contains: q } },
      ];
    }
    if (type) where.type = type;
    if (exchange) where.exchange = exchange;

    const list = await prisma.symbol.findMany({
      where,
      orderBy: [{ ticker: "asc" }],
      take,
    });
    return ok(list);
  } catch (e) {
    return handleError(e);
  }
}
