import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { recordAudit } from "@/lib/admin/audit";
import { handleError, ok } from "@/lib/api";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const res = await prisma.session.deleteMany({ where: { userId: params.id } });
    await recordAudit(admin.id, "revoke_sessions", params.id, { count: res.count });
    return ok({ revoked: res.count });
  } catch (e) {
    return handleError(e);
  }
}
