import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    phone?: string | null;
    bio?: string | null;
    gender?: string | null;
    ageGroup?: string | null;
    nationality?: string | null;
    status?: string | null;
    suspendedUntil?: Date | null;
    isVerified?: boolean;
    isExpert?: boolean;
    isProfileComplete?: boolean;
    verifiedRequestId?: string | null;
    verifiedAt?: Date | null;
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    phone?: string | null;
    bio?: string | null;
    gender?: string | null;
    ageGroup?: string | null;
    nationality?: string | null;
    status?: string | null;
    suspendedUntil?: Date | null;
    isVerified?: boolean;
    isExpert?: boolean;
    isProfileComplete?: boolean;
    verifiedRequestId?: string | null;
    verifiedAt?: Date | null;
  }
}
