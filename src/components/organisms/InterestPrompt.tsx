'use client';

import { useRouter } from 'nextjs-toploader/app';
import { useParams } from 'next/navigation';

export default function InterestPrompt() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.lang as string) || 'ko';

  const goPreferences = () => {
    router.push('/preferences');
  };

  const goVisaSetup = () => {
    router.push('/preferences?tab=visa');
  };

  const title =
    locale === 'vi'
      ? 'Chọn chủ đề quan tâm và trạng thái visa'
      : locale === 'en'
        ? 'Pick your interests and visa stage'
        : '관심 토픽과 비자 단계를 선택하세요';
  const subtitle =
    locale === 'vi'
      ? 'Chúng tôi sẽ hiển thị nguồn tin theo chủ đề bạn chọn.'
      : locale === 'en'
        ? 'We will tailor your feed to the topics you pick.'
        : '선택한 주제에 맞춰 맞춤 피드를 보여줄 준비가 되어 있습니다.';
  const manageInterests =
    locale === 'vi' ? 'Quản lý chủ đề' : locale === 'en' ? 'Manage interests' : '관심 토픽 관리';
  const setupVisa =
    locale === 'vi' ? 'Thiết lập giai đoạn visa' : locale === 'en' ? 'Set visa stage' : '비자 단계 설정';

  return (
    <section className="rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white dark:bg-gray-900 shadow-sm">
      <div className="px-4 py-4 md:px-5 md:py-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">Personalize</p>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={goPreferences}
            className="rounded-full bg-blue-600 text-white text-sm font-semibold px-4 py-2 hover:bg-blue-700 transition"
          >
            {manageInterests}
          </button>
          <button
            type="button"
            onClick={goVisaSetup}
            className="rounded-full border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-200 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            {setupVisa}
          </button>
        </div>
      </div>
    </section>
  );
}
