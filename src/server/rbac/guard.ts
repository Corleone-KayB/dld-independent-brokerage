import "server-only";
import { auth } from "@/server/auth/config";
import { anyRoleHasPermission, type AppRole, type Permission } from "./permissions";

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

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  roles: AppRole[];
  partnerId: string | null;
  brokerId: string | null;
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

/** True if the user owns the partner-scoped resource, or holds a broader manage-all permission. */
export function ownsPartnerResource(
  user: SessionUser,
  resourcePartnerId: string | null | undefined,
  broadPermission: Permission,
): boolean {
  if (anyRoleHasPermission(user.roles, broadPermission)) return true;
  return !!user.partnerId && user.partnerId === resourcePartnerId;
}

export function toErrorResponse(error: unknown) {
  if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
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
