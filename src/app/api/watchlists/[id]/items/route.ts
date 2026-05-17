import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { handleError, ok, err } from "@/lib/api";

const addSchema = z.object({ ticker: z.string().min(1) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = addSchema.parse(await req.json());
    const ticker = body.ticker.toUpperCase();
    const sym = await prisma.symbol.findUnique({ where: { ticker } });
    if (!sym) return err("Symbol not found", 404);

    let watchlist = null;
    if (params.id === "default") {
      watchlist = await prisma.watchlist.findFirst({
        where: { userId: user.id, isDefault: true },
      });
      if (!watchlist) {
        watchlist = await prisma.watchlist.create({
          data: { userId: user.id, name: "My Watchlist", isDefault: true },
        });
      }
    } else {
      watchlist = await prisma.watchlist.findFirst({
        where: { id: params.id, userId: user.id },
      });
      if (!watchlist) return err("Watchlist not found", 404);
    }

    const last = await prisma.watchlistItem.findFirst({
      where: { watchlistId: watchlist.id },
      orderBy: { position: "desc" },
    });
    const position = (last?.position ?? -1) + 1;
    const item = await prisma.watchlistItem.upsert({
      where: { watchlistId_symbolId: { watchlistId: watchlist.id, symbolId: sym.id } },
      update: {},
      create: { watchlistId: watchlist.id, symbolId: sym.id, position },
    });
    return ok(item);
  } catch (e) {
    return handleError(e);
  }
}
