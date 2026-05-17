import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { recordActivity } from "@/lib/admin/audit";
import { handleError, ok, err } from "@/lib/api";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(1),
});

// 10 attempts per IP per 5 minutes. Tight enough to slow credential stuffing,
// loose enough that a frustrated typist won't get locked out.
const LIMIT = 10;
const WINDOW_MS = 5 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req.headers);
    const limit = rateLimit(`login:${ip}`, LIMIT, WINDOW_MS);
    if (!limit.ok) {
      return err(
        `Too many login attempts. Try again in ${limit.retryAfterSeconds}s.`,
        429,
        "RATE_LIMITED",
      );
    }

    const body = await req.json();
    const { emailOrUsername, password } = schema.parse(body);

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: emailOrUsername }, { username: emailOrUsername }] },
    });
    if (!user) return err("Invalid credentials", 401, "INVALID_CREDENTIALS");

    if (user.status === "BANNED") return err("Account banned", 403, "BANNED");
    if (user.status === "SUSPENDED") return err("Account suspended", 403, "SUSPENDED");

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) return err("Invalid credentials", 401, "INVALID_CREDENTIALS");

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await createSession(user.id);
    await recordActivity(user.id, "login");
    return ok({ id: user.id, email: user.email, username: user.username, role: user.role });
  } catch (e) {
    return handleError(e);
  }
}
