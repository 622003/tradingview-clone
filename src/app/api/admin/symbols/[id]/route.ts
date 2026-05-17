import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { recordAudit } from "@/lib/admin/audit";
import { handleError, ok } from "@/lib/api";

const patchSchema = z.object({
  name: z.string().optional(),
  exchange: z.string().optional(),
  type: z.enum(["stock", "crypto", "forex", "index", "commodity"]).optional(),
  sector: z.string().optional(),
  industry: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const body = patchSchema.parse(await req.json());
    const sym = await prisma.symbol.update({ where: { id: params.id }, data: body });
    await recordAudit(admin.id, "update_symbol", null, { ticker: sym.ticker, changes: body });
    return ok(sym);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await requireAdmin();
    const sym = await prisma.symbol.delete({ where: { id: params.id } });
    await recordAudit(admin.id, "delete_symbol", null, { ticker: sym.ticker });
    return ok({});
  } catch (e) {
    return handleError(e);
  }
}
