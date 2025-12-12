'use client';

import { ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface SubCategory {
  id: string;
  name: string;
}

interface CategoryFilterProps {
  selectedMainCategory: string;
  selectedSubCategory: string;
  onSubCategoryChange: (subCategory: string) => void;
}

// 카테고리별 소분류 정의
const subCategoriesMap: { [key: string]: SubCategory[] } = {
  tech: [
    { id: 'all', name: '전체' },
    { id: 'web', name: '웹 개발' },
    { id: 'mobile', name: '모바일' },
    { id: 'backend', name: '백엔드' },
    { id: 'devops', name: 'DevOps' },
    { id: 'ai', name: 'AI/ML' },
  ],
  business: [
    { id: 'all', name: '전체' },
    { id: 'startup', name: '스타트업' },
    { id: 'marketing', name: '마케팅' },
    { id: 'finance', name: '재무/회계' },
    { id: 'management', name: '경영' },
    { id: 'sales', name: '영업' },
  ],
  lifestyle: [
    { id: 'all', name: '전체' },
    { id: 'health', name: '건강' },
    { id: 'fitness', name: '운동' },
    { id: 'travel', name: '여행' },
    { id: 'hobby', name: '취미' },
    { id: 'fashion', name: '패션' },
  ],
  gaming: [
    { id: 'all', name: '전체' },
    { id: 'pc', name: 'PC 게임' },
    { id: 'mobile-game', name: '모바일 게임' },
    { id: 'console', name: '콘솔' },
    { id: 'esports', name: 'e스포츠' },
    { id: 'indie', name: '인디 게임' },
  ],
  education: [
    { id: 'all', name: '전체' },
    { id: 'language', name: '외국어' },
    { id: 'programming', name: '프로그래밍' },
    { id: 'design', name: '디자인' },
    { id: 'business-edu', name: '비즈니스' },
    { id: 'certification', name: '자격증' },
  ],
  music: [
    { id: 'all', name: '전체' },
    { id: 'classic', name: '클래식' },
    { id: 'pop', name: '팝' },
    { id: 'kpop', name: 'K-POP' },
    { id: 'jazz', name: '재즈' },
    { id: 'instrument', name: '악기' },
  ],
  movie: [
    { id: 'all', name: '전체' },
    { id: 'action', name: '액션' },
    { id: 'drama', name: '드라마' },
    { id: 'comedy', name: '코미디' },
    { id: 'thriller', name: '스릴러' },
    { id: 'documentary', name: '다큐멘터리' },
  ],
  food: [
    { id: 'all', name: '전체' },
    { id: 'korean', name: '한식' },
    { id: 'western', name: '양식' },
    { id: 'japanese', name: '일식' },
    { id: 'chinese', name: '중식' },
    { id: 'dessert', name: '디저트' },
  ],
};

export default function CategoryFilter({ selectedMainCategory, selectedSubCategory, onSubCategoryChange }: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 현재 선택된 대분류에 해당하는 소분류 목록
  const subCategories = subCategoriesMap[selectedMainCategory] || [{ id: 'all', name: '전체' }];

  // 선택된 소분류의 이름 찾기
  const selectedSubCategoryName = subCategories.find(sub => sub.id === selectedSubCategory)?.name || '전체';

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 대분류가 변경되면 소분류를 'all'로 초기화
  useEffect(() => {
    onSubCategoryChange('all');
  }, [selectedMainCategory]);

  const handleSubCategoryClick = (subCategoryId: string) => {
    onSubCategoryChange(subCategoryId);
    setIsOpen(false);
  };

  // 대분류가 특정 카테고리가 아니면 필터를 표시하지 않음
  if (!['tech', 'business', 'lifestyle', 'gaming', 'education', 'music', 'movie', 'food'].includes(selectedMainCategory)) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {selectedSubCategoryName}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-2">
          {subCategories.map((subCategory) => (
            <button
              key={subCategory.id}
              onClick={() => handleSubCategoryClick(subCategory.id)}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                selectedSubCategory === subCategory.id
                  ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {subCategory.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
