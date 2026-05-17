import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { recordAudit } from "@/lib/admin/audit";
import { handleError, ok } from "@/lib/api";

export async function GET() {
  try {
    await requireAdmin();
    const flags = await prisma.featureFlag.findMany({ orderBy: { key: "asc" } });
    return ok(flags);
  } catch (e) {
    return handleError(e);
  }
}

const patchSchema = z.object({ key: z.string(), enabled: z.boolean() });

export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = patchSchema.parse(await req.json());
    const flag = await prisma.featureFlag.upsert({
      where: { key: body.key },
      update: { enabled: body.enabled },
      create: { key: body.key, enabled: body.enabled },
    });
    await recordAudit(admin.id, "feature_flag", null, { key: body.key, enabled: body.enabled });
    return ok(flag);
  } catch (e) {
    return handleError(e);
  }
}
