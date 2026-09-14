import "server-only";
import { prisma } from "@/server/db/client";
import type { Prisma } from "@prisma/client";

export interface AuditEventInput {
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  partnerId?: string | null;
  applicationId?: string | null;
  metadata?: Prisma.InputJsonValue;
}

/** Every privileged mutation must call this. Failures here must not silently vanish. */
export async function writeAuditLog(event: AuditEventInput) {
  return prisma.auditLog.create({
    data: {
      actorUserId: event.actorUserId,
      action: event.action,
      entityType: event.entityType,
      entityId: event.entityId ?? null,
      partnerId: event.partnerId ?? null,
      applicationId: event.applicationId ?? null,
      metadata: event.metadata,
    },
  });
}
