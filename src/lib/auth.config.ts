import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import { db } from './db';
import { userAuthColumns } from './db/columns';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

export const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: '/ko/login',
    error: '/ko/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return true;
      }
      return true;
    },
    async jwt({ token, user, account, trigger }) {
      // 최초 로그인 시 또는 update 호출 시 DB에서 최신 정보 조회
      if (user || trigger === 'update') {
        const userId = user?.id || token.sub;

        if (userId) {
          const dbUser = await db.query.users.findFirst({
            where: eq(users.id, userId),
            columns: userAuthColumns,
          });

          if (dbUser) {
            token.sub = dbUser.id;
            token.email = dbUser.email;
            token.name = dbUser.displayName || dbUser.name;
            token.picture = dbUser.image;
            token.phone = dbUser.phone;
            token.bio = dbUser.bio;
            token.gender = dbUser.gender;
            token.ageGroup = dbUser.ageGroup;
            token.nationality = dbUser.nationality;
            token.status = dbUser.status;
            token.suspendedUntil = dbUser.suspendedUntil;
            token.isVerified = dbUser.isVerified;
            token.isProfileComplete = dbUser.isProfileComplete;
            token.verifiedRequestId = dbUser.verifiedRequestId;
            token.verifiedAt = dbUser.verifiedAt;
            token.isExpert = dbUser.isExpert;
            token.lastLoginUpdate = Date.now();
          }
        }
      }

      // 마지막 업데이트로부터 5분이 지났으면 lastLoginAt 갱신
      const lastUpdate = token.lastLoginUpdate as number || 0;
      const fiveMinutes = 5 * 60 * 1000;
      if (token.sub && Date.now() - lastUpdate > fiveMinutes) {
        await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, token.sub));
        token.lastLoginUpdate = Date.now();
      }

      if (account) {
        token.provider = account.provider;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
        session.user.phone = token.phone as string;
        session.user.bio = token.bio as string;
        session.user.gender = token.gender as string;
        session.user.ageGroup = token.ageGroup as string;
        session.user.nationality = token.nationality as string;
        session.user.status = token.status as string;
        session.user.suspendedUntil = token.suspendedUntil as Date;
        session.user.isVerified = token.isVerified as boolean;
        session.user.isExpert = token.isExpert as boolean;
        session.user.isProfileComplete = token.isProfileComplete as boolean;
        session.user.verifiedRequestId = token.verifiedRequestId as string;
        session.user.verifiedAt = token.verifiedAt as Date;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
  },
  basePath: '/api/auth',

} satisfies NextAuthConfig;
