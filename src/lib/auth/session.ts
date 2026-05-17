import { cookies, headers } from "next/headers";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE = "tv_session";
const SESSION_TTL_DAYS = 30;

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(userId: string) {
  const token = generateToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  const h = headers();
  const ua = h.get("user-agent") ?? undefined;
  const ip = h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? undefined;

  await prisma.session.create({
    data: { userId, token, userAgent: ua, ipAddress: ip ?? undefined, expiresAt },
  });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });

  return token;
}

export async function destroyCurrentSession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { token } }).catch(() => {});
  }
  cookies().delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  if (session.user.status === "BANNED" || session.user.status === "SUSPENDED") return null;
  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}
