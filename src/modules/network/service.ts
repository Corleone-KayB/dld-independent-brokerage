import "server-only";
import { prisma } from "@/server/db/client";
import { enforceRateLimit, hoursAgo, RATE_LIMITS } from "@/server/security/rate-limit";

/**
 * NetworkConnection.brokerAId/brokerBId are canonically ordered (lower id
 * first) so the pair has a single row regardless of who initiates — the
 * separate `requesterId` field records who actually sent the request.
 */
function canonicalPair(idA: string, idB: string): [string, string] {
  return idA < idB ? [idA, idB] : [idB, idA];
}

export async function setNetworkOptIn(brokerId: string, optIn: boolean) {
  return prisma.broker.update({ where: { id: brokerId }, data: { networkOptIn: optIn } });
}

export type ConnectionStatusForViewer =
  | "NONE"
  | "REQUESTED_BY_ME"
  | "REQUESTED_BY_THEM"
  | "CONNECTED"
  | "DECLINED"
  | "REVOKED";

export async function listDiscoverableBrokers(viewerBrokerId: string) {
  const brokers = await prisma.broker.findMany({
    where: { networkOptIn: true, id: { not: viewerBrokerId } },
    orderBy: { name: "asc" },
  });
  if (brokers.length === 0) return [];

  const connections = await prisma.networkConnection.findMany({
    where: {
      OR: brokers.map((b) => {
        const [brokerAId, brokerBId] = canonicalPair(viewerBrokerId, b.id);
        return { brokerAId, brokerBId };
      }),
    },
  });
  const byOtherBrokerId = new Map(
    connections.map((c) => [c.brokerAId === viewerBrokerId ? c.brokerBId : c.brokerAId, c]),
  );

  return brokers.map((b) => {
    const connection = byOtherBrokerId.get(b.id);
    let connectionStatus: ConnectionStatusForViewer = "NONE";
    if (connection) {
      if (connection.status === "ACCEPTED") connectionStatus = "CONNECTED";
      else if (connection.status === "REQUESTED") {
        connectionStatus = connection.requesterId === viewerBrokerId ? "REQUESTED_BY_ME" : "REQUESTED_BY_THEM";
      } else if (connection.status === "DECLINED") connectionStatus = "DECLINED";
      else if (connection.status === "REVOKED") connectionStatus = "REVOKED";
    }
    return {
      id: b.id,
      slug: b.slug,
      name: b.name,
      photoUrl: b.photoUrl,
      bio: b.bio,
      specializations: b.specializations,
      areasServed: b.areasServed,
      verificationStatus: b.verificationStatus,
      rating: b.rating,
      connectionStatus,
      connectionId: connection?.id ?? null,
    };
  });
}

export async function getConnectionBetween(brokerId: string, otherBrokerId: string) {
  const [brokerAId, brokerBId] = canonicalPair(brokerId, otherBrokerId);
  return prisma.networkConnection.findUnique({ where: { brokerAId_brokerBId: { brokerAId, brokerBId } } });
}

export async function getConnectionById(id: string) {
  return prisma.networkConnection.findUnique({
    where: { id },
    include: { brokerA: true, brokerB: true },
  });
}

