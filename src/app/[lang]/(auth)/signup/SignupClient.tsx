'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'nextjs-toploader/app';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { DISPLAY_NAME_MAX_LENGTH, DISPLAY_NAME_MIN_LENGTH, generateDisplayNameFromEmail, normalizeDisplayName } from '@/lib/utils/profile';
import type { Locale } from '@/i18n/config';

interface SignupClientProps {
  lang: Locale;
  translations: Record<string, unknown>;
}

export default function SignupClient({ lang, translations }: SignupClientProps) {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const t = (translations?.signup || {}) as Record<string, string>;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nickname: session?.user?.name || '',
    nationality: '국내',
    gender: '',
    ageGroup: '',
    userType: '',
  });

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.push(`/${lang}/login`);
      return;
    }

    if (session.user.isProfileComplete) {
      router.push(`/${lang}`);
    }
  }, [lang, router, session, status]);

  useEffect(() => {
    if (!session?.user?.name && session?.user?.email) {
      const displayName = generateDisplayNameFromEmail(session.user.email);
      setFormData((prev) => ({ ...prev, nickname: displayName }));
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session?.user) {
      toast.error(t.missingSessionError || '');
      return;
    }

    if (!formData.gender || !formData.ageGroup || !formData.userType) {
      toast.error(t.requiredFieldsError || '');
      return;
    }

    const sanitizedNickname = normalizeDisplayName(formData.nickname);
    const nickname =
      sanitizedNickname.length >= DISPLAY_NAME_MIN_LENGTH
        ? sanitizedNickname
        : (session.user.email ? generateDisplayNameFromEmail(session.user.email) : sanitizedNickname);

    setIsSubmitting(true);

    try {
      const nationalityLabel = formData.nationality === '해외' ? t.nationalityOverseas || '' : t.nationalityDomestic || '';

      const response = await fetch(`/api/users/${session.user.id}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          displayName: nickname,
          nationality: nationalityLabel,
          gender: formData.gender,
          ageGroup: formData.ageGroup,
          userType: formData.userType,
        }),
      });

      if (response.ok) {
        await update({ isProfileComplete: true });
        window.location.href = `/${lang}`;
      } else {
        toast.error(t.submitFailedError || '');
      }
    } catch (error) {
      console.error('Error updating user info:', error);
      toast.error(t.submitUnknownError || '');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nicknameHint = (t.nicknameHint || '')
    .replace('{min}', String(DISPLAY_NAME_MIN_LENGTH))
    .replace('{max}', String(DISPLAY_NAME_MAX_LENGTH));

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center shadow-md">
              <span className="text-yellow-300 font-bold text-lg">★</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {t.title}
            </h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {t.welcome}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.nicknameLabel}
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                maxLength={DISPLAY_NAME_MAX_LENGTH}
                placeholder={t.nicknamePlaceholder}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {nicknameHint}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.nationalityLabel}
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="nationality"
                    value="국내"
                    checked={formData.nationality === '국내'}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{t.nationalityDomestic}</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="nationality"
                    value="해외"
                    checked={formData.nationality === '해외'}
                    onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                    className="w-4 h-4 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">{t.nationalityOverseas}</span>
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.genderLabel}
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">{t.selectPlaceholder}</option>
                <option value="male">{t.genderMale}</option>
                <option value="female">{t.genderFemale}</option>
                <option value="other">{t.genderOther}</option>
              </select>
            </div>

            <div>
              <label htmlFor="ageGroup" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.ageGroupLabel}
              </label>
              <select
                id="ageGroup"
                name="ageGroup"
                value={formData.ageGroup}
                onChange={(e) => setFormData({ ...formData, ageGroup: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">{t.selectPlaceholder}</option>
                <option value="10s">{t.age10s}</option>
                <option value="20s">{t.age20s}</option>
                <option value="30s">{t.age30s}</option>
                <option value="40s">{t.age40s}</option>
                <option value="50s">{t.age50s}</option>
                <option value="60plus">{t.age60plus}</option>
              </select>
            </div>

            <div>
              <label htmlFor="userType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.userTypeLabel}
              </label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={(e) => setFormData({ ...formData, userType: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">{t.selectPlaceholder}</option>
                <option value="student">{t.userTypeStudent}</option>
                <option value="worker">{t.userTypeWorker}</option>
                <option value="resident">{t.userTypeResident}</option>
              </select>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? t.processingLabel : t.submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
