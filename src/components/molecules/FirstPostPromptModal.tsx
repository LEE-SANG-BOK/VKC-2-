'use client';

import Modal from '@/components/atoms/Modal';
import { Bell } from 'lucide-react';

interface FirstPostPromptModalProps {
    isOpen: boolean;
    userEmail?: string | null;
    onSetup: () => void;
    onLater: () => void;
}

export default function FirstPostPromptModal({
    isOpen,
    userEmail,
    onSetup,
    onLater
}: FirstPostPromptModalProps) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onLater}
            maxWidth="max-w-lg"
            title="" // Custom header in content
        >
            <div className="p-6">
                <div className="text-center mb-6">
                    <div className="text-4xl mb-3">🎉</div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        첫 게시글 등록을 축하드려요!
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                        커뮤니티에서 받은 댓글과 활동 소식을 빠르게 확인하려면 알림을 켜두는 것이 좋아요.<br />
                        이메일 주소를 확인하고 알림을 허용해 주세요.
                    </p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-xl p-5 mb-6 border border-blue-100 dark:border-blue-800">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="bg-blue-600 rounded-full p-2 text-white shadow-md">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-bold text-gray-900 dark:text-white text-base mb-1">알림이 필요한 이유</div>
                            <div className="text-gray-600 dark:text-gray-300 text-sm">
                                댓글과 좋아요, 신규 질문 알림을 놓치지 않고 받아볼 수 있어요.
                            </div>
                        </div>
                    </div>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 pl-11 list-disc">
                        <li>내 게시글에 달린 댓글과 좋아요 안내</li>
                        <li>관심 주제의 새로운 질문 소식</li>
                        <li>중요한 커뮤니티 알림 및 이벤트 정보</li>
                    </ul>
                </div>

                <div className="flex flex-col gap-1 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        등록된 이메일
                    </span>
                    <span className="text-base font-semibold text-gray-900 dark:text-white">
                        {userEmail && userEmail.trim().length > 0 ? userEmail : '이메일 정보가 없습니다'}
                    </span>
                    <span className="text-xs text-gray-500">
                        이메일이 없다면 설정에서 추가 입력 후 알림을 허용해주세요.
                    </span>
                </div>

                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onLater}
                        className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                    >
                        나중에 할게요
                    </button>
                    <button
                        type="button"
                        onClick={onSetup}
                        className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-md transition-colors"
                    >
                        알림 설정하러 가기
                    </button>
                </div>
            </div>
        </Modal>
    );
}
