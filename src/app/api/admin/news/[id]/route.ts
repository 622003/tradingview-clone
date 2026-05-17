import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { recordAudit } from "@/lib/admin/audit";
import { handleError, ok } from "@/lib/api";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const item = await prisma.newsItem.delete({ where: { id: params.id } });
    await recordAudit(admin.id, "delete_news", null, { id: params.id, title: item.title });
    return ok({});
  } catch (e) {
    return handleError(e);
  }
}
