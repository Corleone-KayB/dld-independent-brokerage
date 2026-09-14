import type { DefaultSession } from "next-auth";
import type { AppRole } from "@/server/rbac/permissions";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roles: AppRole[];
      partnerId: string | null;
      brokerId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    roles: AppRole[];
    partnerId: string | null;
    brokerId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roles: AppRole[];
    partnerId: string | null;
    brokerId: string | null;
  }
}
