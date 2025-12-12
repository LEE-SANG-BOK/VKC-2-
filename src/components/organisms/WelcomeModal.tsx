'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import Modal from '@/components/atoms/Modal';
import { Search, MessageCircle, FileText, Bell, CheckCircle } from 'lucide-react';

export interface TourStep {
    id: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    actionUrl?: string;
    targetSelector?: string;
}

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: (dismissForDays?: number) => void;
}

const STEPS = {
    ko: [
        { id: 'search', title: '궁금한 점 검색하기', description: '상단 검색창에서 비자, 생활 정보 등 궁금한 내용을 검색해보세요. 카테고리별 상세 검색도 가능합니다.', icon: <Search className="w-8 h-8 text-blue-500" />, targetSelector: 'header input' },
        { id: 'ask', title: '질문하기', description: '해결되지 않는 문제가 있다면 직접 질문을 남겨보세요. 커뮤니티 멤버들이 답변해드립니다.', icon: <MessageCircle className="w-8 h-8 text-green-500" />, actionUrl: '/posts/new?type=question' },
        { id: 'category', title: '관심 주제 구독', description: '비자, 취업, 생활 등 관심 있는 주제를 구독하고 맞춤형 정보를 받아보세요.', icon: <Bell className="w-8 h-8 text-amber-500" />, actionUrl: '/settings/topics' },
        { id: 'verification', title: '신뢰할 수 있는 활동', description: '인증된 사용자는 더 신뢰받는 답변을 할 수 있습니다. 프로필 인증에 도전해보세요!', icon: <CheckCircle className="w-8 h-8 text-purple-500" />, actionUrl: '/verification/request' },
    ],
    vi: [
        { id: 'search', title: 'Tìm kiếm câu hỏi', description: 'Dùng ô tìm kiếm để tra cứu visa, cuộc sống, việc làm... Có thể lọc theo danh mục.', icon: <Search className="w-8 h-8 text-blue-500" />, targetSelector: 'header input' },
        { id: 'ask', title: 'Đặt câu hỏi', description: 'Nếu chưa tìm thấy câu trả lời, hãy đăng câu hỏi để cộng đồng hỗ trợ.', icon: <MessageCircle className="w-8 h-8 text-green-500" />, actionUrl: '/posts/new?type=question' },
        { id: 'category', title: 'Theo dõi danh mục', description: 'Theo dõi chủ đề về visa, việc làm, đời sống... để nhận nguồn tin phù hợp.', icon: <Bell className="w-8 h-8 text-amber-500" />, actionUrl: '/settings/topics' },
        { id: 'verification', title: 'Tăng độ tin cậy', description: 'Người dùng xác minh được ưu tiên và đáng tin hơn. Hãy đăng ký xác minh hồ sơ.', icon: <CheckCircle className="w-8 h-8 text-purple-500" />, actionUrl: '/verification/request' },
    ],
    en: [
        { id: 'search', title: 'Search what you need', description: 'Use the top search bar for visa, life, jobs. You can filter by category.', icon: <Search className="w-8 h-8 text-blue-500" />, targetSelector: 'header input' },
        { id: 'ask', title: 'Ask a question', description: 'If you can’t find an answer, post your question and the community will help.', icon: <MessageCircle className="w-8 h-8 text-green-500" />, actionUrl: '/posts/new?type=question' },
        { id: 'category', title: 'Follow categories', description: 'Follow visa, jobs, daily life topics to get a tailored feed.', icon: <Bell className="w-8 h-8 text-amber-500" />, actionUrl: '/settings/topics' },
        { id: 'verification', title: 'Build trust', description: 'Verified users gain more trust. Apply for profile verification.', icon: <CheckCircle className="w-8 h-8 text-purple-500" />, actionUrl: '/verification/request' },
    ],
};

export default function WelcomeModal({ isOpen, onClose }: WelcomeModalProps) {
    const router = useRouter();
    const params = useParams();
    const locale = ((params?.lang as string) || 'ko') as keyof typeof STEPS;
    const [doNotShowFor7Days, setDoNotShowFor7Days] = useState(false);
    const steps = STEPS[locale] || STEPS.ko;
    const title =
        locale === 'vi'
            ? 'Chào mừng đến Viet K-Connect! 🎉'
            : locale === 'en'
                ? 'Welcome to Viet K-Connect! 🎉'
                : 'Viet K-Connect에 오신 것을 환영합니다! 🎉';
    const intro =
        locale === 'vi'
            ? 'Chúc mừng bạn đã ghé thăm! Khám phá nhanh các tính năng chính bên dưới.'
            : locale === 'en'
                ? 'Welcome! Check out the key features below.'
                : '첫 방문을 축하드립니다! 아래 주요 기능으로 커뮤니티를 빠르게 알아보세요.';
    const skipLabel =
        locale === 'vi' ? 'Không hiển thị trong 7 ngày' : locale === 'en' ? 'Hide for 7 days' : '7일간 보지 않기';
    const confirmLabel =
        locale === 'vi' ? 'Xác nhận' : locale === 'en' ? 'Confirm' : '확인';
    const ctaLabel =
        locale === 'vi' ? 'Mở' : locale === 'en' ? 'Open' : '바로가기';

    const handleCardAction = (step: TourStep) => {
        if (step.actionUrl) {
            onClose(doNotShowFor7Days ? 7 : undefined);
            router.push(step.actionUrl);
            return;
        }

        if (step.targetSelector) {
            const element = document.querySelector(step.targetSelector) as HTMLElement;
            if (element) {
                element.focus();
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            onClose(doNotShowFor7Days ? 7 : undefined);
        }
    };

    const handleClose = () => {
        onClose(doNotShowFor7Days ? 7 : undefined);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            maxWidth="max-w-4xl"
            title={title}
        >
            <div className="p-6">
                <div className="text-center mb-8">
                    <p className="text-gray-600 dark:text-gray-300 text-lg">
                        {intro}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {steps.map((step) => (
                        <div
                            key={step.id}
                            className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-200 hover:shadow-md group"
                        >
                            <div className="mb-4 bg-white dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
                                {step.icon}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                {step.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-4 min-h-[3rem]">
                                {step.description}
                            </p>
                            <button
                                onClick={() => handleCardAction(step)}
                                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                            >
                                {ctaLabel} →
                            </button>
                        </div>
                    ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="flex items-center gap-2 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={doNotShowFor7Days}
                            onChange={(e) => setDoNotShowFor7Days(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                            {skipLabel}
                        </span>
                    </label>

                    <button
                        onClick={handleClose}
                        className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
