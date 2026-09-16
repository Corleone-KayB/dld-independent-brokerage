import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/server/db/client";
import {
  setNetworkOptIn,
  listDiscoverableBrokers,
  listMyConnections,
  requestConnection,
  acceptConnection,
  declineConnection,
  revokeConnection,
  getConnectionBetween,
} from "@/modules/network/service";

/**
 * Uses dedicated fixture brokers (not the shared seed brokers) because
 * Vitest runs test files in parallel — mutating a seeded broker's
 * networkOptIn/connections from two files at once caused real cross-file
 * flakiness during development. Fixtures make this file fully isolated.
 */
async function makeFixtureBroker(tag: string) {
  const user = await prisma.user.create({ data: { email: `network-conn-${tag}-${Date.now()}@test.local` } });
  const broker = await prisma.broker.create({
    data: { userId: user.id, slug: `network-conn-${tag}-${Date.now()}`, name: `Fixture Broker ${tag}` },
  });
  return { userId: user.id, broker };
}

describe("DLD Independent Brokerage Network — membership & connections (requires local Postgres + seed data)", () => {
  const createdConnectionIds: string[] = [];
  let brokerA: { id: string };
  let brokerB: { id: string };
  let userAId: string;
  let userBId: string;

  beforeAll(async () => {
    const a = await makeFixtureBroker("a");
    const b = await makeFixtureBroker("b");
    brokerA = a.broker;
    brokerB = b.broker;
    userAId = a.userId;
    userBId = b.userId;
  });

  afterAll(async () => {
    await prisma.networkConnection.deleteMany({ where: { id: { in: createdConnectionIds } } });
    await prisma.broker.deleteMany({ where: { id: { in: [brokerA.id, brokerB.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [userAId, userBId] } } });
    await prisma.$disconnect();
  });

  it("refuses a connection request when the requester has not opted in", async () => {
    await setNetworkOptIn(brokerA.id, false);
    await setNetworkOptIn(brokerB.id, true);
    await expect(requestConnection(brokerA.id, brokerB.id)).rejects.toThrow(/opt in/i);
  });

  it("refuses a connection request when the target has not opted in", async () => {
    await setNetworkOptIn(brokerA.id, true);
    await setNetworkOptIn(brokerB.id, false);
    await expect(requestConnection(brokerA.id, brokerB.id)).rejects.toThrow(/not part of the/i);
  });

  it("refuses a self-connection request", async () => {
    await setNetworkOptIn(brokerA.id, true);
    await expect(requestConnection(brokerA.id, brokerA.id)).rejects.toThrow(/yourself/i);
  });

  it("creates a REQUESTED connection once both brokers have opted in, visible to both sides", async () => {
    await setNetworkOptIn(brokerA.id, true);
    await setNetworkOptIn(brokerB.id, true);

    const connection = await requestConnection(brokerA.id, brokerB.id);
    createdConnectionIds.push(connection.id);

    expect(connection.status).toBe("REQUESTED");
    expect(connection.requesterId).toBe(brokerA.id);

    const [aConnections, bConnections] = await Promise.all([
      listMyConnections(brokerA.id),
      listMyConnections(brokerB.id),
    ]);
    expect(aConnections.outgoing.some((c) => c.id === connection.id)).toBe(true);
    expect(bConnections.incoming.some((c) => c.id === connection.id)).toBe(true);

    const discoverable = await listDiscoverableBrokers(brokerA.id);
    const entry = discoverable.find((b) => b.id === brokerB.id);
    expect(entry?.connectionStatus).toBe("REQUESTED_BY_ME");
  });

  it("rejects a duplicate pending request between the same pair, regardless of direction", async () => {
    await expect(requestConnection(brokerA.id, brokerB.id)).rejects.toThrow(/already pending/i);
    await expect(requestConnection(brokerB.id, brokerA.id)).rejects.toThrow(/already pending/i);
  });

  it("only the recipient can accept, and only while the request is pending", async () => {
    const connection = await getConnectionBetween(brokerA.id, brokerB.id);
    await expect(acceptConnection(connection!.id, brokerA.id)).rejects.toThrow(/only the recipient/i);

    const accepted = await acceptConnection(connection!.id, brokerB.id);
    expect(accepted.status).toBe("ACCEPTED");
    expect(accepted.respondedAt).not.toBeNull();

    await expect(acceptConnection(connection!.id, brokerB.id)).rejects.toThrow(/no longer pending/i);
  });

  it("reflects CONNECTED status for both sides once accepted", async () => {
    const discoverable = await listDiscoverableBrokers(brokerB.id);
    const entry = discoverable.find((b) => b.id === brokerA.id);
    expect(entry?.connectionStatus).toBe("CONNECTED");
  });

  it("either party can revoke an accepted connection", async () => {
    const connection = await getConnectionBetween(brokerA.id, brokerB.id);
    const revoked = await revokeConnection(connection!.id, brokerA.id);
    expect(revoked.status).toBe("REVOKED");
  });

  it("allows re-requesting a connection after it was revoked, reusing the same canonical pair row", async () => {
    const before = await getConnectionBetween(brokerA.id, brokerB.id);
    const reRequested = await requestConnection(brokerB.id, brokerA.id);
    expect(reRequested.id).toBe(before!.id);
    expect(reRequested.status).toBe("REQUESTED");
    expect(reRequested.requesterId).toBe(brokerB.id);
  });

  it("lets the recipient decline a pending request, and only the requester can cancel one", async () => {
    const connection = await getConnectionBetween(brokerA.id, brokerB.id);
    await expect(revokeConnection(connection!.id, brokerA.id)).rejects.toThrow(/only the requester/i);

    const declined = await declineConnection(connection!.id, brokerA.id);
    expect(declined.status).toBe("DECLINED");
  });
});
