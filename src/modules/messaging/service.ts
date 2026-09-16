import "server-only";
import { prisma } from "@/server/db/client";
import { getConnectionBetween } from "@/modules/network/service";

/**
 * Messaging is the one Phase 3 feature gated on a prior NetworkConnection
 * (decision 3) — every entry point below re-verifies ACCEPTED status
 * server-side rather than trusting a client-supplied conversation id.
 */
async function assertConnected(brokerAId: string, brokerBId: string) {
  const connection = await getConnectionBetween(brokerAId, brokerBId);
  if (!connection || connection.status !== "ACCEPTED") {
    throw new Error("You must be connected with this broker before messaging them");
  }
}

export async function getOrCreateConversation(brokerId: string, otherBrokerId: string) {
  if (brokerId === otherBrokerId) throw new Error("You cannot message yourself");
  await assertConnected(brokerId, otherBrokerId);

  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { brokerId } } },
        { participants: { some: { brokerId: otherBrokerId } } },
      ],
    },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      participants: {
        create: [{ brokerId }, { brokerId: otherBrokerId }],
      },
    },
  });
}

export async function assertParticipant(conversationId: string, brokerId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_brokerId: { conversationId, brokerId } },
  });
  if (!participant) throw new Error("You are not part of this conversation");
  return participant;
}

export async function listConversationsForBroker(brokerId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { brokerId } } },
    include: {
      participants: { include: { broker: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  return Promise.all(
    conversations.map(async (conversation) => {
      const self = conversation.participants.find((p) => p.brokerId === brokerId)!;
      const other = conversation.participants.find((p) => p.brokerId !== brokerId)!;
      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conversation.id,
          senderBrokerId: { not: brokerId },
          createdAt: { gt: self.lastReadAt ?? new Date(0) },
        },
      });
      return {
        id: conversation.id,
        otherBroker: other.broker,
        lastMessage: conversation.messages[0] ?? null,
        unreadCount,
        updatedAt: conversation.updatedAt,
      };
    }),
  );
}

export async function listMessages(conversationId: string, brokerId: string) {
  await assertParticipant(conversationId, brokerId);
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    include: { sender: true },
  });
}

export async function markConversationRead(conversationId: string, brokerId: string) {
  await assertParticipant(conversationId, brokerId);
  return prisma.conversationParticipant.update({
    where: { conversationId_brokerId: { conversationId, brokerId } },
    data: { lastReadAt: new Date() },
  });
}

export async function sendMessage(conversationId: string, senderBrokerId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Message cannot be empty");

  await assertParticipant(conversationId, senderBrokerId);

  return prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: { conversationId, senderBrokerId, body: trimmed },
      include: { sender: true },
    });
    await tx.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
    await tx.conversationParticipant.update({
      where: { conversationId_brokerId: { conversationId, brokerId: senderBrokerId } },
      data: { lastReadAt: new Date() },
    });
    return message;
  });
}

export async function getConversationById(conversationId: string, brokerId: string) {
  await assertParticipant(conversationId, brokerId);
  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: { participants: { include: { broker: true } } },
  });
  const other = conversation.participants.find((p) => p.brokerId !== brokerId)!.broker;
  return { id: conversation.id, otherBroker: other };
}
