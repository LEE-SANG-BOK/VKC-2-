'use client';

import { useSession } from 'next-auth/react';
import { AlertTriangle, Ban } from 'lucide-react';
import dayjs from 'dayjs';

interface AccountStatusBannerProps {
  translations: Record<string, unknown>;
}

export default function AccountStatusBanner({ translations }: AccountStatusBannerProps) {
  const { data: session } = useSession();
  const t = (translations?.accountStatusBanner || {}) as Record<string, string>;
  const bannedLabel = t.banned || '';
  const suspendedLabel = t.suspended || '';
  const suspendedUntilTemplate = t.suspendedUntil || '';

  if (!session?.user) return null;

  const { status, suspendedUntil } = session.user;

  if (status === 'banned') {
    return (
      <div className="bg-red-600 text-white px-4 py-3">
        <div className="container mx-auto flex items-center gap-3">
          <Ban className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{bannedLabel}</p>
        </div>
      </div>
    );
  }

  if (status === 'suspended') {
    const suspendDate = suspendedUntil ? new Date(suspendedUntil) : null;
    const now = new Date();

    if (!suspendDate || now < suspendDate) {
      const until = suspendDate ? dayjs(suspendDate).format('YYYY.MM.DD HH:mm') : '';
      const message =
        suspendedUntilTemplate && until
          ? suspendedUntilTemplate.replace('{until}', until)
          : suspendedLabel;

      return (
        <div className="bg-orange-500 text-white px-4 py-3">
          <div className="container mx-auto flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">{message}</p>
          </div>
        </div>
      );
    }
  }

  return null;
}
