import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { handleError, ok } from "@/lib/api";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const existing = await prisma.ideaLike.findUnique({
      where: { userId_ideaId: { userId: user.id, ideaId: params.id } },
    });
    if (existing) {
      await prisma.ideaLike.delete({ where: { id: existing.id } });
      return ok({ liked: false });
    }
    await prisma.ideaLike.create({ data: { userId: user.id, ideaId: params.id } });
    return ok({ liked: true });
  } catch (e) {
    return handleError(e);
  }
}
