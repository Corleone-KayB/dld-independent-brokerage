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

  // Phase 2
  it("allows a broker to manage own deals and use the lead marketplace, but not manage all deals or commissions", () => {
    expect(roleHasPermission("BROKER", PERMISSIONS.DEALS_MANAGE_OWN)).toBe(true);
    expect(roleHasPermission("BROKER", PERMISSIONS.LEADS_MARKETPLACE_VIEW)).toBe(true);
    expect(roleHasPermission("BROKER", PERMISSIONS.LEADS_MARKETPLACE_ACCEPT)).toBe(true);
    expect(roleHasPermission("BROKER", PERMISSIONS.DEALS_MANAGE_ALL)).toBe(false);
    expect(roleHasPermission("BROKER", PERMISSIONS.COMMISSIONS_MANAGE)).toBe(false);
  });

  it("only finance/marketing/admin roles can manage commissions and marketing content", () => {
    expect(roleHasPermission("FINANCE_MANAGER", PERMISSIONS.COMMISSIONS_MANAGE)).toBe(true);
    expect(roleHasPermission("MARKETING_MANAGER", PERMISSIONS.MARKETING_MANAGE)).toBe(true);
    expect(roleHasPermission("BROKER", PERMISSIONS.MARKETING_MANAGE)).toBe(false);
    expect(roleHasPermission("COMPLIANCE_MANAGER", PERMISSIONS.COMMISSIONS_MANAGE)).toBe(false);
  });

  it("grants the developer role only its own-project management, not broader property management", () => {
    expect(roleHasPermission("DEVELOPER", PERMISSIONS.DEVELOPER_MANAGE_OWN)).toBe(true);
    expect(roleHasPermission("DEVELOPER", PERMISSIONS.PROPERTIES_MANAGE_ALL)).toBe(false);
  });

  it("restricts advanced analytics to management roles", () => {
    expect(roleHasPermission("SALES_MANAGER", PERMISSIONS.ANALYTICS_VIEW)).toBe(true);
    expect(roleHasPermission("BROKER", PERMISSIONS.ANALYTICS_VIEW)).toBe(false);
    expect(roleHasPermission("SUPPORT_AGENT", PERMISSIONS.ANALYTICS_VIEW)).toBe(false);
  });
});
