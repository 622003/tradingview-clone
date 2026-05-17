import { prisma } from "@/lib/prisma";

export async function recordAudit(
  actorId: string,
  action: string,
  targetId?: string | null,
  details?: Record<string, unknown>,
) {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      targetId: targetId ?? null,
      details: details ? JSON.stringify(details) : null,
    },
  });
}

export async function recordActivity(
  userId: string,
  action: string,
  metadata?: Record<string, unknown>,
  ipAddress?: string,
) {
  await prisma.activityLog.create({
    data: {
      userId,
      action,
      metadata: metadata ? JSON.stringify(metadata) : null,
      ipAddress,
    },
  });
}
