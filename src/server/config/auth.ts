import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import _Google from "@auth/express/providers/google";
import _GitHub from "@auth/express/providers/github";
import _Credentials from "@auth/express/providers/credentials";
import _Nodemailer from "@auth/express/providers/nodemailer";

const Google = (_Google as any).default ?? _Google;
const GitHub = (_GitHub as any).default ?? _GitHub;
const Credentials = (_Credentials as any).default ?? _Credentials;
const Nodemailer = (_Nodemailer as any).default ?? _Nodemailer;
import { logger } from "../logger";

const prisma = new PrismaClient();

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "mock-google-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-google-client-secret",
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || "mock-github-client-id",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "mock-github-client-secret",
    }),
    Nodemailer({
      server: process.env.EMAIL_SERVER || "smtp://localhost:25",
      from: process.env.EMAIL_FROM || "no-reply@uacas.edu",
      async sendVerificationRequest({ identifier: email, url }) {
        // Log to console so it is visible in terminal logs for local development & on-premise deployments
        console.log(`\n========================================\nMAGIC LINK SIGN-IN FOR ${email}:\n${url}\n========================================\n`);
        logger.info(`Magic link requested for ${email}. Sign-in URL: ${url}`);
      }
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        
        const ip = req.headers?.get('x-forwarded-for') || req.headers?.get('x-real-ip') || 'unknown';
        const emailStr = String(credentials.email);

        const user = await prisma.user.findUnique({
          where: { email: emailStr }
        });
        if (!user || !user.password) {
          await prisma.loginAttempt.create({ data: { email: emailStr, ipAddress: ip, success: false } });
          return null;
        }
        const isValid = await bcrypt.compare(String(credentials.password), user.password);
        if (!isValid) {
          await prisma.loginAttempt.create({ data: { email: emailStr, ipAddress: ip, success: false } });
          return null;
        }
        await prisma.loginAttempt.create({ data: { email: emailStr, ipAddress: ip, success: true } });
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          universityId: user.universityId,
          departmentId: user.departmentId,
        };
      }
    })
  ],
  session: {
    strategy: "jwt" as const,
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role || "REVIEWER";
        token.universityId = user.universityId || "univ-demo-001";
        token.departmentId = user.departmentId;
      } else if (token.email && !token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email }
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.universityId = dbUser.universityId;
          token.departmentId = dbUser.departmentId;
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.universityId = token.universityId;
        session.user.departmentId = token.departmentId;
      }
      return session;
    }
  },
  secret: (() => {
    const secret = process.env.AUTH_SECRET;
    if (process.env.NODE_ENV === "production") {
      if (!secret) {
        throw new Error("AUTH_SECRET environment variable must be set in production");
      }
      if (secret.length < 32) {
        throw new Error("AUTH_SECRET must be at least 32 characters long for security");
      }
      return secret;
    }
    return secret || "uacas-enterprise-dev-only-secret-key-do-not-use-in-prod";
  })(),
};
