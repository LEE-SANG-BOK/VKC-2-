'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const HERO_TIP_MESSAGES = {
    ko: [
        '관심 토픽을 구독하면 맞춤형 질문과 정보 글이 우선 노출돼요.',
        '추천 멤버를 팔로우하면 새 질문과 답변을 실시간으로 받아볼 수 있어요.',
        'Certified User가 공유한 체류·행정 노하우를 큐레이션으로 확인해보세요.',
        '궁금한 점을 남기면 한국 생활 선배들이 직접 경험을 나눠줍니다.'
    ],
    vi: [
        'Theo dõi chủ đề để ưu tiên xem hỏi đáp phù hợp với bạn.',
        'Follow thành viên gợi ý để nhận câu hỏi/câu trả lời mới tức thời.',
        'Xem kinh nghiệm lưu trú/hành chính do Certified User chia sẻ.',
        'Đặt câu hỏi, tiền bối đời sống tại Hàn sẽ chia sẻ kinh nghiệm thực tế.'
    ],
    en: [
        'Follow topics to surface questions and info tailored to you.',
        'Follow recommended members to get new Q&A in real time.',
        'See curated stay/admin know-how from Certified Users.',
        'Ask anything—Korea life seniors will share real experience.'
    ]
};

export default function CompactHero() {
    const router = useRouter();
    const { data: session } = useSession();
    const params = useParams();
    const locale = ((params?.lang as string) || 'ko') as keyof typeof HERO_TIP_MESSAGES;
    const isLoggedIn = !!session?.user;
    const [activeHeroTip, setActiveHeroTip] = useState(HERO_TIP_MESSAGES[locale]?.[0] || HERO_TIP_MESSAGES.ko[0]);

    useEffect(() => {
        const tips = HERO_TIP_MESSAGES[locale] || HERO_TIP_MESSAGES.ko;
        if (tips.length < 2) return;
        const randomIndex = Math.floor(Math.random() * tips.length);
        setActiveHeroTip(tips[randomIndex]);
    }, [locale]);

    const handleAction = (action: 'question' | 'post' | 'certification') => {
        if (!isLoggedIn) {
            router.push('/login');
            return;
        }

        switch (action) {
            case 'question':
                router.push('/posts/new?type=question');
                break;
            case 'post':
                router.push('/posts/new?type=share');
                break;
            case 'certification':
                router.push('/verification/request');
                break;
        }
    };

    return (
        <div className={`desktop-hero-compact${!isLoggedIn ? ' hero-compact--guest' : ''}`}>
            <div className="hero-compact-body">
                <div className="hero-compact-text">
                    <div className="hero-compact-title-row">
                        <h2 className="hero-compact-title">
                            {locale === 'vi'
                                ? 'Trao đổi kinh nghiệm sống tại Hàn trong cộng đồng Q&A'
                                : locale === 'en'
                                    ? 'Share Korea life know-how in our Vietnam Q&A community'
                                    : '베트남 Q&A 커뮤니티에서 한국 생활 정보를 교류하세요.'}
                        </h2>
                        <span
                            className="hero-compact-tip vk-tooltip-container"
                            aria-label={activeHeroTip}
                            aria-describedby="hero-tip-tooltip"
                        >
                            💡
                            <span
                                id="hero-tip-tooltip"
                                className="vk-tooltip"
                                role="tooltip"
                                data-position="bottom-right"
                            >
                                {activeHeroTip}
                            </span>
                        </span>
                    </div>
                    <p className="hero-compact-sub">
                        {locale === 'vi'
                            ? 'Chia sẻ kinh nghiệm hành chính, việc làm, giáo dục để thích nghi nhanh hơn. Theo dõi chủ đề và người dùng gợi ý để nhận nguồn tin phù hợp.'
                            : locale === 'en'
                                ? 'Share admin, jobs, and school experience to adapt faster. Follow topics and recommended users for a tailored feed.'
                                : '국내 생활 행정·취업·교육 경험을 같은 베트남 커뮤니티와 나누며 한국 생활을 빠르게 익혀보세요. 관심 토픽과 추천 사용자를 팔로우하면 맞춤형 피드를 즐길 수 있습니다.'}
                    </p>
                </div>
                <div className={`hero-compact-actions${!isLoggedIn ? ' hero-compact-actions--guest' : ''}`}>
                    <button
                        type="button"
                        className="hero-compact-action hero-compact-action--primary vk-tooltip-container"
                        onClick={() => handleAction('question')}
                        data-tour="ask-question"
                        aria-label="생활·행정·주거 등 궁금한 점을 Certified 상담자에게 바로 질문하세요."
                        aria-describedby="hero-question-tooltip"
                    >
                        {isLoggedIn
                            ? (locale === 'vi' ? 'Đặt câu hỏi' : locale === 'en' ? 'Ask a question' : '질문 남기기')
                            : (locale === 'vi' ? 'Đăng nhập để hỏi' : locale === 'en' ? 'Log in to ask' : '로그인하고 질문하기')}
                        <span id="hero-question-tooltip" className="vk-tooltip" role="tooltip">
                            {locale === 'vi'
                                ? 'Hỏi trực tiếp về đời sống, hành chính, nhà ở… đến cố vấn đã chứng nhận.'
                                : locale === 'en'
                                    ? 'Ask Certified mentors about life/admin/housing right away.'
                                    : '생활·행정·주거 등 궁금한 점을 Certified 상담자에게 바로 질문하세요.'}
                        </span>
                    </button>
                    <button
                        type="button"
                        className="hero-compact-action hero-compact-action--outline vk-tooltip-container"
                        onClick={() => handleAction('post')}
                        data-tour="write-post"
                        aria-label="체류 자격 변경 후기나 취업 준비 노하우 등 실전 경험을 커뮤니티와 공유하세요."
                        aria-describedby="hero-post-tooltip"
                    >
                        {isLoggedIn
                            ? (locale === 'vi' ? 'Chia sẻ kinh nghiệm' : locale === 'en' ? 'Share experience' : '경험 공유하기')
                            : (locale === 'vi' ? 'Đăng nhập để chia sẻ' : locale === 'en' ? 'Log in to share' : '로그인하고 공유하기')}
                        <span id="hero-post-tooltip" className="vk-tooltip" role="tooltip">
                            {locale === 'vi'
                                ? 'Chia sẻ kinh nghiệm đổi tư cách lưu trú, chuẩn bị việc làm…'
                                : locale === 'en'
                                    ? 'Share your stay-change story or job prep know-how.'
                                    : '체류 자격 변경 후기나 취업 준비 노하우 등 실전 경험을 커뮤니티와 공유하세요.'}
                        </span>
                    </button>
                    <button
                        type="button"
                        className="hero-compact-action hero-compact-action--outline vk-tooltip-container"
                        onClick={() => handleAction('certification')}
                        data-tour="certified-apply"
                        aria-label="Certified 상담자로 등록해 신뢰 배지를 받고, 선배로서 영향력을 높여보세요."
                        aria-describedby="hero-certified-tooltip"
                    >
                        {isLoggedIn
                            ? (locale === 'vi' ? 'Đăng ký Certified User' : locale === 'en' ? 'Apply for Certified User' : 'Certified User 신청하기')
                            : (locale === 'vi' ? 'Đăng nhập để đăng ký Certified' : locale === 'en' ? 'Log in to apply Certified' : '로그인 후 Certified User 신청')}
                        <span id="hero-certified-tooltip" className="vk-tooltip" role="tooltip">
                            {locale === 'vi'
                                ? 'Đăng ký cố vấn Certified để nhận badge tin cậy và tăng uy tín.'
                                : locale === 'en'
                                    ? 'Register as a Certified mentor to earn trust badges and influence.'
                                    : 'Certified 상담자로 등록해 신뢰 배지를 받고, 선배로서 영향력을 높여보세요.'}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}