export async function requestConnection(requesterBrokerId: string, targetBrokerId: string) {
  if (requesterBrokerId === targetBrokerId) {
    throw new Error("You cannot send a network connection request to yourself");
  }

  const [requester, target] = await Promise.all([
    prisma.broker.findUniqueOrThrow({ where: { id: requesterBrokerId } }),
    prisma.broker.findUnique({ where: { id: targetBrokerId } }),
  ]);
  if (!target) throw new Error("Broker not found");
  if (!requester.networkOptIn) throw new Error("Opt in to the Independent Brokerage Network before connecting");
  if (!target.networkOptIn) throw new Error("This broker is not part of the Independent Brokerage Network");

  await enforceRateLimit({
    max: RATE_LIMITS.CONNECTION_REQUESTS_PER_DAY,
    action: "network connection requests",
    count: () =>
      prisma.networkConnection.count({
        where: { requesterId: requesterBrokerId, createdAt: { gte: hoursAgo(24) } },
      }),
  });

  const [brokerAId, brokerBId] = canonicalPair(requesterBrokerId, targetBrokerId);
  const existing = await prisma.networkConnection.findUnique({
    where: { brokerAId_brokerBId: { brokerAId, brokerBId } },
  });

  if (existing) {
    if (existing.status === "ACCEPTED") throw new Error("You are already connected with this broker");
    if (existing.status === "REQUESTED") throw new Error("A connection request with this broker is already pending");
    // DECLINED or REVOKED — allow re-requesting by reusing the same pair row.
    return prisma.networkConnection.update({
      where: { id: existing.id },
      data: { status: "REQUESTED", requesterId: requesterBrokerId, respondedAt: null },
    });
  }

  return prisma.networkConnection.create({
    data: { brokerAId, brokerBId, requesterId: requesterBrokerId, status: "REQUESTED" },
  });
}

export async function acceptConnection(connectionId: string, actingBrokerId: string) {
  return prisma.$transaction(async (tx) => {
    const connection = await tx.networkConnection.findUniqueOrThrow({ where: { id: connectionId } });
    const recipientId = connection.brokerAId === connection.requesterId ? connection.brokerBId : connection.brokerAId;
    if (recipientId !== actingBrokerId) throw new Error("Only the recipient can accept this request");
    if (connection.status !== "REQUESTED") throw new Error("This request is no longer pending");
    return tx.networkConnection.update({
      where: { id: connectionId },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    });
  });
}

export async function declineConnection(connectionId: string, actingBrokerId: string) {
  return prisma.$transaction(async (tx) => {
    const connection = await tx.networkConnection.findUniqueOrThrow({ where: { id: connectionId } });
    const recipientId = connection.brokerAId === connection.requesterId ? connection.brokerBId : connection.brokerAId;
    if (recipientId !== actingBrokerId) throw new Error("Only the recipient can decline this request");
    if (connection.status !== "REQUESTED") throw new Error("This request is no longer pending");
    return tx.networkConnection.update({
      where: { id: connectionId },
      data: { status: "DECLINED", respondedAt: new Date() },
    });
  });
}

export async function revokeConnection(connectionId: string, actingBrokerId: string) {
  return prisma.$transaction(async (tx) => {
    const connection = await tx.networkConnection.findUniqueOrThrow({ where: { id: connectionId } });
    const isInvolved = connection.brokerAId === actingBrokerId || connection.brokerBId === actingBrokerId;
    if (!isInvolved) throw new Error("You are not part of this connection");
    if (connection.status === "REQUESTED" && connection.requesterId !== actingBrokerId) {
      throw new Error("Only the requester can cancel a pending request — decline it instead");
    }
    if (connection.status !== "REQUESTED" && connection.status !== "ACCEPTED") {
      throw new Error("This connection cannot be revoked from its current state");
    }
    return tx.networkConnection.update({
      where: { id: connectionId },
      data: { status: "REVOKED", respondedAt: new Date() },
    });
  });
}

export async function listMyConnections(brokerId: string) {
  const rows = await prisma.networkConnection.findMany({
    where: { OR: [{ brokerAId: brokerId }, { brokerBId: brokerId }] },
    include: { brokerA: true, brokerB: true },
    orderBy: { createdAt: "desc" },
  });

  const shaped = rows.map((row) => ({
    id: row.id,
    status: row.status,
    isRequester: row.requesterId === brokerId,
    createdAt: row.createdAt,
    respondedAt: row.respondedAt,
    otherBroker: row.brokerAId === brokerId ? row.brokerB : row.brokerA,
  }));

  return {
    incoming: shaped.filter((c) => c.status === "REQUESTED" && !c.isRequester),
    outgoing: shaped.filter((c) => c.status === "REQUESTED" && c.isRequester),
    accepted: shaped.filter((c) => c.status === "ACCEPTED"),
    past: shaped.filter((c) => c.status === "DECLINED" || c.status === "REVOKED"),
  };
}
