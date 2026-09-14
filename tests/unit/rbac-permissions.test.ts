import { describe, it, expect } from "vitest";
import { roleHasPermission, anyRoleHasPermission, PERMISSIONS } from "@/server/rbac/permissions";

describe("RBAC permission matrix", () => {
  it("allows a broker to manage their own listings but not all properties", () => {
    expect(roleHasPermission("BROKER", PERMISSIONS.PROPERTIES_MANAGE_OWN)).toBe(true);
    expect(roleHasPermission("BROKER", PERMISSIONS.PROPERTIES_MANAGE_ALL)).toBe(false);
  });

  it("denies partner-approval permission to a broker (deny by default)", () => {
    expect(roleHasPermission("BROKER", PERMISSIONS.PARTNERS_APPROVE_REJECT)).toBe(false);
  });

  it("allows compliance managers to verify documents and view audit logs", () => {
    expect(roleHasPermission("COMPLIANCE_MANAGER", PERMISSIONS.COMPLIANCE_VERIFY_DOCUMENTS)).toBe(true);
    expect(roleHasPermission("COMPLIANCE_MANAGER", PERMISSIONS.AUDIT_VIEW)).toBe(true);
  });

  it("grants super admin every permission", () => {
    expect(roleHasPermission("SUPER_ADMIN", PERMISSIONS.SYSTEM_MANAGE_SETTINGS)).toBe(true);
    expect(roleHasPermission("SUPER_ADMIN", PERMISSIONS.PARTNERS_SUSPEND)).toBe(true);
  });

  it("anyRoleHasPermission is true if at least one role grants it", () => {
    expect(anyRoleHasPermission(["BUYER", "BROKER"], PERMISSIONS.PROPERTIES_MANAGE_OWN)).toBe(true);
    expect(anyRoleHasPermission(["BUYER", "TENANT"], PERMISSIONS.PROPERTIES_MANAGE_OWN)).toBe(false);
  });

  it("denies unknown/unlisted roles by default", () => {
    // @ts-expect-error intentionally testing an unmapped role key
    expect(roleHasPermission("UNKNOWN_ROLE", PERMISSIONS.PROPERTIES_VIEW_PUBLIC)).toBe(false);
  });
});
