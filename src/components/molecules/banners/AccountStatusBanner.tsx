'use client';

import { useSession } from 'next-auth/react';
import { AlertTriangle, Ban } from 'lucide-react';
import dayjs from 'dayjs';

export default function AccountStatusBanner() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  const { status, suspendedUntil } = session.user;

  if (status === 'banned') {
    return (
      <div className="bg-red-600 text-white px-4 py-3">
        <div className="container mx-auto flex items-center gap-3">
          <Ban className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            Your account has been permanently banned. You cannot post or comment.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'suspended' && suspendedUntil) {
    const suspendDate = new Date(suspendedUntil);
    const now = new Date();
    
    if (now < suspendDate) {
      return (
        <div className="bg-orange-500 text-white px-4 py-3">
          <div className="container mx-auto flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              Your account is suspended until {dayjs(suspendDate).format('YYYY.MM.DD HH:mm')}. You cannot post or comment during this period.
            </p>
          </div>
        </div>
      );
    }
  }

  return null;
}
