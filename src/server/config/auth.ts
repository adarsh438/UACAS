import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import Google from "@auth/express/providers/google";
import GitHub from "@auth/express/providers/github";
import Credentials from "@auth/express/providers/credentials";
import Nodemailer from "@auth/express/providers/nodemailer";
import { logger } from "../logger";

const prisma = new PrismaClient();

export const authConfig = {
  adapter: PrismaAdapter(prisma),
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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const user = await prisma.user.findUnique({
          where: { email: String(credentials.email) }
        });
        if (!user || !user.password) {
          return null;
        }
        const isValid = await bcrypt.compare(String(credentials.password), user.password);
        if (!isValid) {
          return null;
        }
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
  secret: process.env.AUTH_SECRET || "uacas-enterprise-super-secret-auth-key-1234567890",
};
