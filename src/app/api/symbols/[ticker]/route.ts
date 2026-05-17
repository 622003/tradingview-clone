import { prisma } from "@/lib/prisma";
import { handleError, ok, err } from "@/lib/api";

export async function GET(_req: Request, { params }: { params: { ticker: string } }) {
  try {
    const ticker = decodeURIComponent(params.ticker).toUpperCase();
    const sym = await prisma.symbol.findUnique({ where: { ticker } });
    if (!sym) return err("Symbol not found", 404);
    return ok(sym);
  } catch (e) {
    return handleError(e);
  }
}
