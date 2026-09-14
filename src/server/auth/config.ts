import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/server/db/client";
import { writeAuditLog } from "@/server/audit/log";
import type { AppRole } from "@/server/rbac/permissions";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/partner/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: {
            roles: true,
            partner: { select: { id: true } },
            broker: { select: { id: true } },
          },
        });

        if (!user || !user.passwordHash || !user.isActive) {
          return null;
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
          await writeAuditLog({
            actorUserId: null,
            action: "LOGIN_FAILED",
            entityType: "User",
            entityId: user.id,
            metadata: { email },
          });
          return null;
        }

        await writeAuditLog({
          actorUserId: user.id,
          action: "LOGIN_SUCCESS",
          entityType: "User",
          entityId: user.id,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles.map((r) => r.role),
          partnerId: user.partner?.id ?? null,
          brokerId: user.broker?.id ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as {
          id: string;
          roles: AppRole[];
          partnerId: string | null;
          brokerId: string | null;
        };
        token.id = u.id;
        token.roles = u.roles;
        token.partnerId = u.partnerId;
        token.brokerId = u.brokerId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roles = (token.roles as AppRole[]) ?? [];
        session.user.partnerId = (token.partnerId as string | null) ?? null;
        session.user.brokerId = (token.brokerId as string | null) ?? null;
      }
      return session;
    },
  },
});
