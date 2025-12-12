'use client';

import { useState, useMemo } from 'react';
import Modal from '@/components/atoms/Modal';
import { useCategories } from '@/repo/categories/query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleCategorySubscription } from '@/repo/categories/fetch';
import { queryKeys } from '@/repo/keys';
import { Check } from 'lucide-react';
import { CATEGORY_GROUPS, LEGACY_CATEGORIES, type LegacyCategory, getCategoryName } from '@/lib/constants/categories';
import { useParams } from 'next/navigation';

interface CategorySubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: (selectedIds: string[]) => void;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    majorId?: string;
    order?: number;
}

export default function CategorySubscriptionModal({ isOpen, onClose, onConfirm }: CategorySubscriptionModalProps) {
    const params = useParams();
    const locale = (params?.lang as string) || 'ko';
    const { data: categories } = useCategories();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const queryClient = useQueryClient();
    const toggleMutation = useMutation({
        mutationFn: (id: string) => toggleCategorySubscription(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.categories.subscriptions() });
        }
    });

    const groupedCategories = useMemo(() => {
        const slugToCat = new Map<string, Category | LegacyCategory>();
        (categories || []).forEach((parent: any) => {
            if (parent?.slug) slugToCat.set(parent.slug, parent);
            (parent?.children || []).forEach((child: any) => {
                if (child?.slug) slugToCat.set(child.slug, child);
            });
        });

        const groups: Record<string, Category[]> = {};
        Object.entries(CATEGORY_GROUPS).forEach(([parentSlug, group]) => {
            const items: Category[] = [];
            const parent = slugToCat.get(parentSlug);
            if (parent && 'id' in parent) items.push(parent as Category);
            (group.slugs as readonly string[]).forEach((childSlug) => {
                const child = slugToCat.get(childSlug);
                if (child && 'id' in child) items.push(child as Category);
            });
            if (items.length > 0) {
                groups[parentSlug] = items;
            }
        });

        return groups;
    }, [categories]);

    const toggleCategory = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id)
                ? prev.filter(p => p !== id)
                : [...prev, id]
        );
    };

    const handleConfirm = () => {
        if (onConfirm) {
            onConfirm(selectedIds);
        }
        // API 호출로 구독 저장
        selectedIds.forEach((id) => toggleMutation.mutate(id));
        onClose();
    };

    const mapCategoryName = (cat: any) => {
        const legacy = LEGACY_CATEGORIES.find((c) => c.id === cat.id || c.slug === cat.slug);
        if (legacy) return getCategoryName(legacy, locale);
        if (locale === 'vi' && cat.name_vi) return cat.name_vi;
        if (locale === 'en' && cat.name_en) return cat.name_en;
        return cat.name;
    };

    const titleLabel = locale === 'vi' ? 'Chọn danh mục quan tâm' : locale === 'en' ? 'Choose categories' : '관심 주제 선택';
    const descLabel =
        locale === 'vi'
            ? 'Chọn danh mục để nhận bài viết liên quan trong nguồn tin.'
            : locale === 'en'
                ? 'Pick categories to personalize your feed.'
                : '관심 있는 주제를 선택하면 홈 피드에서 맞춤형 콘텐츠를 받아볼 수 있습니다.';
    const resetLabel = locale === 'vi' ? 'Bỏ chọn' : locale === 'en' ? 'Reset' : '선택 해제';
    const cancelLabel = locale === 'vi' ? 'Hủy' : locale === 'en' ? 'Cancel' : '취소';
    const confirmLabel = (count: number) => {
        if (locale === 'vi') return `Đăng ký ${count} danh mục`;
        if (locale === 'en') return `Follow ${count} categories`;
        return `${count}개 주제 구독하기`;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-3xl"
            title={titleLabel}
        >
            <div className="p-6">
                <div className="mb-6">
                    <p className="text-gray-600 dark:text-gray-300">
                        {descLabel}
                    </p>
                </div>

                <div className="space-y-8 mb-8 max-h-[60vh] overflow-y-auto pr-2">
                    {Object.entries(groupedCategories).map(([parentSlug, cats]) => {
                        const legacyParent = LEGACY_CATEGORIES.find((c) => c.slug === parentSlug);
                        const groupTitle = legacyParent ? getCategoryName(legacyParent, locale) : parentSlug;
                        return (
                        <div key={parentSlug}>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                                {groupTitle}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {cats.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => toggleCategory(cat.id)}
                                        className={`
                      relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
                      ${selectedIds.includes(cat.id)
                                                ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300 shadow-sm'
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }
                    `}
                                    >
                                        <div className="flex items-center gap-1.5">
                                            {selectedIds.includes(cat.id) && <Check className="w-3.5 h-3.5" />}
                                            {mapCategoryName(cat)}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        );
                    })}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => setSelectedIds([])}
                        className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm font-medium"
                    >
                        {resetLabel}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-5 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-md transition-colors"
                    >
                        {confirmLabel(selectedIds.length)}
                    </button>
                </div>
            </div>
        </Modal>
    );
}
