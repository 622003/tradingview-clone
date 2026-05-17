import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { handleError, ok, err } from "@/lib/api";

const patch = z.object({ status: z.enum(["active", "disabled", "triggered"]).optional() });

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const body = patch.parse(await req.json());
    const a = await prisma.alert.findFirst({ where: { id: params.id, userId: user.id } });
    if (!a) return err("Alert not found", 404);
    const updated = await prisma.alert.update({ where: { id: a.id }, data: body });
    return ok(updated);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireUser();
    const a = await prisma.alert.findFirst({ where: { id: params.id, userId: user.id } });
    if (!a) return err("Alert not found", 404);
    await prisma.alert.delete({ where: { id: a.id } });
    return ok({});
  } catch (e) {
    return handleError(e);
  }
}
