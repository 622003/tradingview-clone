import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { recordAudit } from "@/lib/admin/audit";
import { handleError, ok } from "@/lib/api";

const createSchema = z.object({
  ticker: z.string().min(1).max(16),
  name: z.string().min(1).max(120),
  exchange: z.string().min(1).max(32),
  type: z.enum(["stock", "crypto", "forex", "index", "commodity"]),
  sector: z.string().optional(),
  industry: z.string().optional(),
  country: z.string().optional(),
  description: z.string().optional(),
});

export async function GET() {
  try {
    await requireAdmin();
    const symbols = await prisma.symbol.findMany({ orderBy: { ticker: "asc" } });
    return ok(symbols);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = createSchema.parse(await req.json());
    const sym = await prisma.symbol.create({ data: { ...body, ticker: body.ticker.toUpperCase() } });
    await recordAudit(admin.id, "create_symbol", null, { ticker: sym.ticker });
    return ok(sym);
  } catch (e) {
    return handleError(e);
  }
}
