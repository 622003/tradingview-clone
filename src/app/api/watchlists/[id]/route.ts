import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { handleError, ok, err } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const wl = await prisma.watchlist.findFirst({
      where: { id: params.id, userId: user.id },
      include: { items: { include: { symbol: true }, orderBy: { position: "asc" } } },
    });
    if (!wl) return err("Watchlist not found", 404);
    return ok(wl);
  } catch (e) {
    return handleError(e);
  }
}

const patchSchema = z.object({ name: z.string().min(1).max(64).optional() });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = patchSchema.parse(await req.json());
    const wl = await prisma.watchlist.findFirst({ where: { id: params.id, userId: user.id } });
    if (!wl) return err("Watchlist not found", 404);
    const updated = await prisma.watchlist.update({ where: { id: wl.id }, data: body });
    return ok(updated);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const wl = await prisma.watchlist.findFirst({ where: { id: params.id, userId: user.id } });
    if (!wl) return err("Watchlist not found", 404);
    if (wl.isDefault) return err("Cannot delete default watchlist", 400);
    await prisma.watchlist.delete({ where: { id: wl.id } });
    return ok({});
  } catch (e) {
    return handleError(e);
  }
}
