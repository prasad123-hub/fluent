import NextAuth, { CredentialsSignin, type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

class RateLimited extends CredentialsSignin {
  override code = "rate_limited";
}
class BadCredentials extends CredentialsSignin {
  override code = "bad_credentials";
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

/** Postgres-backed login rate limiter keyed by IP (single user → tiny table, no Redis). */
async function checkRateLimit(key: string): Promise<void> {
  const now = new Date();
  const row = await prisma.loginAttempt.findUnique({ where: { key } });
  if (row && now.getTime() - row.windowStart.getTime() < WINDOW_MS && row.count >= MAX_ATTEMPTS) {
    throw new RateLimited();
  }
}

async function recordAttempt(key: string, success: boolean): Promise<void> {
  const now = new Date();
  if (success) {
    await prisma.loginAttempt.deleteMany({ where: { key } });
    return;
  }
  const row = await prisma.loginAttempt.findUnique({ where: { key } });
  if (!row || now.getTime() - row.windowStart.getTime() >= WINDOW_MS) {
    await prisma.loginAttempt.upsert({
      where: { key },
      update: { count: 1, windowStart: now },
      create: { key, count: 1, windowStart: now },
    });
  } else {
    await prisma.loginAttempt.update({ where: { key }, data: { count: { increment: 1 } } });
  }
}

export const authConfig: NextAuthConfig = {
  secret: env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    Credentials({
      credentials: { email: { label: "Email" }, password: { label: "Password", type: "password" } },
      async authorize(credentials, request) {
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
        await checkRateLimit(ip);
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");
        const ok =
          email === env.OWNER_EMAIL.toLowerCase() &&
          password.length > 0 &&
          bcrypt.compareSync(password, env.OWNER_PASSWORD_HASH);
        await recordAttempt(ip, ok);
        if (!ok) {
          logger.warn({ ip }, "failed login attempt");
          throw new BadCredentials();
        }
        const user = await prisma.user.upsert({
          where: { email: env.OWNER_EMAIL },
          update: {},
          create: { email: env.OWNER_EMAIL, name: env.OWNER_NAME },
        });
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isPublic =
        pathname === "/" ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/livekit/webhook") ||
        pathname.startsWith("/opengraph-image") ||
        pathname.startsWith("/icon") ||
        pathname.startsWith("/design");
      if (isPublic) return true;
      if (auth?.user) return true;
      if (pathname.startsWith("/api/"))
        return Response.json({ error: "unauthorized" }, { status: 401 });
      return false; // → redirect to /login
    },
    jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.uid) session.user.id = token.uid as string;
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
