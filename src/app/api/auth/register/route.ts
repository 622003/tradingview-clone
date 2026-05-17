import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { recordActivity } from "@/lib/admin/audit";
import { handleError, ok, err } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscore only"),
  password: z.string().min(8).max(128),
  displayName: z.string().max(64).optional(),
});

// 5 new-account creations per IP per hour. Higher than a human needs, low
// enough to make scripted spam expensive.
const LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req.headers);
    const limit = rateLimit(`register:${ip}`, LIMIT, WINDOW_MS);
    if (!limit.ok) {
      return err(
        `Too many sign-ups from this address. Try again in ${limit.retryAfterSeconds}s.`,
        429,
        "RATE_LIMITED",
      );
    }

    const body = await req.json();
    const data = schema.parse(body);

    const flag = await prisma.featureFlag.findUnique({ where: { key: "registration.open" } });
    if (flag && !flag.enabled) {
      return err("Registration is currently closed by admin", 403, "REGISTRATION_CLOSED");
    }

    const exists = await prisma.user.findFirst({
      where: { OR: [{ email: data.email }, { username: data.username }] },
    });
    if (exists) {
      return err("Email or username is already in use", 409, "ALREADY_EXISTS");
    }

    const passwordHash = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash,
        displayName: data.displayName ?? null,
      },
    });

    // Auto-create default watchlist
    await prisma.watchlist.create({
      data: { userId: user.id, name: "My Watchlist", isDefault: true },
    });

    await createSession(user.id);
    await recordActivity(user.id, "register");
    return ok({ id: user.id, email: user.email, username: user.username, role: user.role });
  } catch (e) {
    return handleError(e);
  }
}
