/**
 * Pure ownership-check logic, deliberately separated from guard.ts.
 * guard.ts imports next-auth (for auth()), which pulls in next/server —
 * that import chain isn't resolvable in the Vitest unit-test environment
 * (no Next.js runtime context), so anything meant to be unit-testable in
 * isolation must not live in a module that also imports next-auth at scope.
 * guard.ts re-exports everything here so no existing call site needs to
 * change its import path.
 */
import { anyRoleHasPermission, type AppRole, type Permission } from "./permissions";

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  roles: AppRole[];
  partnerId: string | null;
  brokerId: string | null;
}

/** True if the user owns the partner-scoped resource, or holds a broader manage-all permission. */
export function ownsPartnerResource(
  user: SessionUser,
  resourcePartnerId: string | null | undefined,
  broadPermission: Permission,
): boolean {
  if (anyRoleHasPermission(user.roles, broadPermission)) return true;
  return !!user.partnerId && user.partnerId === resourcePartnerId;
}

/**
 * Phase 3 network resources (connections, referrals, deal-collaborator
 * invites, conversations) are owned by broker *identity*, not by partner
 * scope — "you are the invited/addressed party" is a different shape of
 * ownership than ownsPartnerResource's partner-membership check, and must
 * not be conflated with it. `broadPermission` optionally still admits an
 * admin/oversight role (e.g. network:manage_all) the same way
 * ownsPartnerResource admits a manage-all role.
 */
export function isInvolvedBroker(
  user: SessionUser,
  resourceBrokerIds: Array<string | null | undefined>,
  broadPermission?: Permission,
): boolean {
  if (broadPermission && anyRoleHasPermission(user.roles, broadPermission)) return true;
  return !!user.brokerId && resourceBrokerIds.includes(user.brokerId);
}
