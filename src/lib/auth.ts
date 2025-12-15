import NextAuth from 'next-auth';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { authConfig } from './auth.config';
import { getDb } from './db';
import { users, accounts, sessions, verificationTokens } from './db/schema';

type NextAuthInstance = ReturnType<typeof NextAuth>;

let cached: NextAuthInstance | undefined;

function initAuth() {
  if (cached) return cached;

  const instance = NextAuth({
    ...authConfig,
    adapter: DrizzleAdapter(getDb(), {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
  });

  cached = instance;
  return instance;
}

export const GET = ((...args: Parameters<NextAuthInstance['handlers']['GET']>) =>
  initAuth().handlers.GET(...args)) as NextAuthInstance['handlers']['GET'];

export const POST = ((...args: Parameters<NextAuthInstance['handlers']['POST']>) =>
  initAuth().handlers.POST(...args)) as NextAuthInstance['handlers']['POST'];

export const auth = ((...args: unknown[]) =>
  (initAuth().auth as (...args: unknown[]) => unknown)(...args)) as NextAuthInstance['auth'];

export const signIn = ((...args: unknown[]) =>
  (initAuth().signIn as (...args: unknown[]) => unknown)(...args)) as NextAuthInstance['signIn'];

export const signOut = ((...args: unknown[]) =>
  (initAuth().signOut as (...args: unknown[]) => unknown)(...args)) as NextAuthInstance['signOut'];
