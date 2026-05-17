import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { handleError, ok, err } from "@/lib/api";

export async function DELETE(_req: Request, { params }: { params: { id: string; symbolId: string } }) {
  try {
    const user = await requireUser();
    let watchlist = null;
    if (params.id === "default") {
      watchlist = await prisma.watchlist.findFirst({ where: { userId: user.id, isDefault: true } });
    } else {
      watchlist = await prisma.watchlist.findFirst({ where: { id: params.id, userId: user.id } });
    }
    if (!watchlist) return err("Watchlist not found", 404);
    await prisma.watchlistItem.deleteMany({
      where: { watchlistId: watchlist.id, symbolId: params.symbolId },
    });
    return ok({});
  } catch (e) {
    return handleError(e);
  }
}
