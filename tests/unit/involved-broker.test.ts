import { describe, it, expect } from "vitest";
import { isInvolvedBroker, type SessionUser } from "@/server/rbac/ownership";
import { PERMISSIONS } from "@/server/rbac/permissions";

function makeUser(overrides: Partial<SessionUser>): SessionUser {
  return {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    roles: ["BROKER"],
    partnerId: "partner-1",
    brokerId: "broker-1",
    ...overrides,
  };
}

describe("isInvolvedBroker (Phase 3 broker-identity ownership, distinct from ownsPartnerResource)", () => {
  it("is true when the session's brokerId is among the resource's broker ids", () => {
    const user = makeUser({ brokerId: "broker-1" });
    expect(isInvolvedBroker(user, ["broker-1", "broker-2"])).toBe(true);
  });

  it("is false when the session's brokerId is not among the resource's broker ids", () => {
    const user = makeUser({ brokerId: "broker-3" });
    expect(isInvolvedBroker(user, ["broker-1", "broker-2"])).toBe(false);
  });

  it("is false when the session has no brokerId at all", () => {
    const user = makeUser({ brokerId: null });
    expect(isInvolvedBroker(user, ["broker-1"])).toBe(false);
  });

  it("admits an admin via the optional broad permission even when not involved", () => {
    const admin = makeUser({ brokerId: null, roles: ["SUPER_ADMIN"] });
    expect(isInvolvedBroker(admin, ["broker-1"], PERMISSIONS.NETWORK_MANAGE_ALL)).toBe(true);
  });

  it("does not admit a non-involved broker even if a broad permission is passed but not held", () => {
    const user = makeUser({ brokerId: "broker-3", roles: ["BROKER"] });
    expect(isInvolvedBroker(user, ["broker-1"], PERMISSIONS.NETWORK_MANAGE_ALL)).toBe(false);
  });

  it("ignores null/undefined entries in the resource broker id list", () => {
    const user = makeUser({ brokerId: "broker-1" });
    expect(isInvolvedBroker(user, [null, undefined, "broker-1"])).toBe(true);
  });
});
