import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { recordAudit } from "@/lib/admin/audit";
import { handleError, ok, err } from "@/lib/api";

const patch = z.object({
  role: z.enum(["USER", "PRO", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "SUSPENDED", "BANNED"]).optional(),
  displayName: z.string().max(64).optional(),
  bio: z.string().max(280).optional(),
  maxAlerts: z.number().int().min(0).max(10000).optional(),
  maxWatchlists: z.number().int().min(0).max(1000).optional(),
  canPostIdeas: z.boolean().optional(),
  canUseScreener: z.boolean().optional(),
  canExportData: z.boolean().optional(),
});

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { alerts: true, watchlists: true, ideas: true, activities: true } },
        sessions: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    });
    if (!user) return err("User not found", 404);
    const { passwordHash: _ph, ...safe } = user;
    return ok(safe);
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const body = patch.parse(await req.json());
    if (params.id === admin.id) {
      if (body.role && body.role !== "ADMIN") {
        return err("You cannot demote yourself", 400);
      }
      if (body.status && body.status !== "ACTIVE") {
        return err("You cannot suspend or ban yourself", 400);
      }
    }
    const before = await prisma.user.findUnique({ where: { id: params.id } });
    if (!before) return err("User not found", 404);
    const updated = await prisma.user.update({
      where: { id: params.id },
      data: body,
    });
    await recordAudit(admin.id, "update_user", params.id, {
      changes: body,
      before: {
        role: before.role,
        status: before.status,
        maxAlerts: before.maxAlerts,
        maxWatchlists: before.maxWatchlists,
      },
    });
    const { passwordHash: _ph, ...safe } = updated;
    return ok(safe);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    if (params.id === admin.id) return err("You cannot delete yourself", 400);
    await prisma.user.delete({ where: { id: params.id } });
    await recordAudit(admin.id, "delete_user", params.id);
    return ok({});
  } catch (e) {
    return handleError(e);
  }
}
