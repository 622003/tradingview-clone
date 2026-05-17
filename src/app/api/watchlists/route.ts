import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { handleError, ok, err } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const watchlists = await prisma.watchlist.findMany({
      where: { userId: user.id },
      include: {
        items: {
          include: { symbol: true },
          orderBy: { position: "asc" },
        },
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
    return ok(watchlists);
  } catch (e) {
    return handleError(e);
  }
}

const createSchema = z.object({ name: z.string().min(1).max(64) });

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const count = await prisma.watchlist.count({ where: { userId: user.id } });
    if (count >= user.maxWatchlists) {
      return err(`You've reached the maximum of ${user.maxWatchlists} watchlists`, 403, "LIMIT");
    }
    const body = createSchema.parse(await req.json());
    const wl = await prisma.watchlist.create({
      data: { userId: user.id, name: body.name },
    });
    return ok(wl);
  } catch (e) {
    return handleError(e);
  }
}
