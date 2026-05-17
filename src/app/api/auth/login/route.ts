import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { recordActivity } from "@/lib/admin/audit";
import { handleError, ok, err } from "@/lib/api";

const schema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
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
