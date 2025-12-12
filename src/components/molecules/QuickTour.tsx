'use client';

import { useId } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

export interface TourStep {
    id: string;
    title: string;
    description: string;
    targetSelector: string;
    position: 'top' | 'bottom' | 'left' | 'right' | 'top-left';
    icon: string;
    actionUrl?: string;
}

interface QuickTourProps {
    steps: TourStep[];
    isOpen: boolean;
    onComplete: () => void;
    onSkip: () => void;
}

export default function QuickTour({ steps, isOpen, onComplete, onSkip }: QuickTourProps) {
    const titleId = useId();
    const descriptionId = useId();
    const router = useRouter();

    if (!isOpen) return null;

    const handleCardAction = (step: TourStep) => {
        if (step.actionUrl) {
            onComplete();
            router.push(step.actionUrl);
            return;
        }

        const targetElement = document.querySelector(step.targetSelector) as HTMLElement | null;
        if (targetElement) {
            onComplete();
            targetElement.click();
        } else {
            onComplete();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div
                className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                aria-describedby={descriptionId}
            >
                <button
                    onClick={onSkip}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    aria-label="닫기"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="p-8">
                    <header className="mb-8 text-center">
                        <h2 id={titleId} className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            빠르게 둘러보기
                        </h2>
                        <p id={descriptionId} className="text-gray-600 dark:text-gray-400">
                            첫 방문을 축하드립니다! 아래 기능으로 Viet K-Connect를 빠르게 알아보세요.
                        </p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        {steps.map((step) => (
                            <article
                                key={step.id}
                                className="flex flex-col p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-700 transition-colors"
                            >
                                <div className="text-3xl mb-4" aria-hidden="true">
                                    {step.icon}
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                    {step.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">
                                    {step.description}
                                </p>
                                <button
                                    type="button"
                                    className="w-full py-2 px-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
                                    onClick={() => handleCardAction(step)}
                                >
                                    바로가기
                                </button>
                            </article>
                        ))}
                    </div>

                    <div className="flex justify-center gap-4">
                        <button
                            type="button"
                            className="px-6 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            onClick={onSkip}
                        >
                            다음에 보기
                        </button>
                        <button
                            type="button"
                            className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
                            onClick={onComplete}
                        >
                            둘러보기 완료
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
