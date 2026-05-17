import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { recordAudit } from "@/lib/admin/audit";
import { handleError, ok } from "@/lib/api";

const createSchema = z.object({
  title: z.string().min(3).max(200),
  summary: z.string().min(3).max(1000),
  source: z.string().min(1).max(64),
  url: z.string().url().optional(),
  ticker: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin();
    const body = createSchema.parse(await req.json());
    let symbolId: string | null = null;
    if (body.ticker) {
      const sym = await prisma.symbol.findUnique({ where: { ticker: body.ticker.toUpperCase() } });
      symbolId = sym?.id ?? null;
    }
    const item = await prisma.newsItem.create({
      data: {
        title: body.title,
        summary: body.summary,
        source: body.source,
        url: body.url,
        symbolId,
        publishedAt: new Date(),
      },
    });
    await recordAudit(admin.id, "create_news", null, { id: item.id, title: item.title });
    return ok(item);
  } catch (e) {
    return handleError(e);
  }
}
