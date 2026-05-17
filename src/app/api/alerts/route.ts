import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { handleError, ok, err } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    const alerts = await prisma.alert.findMany({
      where: { userId: user.id },
      include: { symbol: true },
      orderBy: { createdAt: "desc" },
    });
    return ok(alerts);
  } catch (e) {
    return handleError(e);
  }
}

const createSchema = z.object({
  ticker: z.string(),
  condition: z.enum(["PRICE_ABOVE", "PRICE_BELOW", "PCT_CHANGE", "VOLUME_ABOVE"]),
  value: z.number(),
  message: z.string().max(140).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = createSchema.parse(await req.json());
    const sym = await prisma.symbol.findUnique({ where: { ticker: body.ticker.toUpperCase() } });
    if (!sym) return err("Symbol not found", 404);

    const count = await prisma.alert.count({ where: { userId: user.id, status: "active" } });
    if (count >= user.maxAlerts) {
      return err(`You've reached the maximum of ${user.maxAlerts} active alerts`, 403, "LIMIT");
    }

    const alert = await prisma.alert.create({
      data: {
        userId: user.id,
        symbolId: sym.id,
        condition: body.condition,
        value: body.value,
        message: body.message ?? null,
      },
    });
    return ok(alert);
  } catch (e) {
    return handleError(e);
  }
}
