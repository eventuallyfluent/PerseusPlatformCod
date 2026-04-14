import NextAuth from "next-auth";
import Resend from "next-auth/providers/resend";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import { isPreviewLoginEnabled } from "@/lib/auth/preview-login";
import { BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD, isAdminEmail } from "@/lib/utils";

const resendApiKey = process.env.AUTH_RESEND_KEY || process.env.RESEND_API_KEY;
const previewLoginEnabled = isPreviewLoginEnabled();
const adminLoginPassword = process.env.ADMIN_LOGIN_PASSWORD ?? process.env.AUTH_ADMIN_PASSWORD;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      id: "admin-credentials",
      name: "Admin Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");
        const isBootstrapAdmin = email === BOOTSTRAP_ADMIN_EMAIL && password === BOOTSTRAP_ADMIN_PASSWORD;
        const isConfiguredAdmin = Boolean(adminLoginPassword) && isAdminEmail(email) && password === adminLoginPassword;

        if (!email || !password || (!isConfiguredAdmin && !isBootstrapAdmin)) {
          return null;
        }

        return prisma.user.upsert({
          where: { email },
          update: {
            emailVerified: new Date(),
          },
          create: {
            email,
            name: "Perseus Admin",
            emailVerified: new Date(),
          },
        });
      },
    }),
    ...(previewLoginEnabled
      ? [
          Credentials({
            id: "preview-access",
            name: "Preview Access",
            credentials: {
              previewRole: { label: "Preview Role", type: "text" },
            },
            async authorize(credentials) {
              const previewRole = String(credentials?.previewRole ?? "").trim();

              if (previewRole !== "admin" && previewRole !== "student") {
                return null;
              }

              if (previewRole === "admin") {
                const adminEmail =
                  process.env.ADMIN_EMAIL_ALLOWLIST?.split(",")
                    .map((entry) => entry.trim())
                    .find(Boolean) ?? "admin-preview@perseus.local";

                return prisma.user.upsert({
                  where: { email: adminEmail },
                  update: {
                    name: "Perseus Admin",
                    emailVerified: new Date(),
                  },
                  create: {
                    email: adminEmail,
                    name: "Perseus Admin",
                    emailVerified: new Date(),
                  },
                });
              }

              const student = await prisma.user.upsert({
                where: { email: "student-preview@perseus.local" },
                update: {
                  name: "Perseus Student",
                  emailVerified: new Date(),
                },
                create: {
                  email: "student-preview@perseus.local",
                  name: "Perseus Student",
                  emailVerified: new Date(),
                },
              });

              const firstPublishedCourse = await prisma.course.findFirst({
                where: { status: "PUBLISHED" },
                orderBy: { updatedAt: "desc" },
                select: { id: true },
              });

              if (firstPublishedCourse) {
                await prisma.enrollment.upsert({
                  where: {
                    userId_courseId: {
                      userId: student.id,
                      courseId: firstPublishedCourse.id,
                    },
                  },
                  update: {},
                  create: {
                    userId: student.id,
                    courseId: firstPublishedCourse.id,
                  },
                });
              }

              return student;
            },
          }),
        ]
      : []),
    ...(resendApiKey
      ? [
          Resend({
            apiKey: resendApiKey,
            from: process.env.AUTH_EMAIL_FROM ?? "Perseus Platform <onboarding@example.com>",
          }),
        ]
      : []),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }

      if (user?.email) {
        token.email = user.email;
        token.isAdmin = isAdminEmail(user.email);
      } else if (typeof token.email === "string") {
        token.isAdmin = isAdminEmail(token.email);
      }

      return token;
    },
    async session({ session, token, user }) {
      if (session.user) {
        session.user.id = String(user?.id ?? token.id ?? "");
        session.user.email = typeof token.email === "string" ? token.email : session.user.email;
        session.user.isAdmin = Boolean(token.isAdmin);
      }

      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  trustHost: true,
});
