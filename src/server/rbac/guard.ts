import "server-only";
import { auth } from "@/server/auth/config";
import { anyRoleHasPermission, type Permission } from "./permissions";
import { RateLimitError } from "@/server/security/rate-limit";
import { ownsPartnerResource, isInvolvedBroker, type SessionUser } from "./ownership";

export type { SessionUser };
export { ownsPartnerResource, isInvolvedBroker };

export class UnauthorizedError extends Error {
  status = 401;
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  status = 403;
  constructor(message = "You do not have permission to perform this action") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Reads the server session. Never trusts anything the client sends about
 * its own role — roles are always re-derived from the signed JWT/session.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  const user = session.user as unknown as SessionUser;
  return user;
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new UnauthorizedError();
  return user;
}

export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireSessionUser();
  if (!anyRoleHasPermission(user.roles, permission)) {
    throw new ForbiddenError(`Missing permission: ${permission}`);
  }
  return user;
}

/**
 * Use when an endpoint should admit either an "own-scope" role or a
 * broader "manage-all" role (e.g. a broker's own-deals permission vs a
 * sales manager's manage-all permission) — requiring only the own-scope
 * permission would wrongly 403 the manage-all roles that never hold it.
 */
export async function requireAnyPermission(permissions: Permission[]): Promise<SessionUser> {
  const user = await requireSessionUser();
  if (!permissions.some((permission) => anyRoleHasPermission(user.roles, permission))) {
    throw new ForbiddenError(`Missing permission: one of [${permissions.join(", ")}]`);
  }
  return user;
}

export function toErrorResponse(error: unknown) {
  if (error instanceof UnauthorizedError || error instanceof ForbiddenError || error instanceof RateLimitError) {
    return {
      status: error.status,
      body: {
        data: null,
        error: { code: error.name, message: error.message },
        meta: {},
      },
    };
  }
  console.error(error);
  return {
    status: 500,
    body: {
      data: null,
      error: { code: "INTERNAL_ERROR", message: "Unexpected server error" },
      meta: {},
    },
  };
}
