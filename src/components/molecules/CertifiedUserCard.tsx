'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'nextjs-toploader/app';
import TrustBadge from '../atoms/TrustBadge';
import { MessageSquare } from 'lucide-react';

interface CertifiedUserCardProps {
    user: {
        id: string;
        name: string;
        avatar: string;
        title?: string; // e.g., "Visa Specialist"
        bio?: string;
        stats?: {
            answers: number;
            rating: number;
        };
    };
    category?: string; // e.g., "Visa"
}

export default function CertifiedUserCard({ user, category = 'Expert' }: CertifiedUserCardProps) {
    const router = useRouter();

    return (
        <div
            className="group relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 p-5 transition-all hover:shadow-lg hover:shadow-amber-500/10 cursor-pointer"
            onClick={() => router.push(`/profile/${user.id}`)}
        >
            {/* Decorative Background Element */}
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-200/20 blur-2xl transition-all group-hover:bg-amber-300/30" />

            <div className="relative flex items-start gap-4">
                {/* Avatar */}
                <div className="relative h-16 w-16 flex-shrink-0">
                    <div className="absolute inset-0 rounded-full bg-amber-200 blur-sm" />
                    <Image
                        src={user.avatar || '/default-avatar.jpg'}
                        alt={user.name}
                        fill
                        className="relative rounded-full border-2 border-white object-cover shadow-sm dark:border-amber-900"
                    />
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5 dark:bg-gray-900">
                        <TrustBadge level="expert" showLabel={false} className="border-none !p-1" />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                                {user.name}
                            </h3>
                            <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                {user.title || `${category} Specialist`}
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3">
                        {user.bio || `Certified expert in ${category} related questions.`}
                    </p>

                    {/* Stats & Action */}
                    <div className="flex items-center justify-between pt-3 border-t border-amber-200/50 dark:border-amber-700/30">
                        <div className="flex gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span>
                                <span className="font-semibold text-gray-900 dark:text-gray-200">{user.stats?.answers || 0}</span> Answers
                            </span>
                            <span>
                                <span className="font-semibold text-gray-900 dark:text-gray-200">{(user.stats?.rating || 5.0).toFixed(1)}</span> Rating
                            </span>
                        </div>

                        <button
                            className="flex items-center gap-1.5 rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-200 transition-colors dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60"
                            onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Navigate to direct message or ask question
                                router.push(`/profile/${user.id}`);
                            }}
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            Consult
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
