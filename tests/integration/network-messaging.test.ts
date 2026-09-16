import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/server/db/client";
import { setNetworkOptIn, requestConnection, acceptConnection } from "@/modules/network/service";
import {
  getOrCreateConversation,
  listMessages,
  sendMessage,
  listConversationsForBroker,
  markConversationRead,
} from "@/modules/messaging/service";

/**
 * Dedicated fixture brokers, not shared seed brokers — Vitest runs test
 * files in parallel, and this suite mutates NetworkConnection/Conversation
 * state, so sharing seed brokers with network-connections.test.ts caused
 * real cross-file flakiness during development.
 */
async function makeFixtureBroker(tag: string) {
  const user = await prisma.user.create({ data: { email: `network-msg-${tag}-${Date.now()}@test.local` } });
  const broker = await prisma.broker.create({
    data: { userId: user.id, slug: `network-msg-${tag}-${Date.now()}`, name: `Fixture Broker ${tag}` },
  });
  return { userId: user.id, broker };
}

describe("DLD Independent Brokerage Network — secure messaging (requires local Postgres + seed data)", () => {
  let brokerA: { id: string };
  let brokerB: { id: string };
  let strangerBroker: { id: string };
  let userAId: string;
  let userBId: string;
  let userStrangerId: string;
  let conversationId: string;

  beforeAll(async () => {
    const a = await makeFixtureBroker("a");
    const b = await makeFixtureBroker("b");
    const s = await makeFixtureBroker("stranger");
    brokerA = a.broker;
    brokerB = b.broker;
    strangerBroker = s.broker;
    userAId = a.userId;
    userBId = b.userId;
    userStrangerId = s.userId;
  });

  afterAll(async () => {
    if (conversationId) {
      await prisma.message.deleteMany({ where: { conversationId } });
      await prisma.conversationParticipant.deleteMany({ where: { conversationId } });
      await prisma.conversation.delete({ where: { id: conversationId } }).catch(() => {});
    }
    await prisma.networkConnection.deleteMany({
      where: { OR: [{ brokerAId: { in: [brokerA.id, brokerB.id] } }, { brokerBId: { in: [brokerA.id, brokerB.id] } }] },
    });
    await prisma.broker.deleteMany({ where: { id: { in: [brokerA.id, brokerB.id, strangerBroker.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId, userStrangerId] } } });
    await prisma.$disconnect();
  });

  it("refuses to start a conversation without an accepted connection", async () => {
    await expect(getOrCreateConversation(brokerA.id, brokerB.id)).rejects.toThrow(/must be connected/i);
  });

  it("refuses to message yourself", async () => {
    await expect(getOrCreateConversation(brokerA.id, brokerA.id)).rejects.toThrow(/yourself/i);
  });

  it("creates a conversation once the two brokers are connected, and reuses it on a second call", async () => {
    await setNetworkOptIn(brokerA.id, true);
    await setNetworkOptIn(brokerB.id, true);
    const connection = await requestConnection(brokerA.id, brokerB.id);
    await acceptConnection(connection.id, brokerB.id);

    const conversation = await getOrCreateConversation(brokerA.id, brokerB.id);
    conversationId = conversation.id;

    const again = await getOrCreateConversation(brokerB.id, brokerA.id);
    expect(again.id).toBe(conversation.id);
  });

  it("refuses a broker who is not a participant from reading or sending", async () => {
    await expect(listMessages(conversationId, strangerBroker.id)).rejects.toThrow(/not part of/i);
    await expect(sendMessage(conversationId, strangerBroker.id, "hi")).rejects.toThrow(/not part of/i);
  });

  it("rejects an empty or whitespace-only message body", async () => {
    await expect(sendMessage(conversationId, brokerA.id, "   ")).rejects.toThrow(/empty/i);
  });

  it("lets a participant send and read messages in order", async () => {
    await sendMessage(conversationId, brokerA.id, "Hi, do you have anything in Business Bay?");
    await sendMessage(conversationId, brokerB.id, "Yes — I have two units. Let me send details.");

    const messages = await listMessages(conversationId, brokerA.id);
    expect(messages).toHaveLength(2);
    expect(messages[0]!.body).toMatch(/Business Bay/);
    expect(messages[1]!.senderBrokerId).toBe(brokerB.id);
  });

  it("tracks unread count per participant and clears it on read", async () => {
    const bView = await listConversationsForBroker(brokerB.id);
    const convoForB = bView.find((c) => c.id === conversationId)!;
    expect(convoForB.unreadCount).toBe(0); // brokerB's own send marks their side read

    await sendMessage(conversationId, brokerA.id, "Following up on that.");
    const bViewAfter = await listConversationsForBroker(brokerB.id);
    expect(bViewAfter.find((c) => c.id === conversationId)!.unreadCount).toBe(1);

    await markConversationRead(conversationId, brokerB.id);
    const bViewRead = await listConversationsForBroker(brokerB.id);
    expect(bViewRead.find((c) => c.id === conversationId)!.unreadCount).toBe(0);
  });
});
