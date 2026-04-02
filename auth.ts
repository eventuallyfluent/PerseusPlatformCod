import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import { isAdminEmail } from "@/lib/utils";

const resendApiKey = process.env.AUTH_RESEND_KEY || process.env.RESEND_API_KEY;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      apiKey: resendApiKey,
      from: process.env.AUTH_EMAIL_FROM ?? "Perseus Platform <onboarding@example.com>",
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.isAdmin = isAdminEmail(user.email);
      }

      return session;
    },
  },
  session: {
    strategy: "database",
  },
  trustHost: true,
});
