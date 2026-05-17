import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { handleError, ok, err } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const ticker = url.searchParams.get("symbol")?.toUpperCase();
    const where: Record<string, unknown> = { isPublic: true };
    if (ticker) {
      const sym = await prisma.symbol.findUnique({ where: { ticker } });
      if (!sym) return ok([]);
      where.symbolId = sym.id;
    }
    const ideas = await prisma.idea.findMany({
      where,
      include: {
        user: { select: { username: true, displayName: true, role: true } },
        symbol: true,
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return ok(ideas);
  } catch (e) {
    return handleError(e);
  }
}

const createSchema = z.object({
  title: z.string().min(3).max(140),
  content: z.string().min(10).max(4000),
  bias: z.enum(["long", "short", "neutral", "educational"]),
  ticker: z.string().optional(),
  target: z.number().optional(),
  stop: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user.canPostIdeas) return err("Posting ideas is disabled for your account", 403);
    const body = createSchema.parse(await req.json());
    let symbolId: string | null = null;
    if (body.ticker) {
      const sym = await prisma.symbol.findUnique({ where: { ticker: body.ticker.toUpperCase() } });
      if (!sym) return err("Symbol not found", 404);
      symbolId = sym.id;
    }
    const idea = await prisma.idea.create({
      data: {
        userId: user.id,
        title: body.title,
        content: body.content,
        bias: body.bias,
        symbolId,
        target: body.target ?? null,
        stop: body.stop ?? null,
      },
    });
    return ok(idea);
  } catch (e) {
    return handleError(e);
  }
}
