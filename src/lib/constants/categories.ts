import type { LucideIcon } from 'lucide-react';
import {
    Briefcase,
    Home,
    BookOpen,
    Globe,
    CreditCard,
    Stethoscope,
    Scale,
    Utensils,
    Plane,
    Building2,
    GraduationCap,
    Package,
    Users,
    HeartHandshake
} from 'lucide-react';
import { CATEGORY_GROUP_SLUGS } from '@/lib/constants/category-groups';

export interface LegacyCategory {
    id: string;
    name: string;
    name_en?: string;
    name_vi?: string;
    slug: string;
    majorId?: string;
    icon: LucideIcon;
    description: string;
    color: string;
    order?: number;
}

export const LEGACY_CATEGORIES: LegacyCategory[] = [
    {
        id: 'visa',
        name: '한국 비자·체류',
        name_en: 'Visa & Stay',
        name_vi: 'Visa & Lưu trú',
        slug: 'visa',
        icon: Globe,
        description: '비자 신청·연장, 체류 자격 변경',
        color: '#3b82f6',
        order: 1
    },
    {
        id: 'students',
        name: '한국 유학·학생',
        name_en: 'Study & Students in Korea',
        name_vi: 'Du học & Sinh viên tại Hàn Quốc',
        slug: 'students',
        icon: GraduationCap,
        description: '입학·장학금, 대학/전공 선택, 한국어·TOPIK',
        color: '#3b82f6',
        order: 1
    },
    {
        id: 'career',
        name: '한국 취업·경력',
        name_en: 'Jobs & Career in Korea',
        name_vi: 'Việc làm & Sự nghiệp tại Hàn Quốc',
        slug: 'career',
        icon: Briefcase,
        description: '아르바이트, 임금·근로조건, 노동법',
        color: '#8b5cf6',
        order: 1
    },
    {
        id: 'living',
        name: '한국 생활정보',
        name_en: 'Living in Korea',
        name_vi: 'Đời sống tại Hàn Quốc',
        slug: 'living',
        icon: Home,
        description: '주거, 생활비·정착, 의료·보험',
        color: '#f59e0b',
        order: 1
    },
    {
        id: 'visa-process',
        name: '한국 비자 신청·연장',
        name_en: 'Korea Visa Application & Extension',
        name_vi: 'Nộp và gia hạn visa Hàn Quốc',
        slug: 'visa-process',
        icon: Globe,
        description: '신규/연장 신청, 준비 서류',
        color: '#2563eb',
        order: 2
    },
    {
        id: 'status-change',
        name: '한국 체류자격 변경',
        name_en: 'Korea Status Change',
        name_vi: 'Chuyển đổi tư cách lưu trú Hàn Quốc',
        slug: 'status-change',
        icon: Globe,
        description: '비자 종류 변경, 요건 안내',
        color: '#2563eb',
        order: 3
    },
    {
        id: 'visa-checklist',
        name: '한국 비자 체크리스트',
        name_en: 'Korea Visa Checklist',
        name_vi: 'Checklist hồ sơ visa Hàn Quốc',
        slug: 'visa-checklist',
        icon: Globe,
        description: '단계별 체크리스트·타임라인',
        color: '#2563eb',
        order: 4
    },
    {
        id: 'visa-tips',
        name: '한국 비자 변경 팁',
        name_en: 'Korea Visa Tips',
        name_vi: 'Mẹo đổi visa Hàn Quốc',
        slug: 'visa-tips',
        icon: Globe,
        description: '주의사항, 자주 막히는 포인트',
        color: '#2563eb',
        order: 5
    },
    {
        id: 'employment',
        name: '한국 직장생활',
        name_en: 'Work & Employment',
        name_vi: 'Việc làm & Công sở',
        slug: 'employment',
        icon: Briefcase,
        description: '취업, 한국 직장 문화, 근로계약',
        color: '#8b5cf6',
        order: 1
    },
    {
        id: 'housing',
        name: '한국에서 집 구하기',
        name_en: 'Housing in Korea',
        name_vi: 'Nhà ở tại Hàn Quốc',
        slug: 'housing',
        icon: Home,
        description: '전월세 계약, 외국인 주거 정보',
        color: '#f59e0b',
        order: 2
    },
    {
        id: 'korean-language',
        name: '한국어 배우기',
        name_en: 'Learn Korean',
        name_vi: 'Học tiếng Hàn',
        slug: 'korean-language',
        icon: BookOpen,
        description: '베트남어 화자를 위한 한국어 학습',
        color: '#10b981',
        order: 2
    },
    {
        id: 'daily-life',
        name: '한국 생활 정착',
        name_en: 'Daily Life in Korea',
        name_vi: 'Đời sống tại Hàn Quốc',
        slug: 'daily-life',
        icon: HeartHandshake,
        description: '한국 생활 초기 적응, 문화 차이 극복',
        color: '#06b6d4',
        order: 3
    },
    {
        id: 'cost-of-living',
        name: '한국 생활비 계산',
        name_en: 'Cost of Living in Korea',
        name_vi: 'Chi phí sinh hoạt tại Hàn Quốc',
        slug: 'cost-of-living',
        icon: HeartHandshake,
        description: '월평균 생활비, 항목별 가이드',
        color: '#06b6d4',
        order: 2
    },
    {
        id: 'finance',
        name: '베트남 송금·금융',
        name_en: 'Remittance & Finance',
        name_vi: 'Chuyển tiền & Tài chính',
        slug: 'finance',
        icon: CreditCard,
        description: '베트남 송금, 한국 은행 이용법',
        color: '#eab308',
        order: 4
    },
    {
        id: 'healthcare',
        name: '한국 의료 이용',
        name_en: 'Healthcare',
        name_vi: 'Y tế & Sức khỏe',
        slug: 'healthcare',
        icon: Stethoscope,
        description: '병원 이용법, 건강보험 가입',
        color: '#ef4444',
        order: 5
    },
    {
        id: 'legal',
        name: '근로자 권리',
        name_en: 'Worker Rights',
        name_vi: 'Quyền lợi lao động',
        slug: 'legal',
        icon: Scale,
        description: '법률 상담, 권리 보호, 분쟁 해결',
        color: '#64748b',
        order: 2
    },
    {
        id: 'student-life',
        name: '한국 유학생활',
        name_en: 'Student Life in Korea',
        name_vi: 'Đời sống du học sinh tại Hàn Quốc',
        slug: 'student-life',
        icon: GraduationCap,
        description: '유학 절차, 학교·장학금, 기숙사·생활 적응',
        color: '#3b82f6',
        order: 1
    },
    {
        id: 'scholarship',
        name: '입학·장학금',
        name_en: 'Admissions & Scholarship',
        name_vi: 'Tuyển sinh & Học bổng',
        slug: 'scholarship',
        icon: GraduationCap,
        description: '입학 조건, 장학금, 비자 절차',
        color: '#2563eb',
        order: 2
    },
    {
        id: 'tuition-living-cost',
        name: '학비·생활비',
        name_en: 'Tuition & Living Cost',
        name_vi: 'Học phí & Chi phí sinh hoạt',
        slug: 'tuition-living-cost',
        icon: GraduationCap,
        description: '학비, 생활비, 예산 계획',
        color: '#2563eb',
        order: 3
    },
    {
        id: 'university-ranking',
        name: '학교/지역 비교',
        name_en: 'University & Region Comparison',
        name_vi: 'So sánh trường/khu vực',
        slug: 'university-ranking',
        icon: GraduationCap,
        description: '학교 랭킹, 지역별 생활비',
        color: '#2563eb',
        order: 4
    },
    {
        id: 'integration-program',
        name: '사회통합프로그램',
        name_en: 'Integration Program',
        name_vi: 'Chương trình hội nhập xã hội',
        slug: 'integration-program',
        icon: GraduationCap,
        description: '사회통합/영주·국적 준비',
        color: '#2563eb',
        order: 2
    },
    {
        id: 'campus-life',
        name: '한국 대학생활',
        name_en: 'Campus Life in Korea',
        name_vi: 'Đời sống đại học tại Hàn Quốc',
        slug: 'campus-life',
        icon: GraduationCap,
        description: '기숙사·동아리·생활 팁',
        color: '#2563eb',
        order: 3
    },
    {
        id: 'major-selection',
        name: '전공·진로 선택',
        name_en: 'Major & Career Selection',
        name_vi: 'Chọn chuyên ngành & định hướng',
        slug: 'major-selection',
        icon: GraduationCap,
        description: '전공 선택, 진로 상담',
        color: '#2563eb',
        order: 4
    },
    {
        id: 'student-review',
        name: '유학생활 후기',
        name_en: 'Student Reviews',
        name_vi: 'Chia sẻ kinh nghiệm du học',
        slug: 'student-review',
        icon: GraduationCap,
        description: '학교/전공/기숙사 후기',
        color: '#2563eb',
        order: 5
    },
    {
        id: 'business',
        name: '한국 아르바이트',
        name_en: 'Part-time Jobs in Korea',
        name_vi: 'Việc làm thêm tại Hàn Quốc',
        slug: 'business',
        icon: Building2,
        description: '아르바이트 구직, 비자·근로 조건 안내',
        color: '#6366f1',
        order: 3
    },
    {
        id: 'wage-info',
        name: '급여·최저임금',
        name_en: 'Wage & Minimum Wage',
        name_vi: 'Lương & Lương tối thiểu',
        slug: 'wage-info',
        icon: Briefcase,
        description: '직종별 급여, 최저임금, 팁',
        color: '#2563eb',
        order: 4
    },
    {
        id: 'education',
        name: '육아·자녀교육',
        name_en: 'Parenting & Education',
        name_vi: 'Nuôi dạy con & Giáo dục',
        slug: 'education',
        icon: GraduationCap,
        description: '자녀 교육, 다문화 가정 지원',
        color: '#ec4899',
        order: 6
    },
    {
        id: 'shipping',
        name: '베트남 물품 배송',
        name_en: 'Shipping',
        name_vi: 'Vận chuyển hàng hóa',
        slug: 'shipping',
        icon: Package,
        description: '한국→베트남 배송, 베트남 물품 구매',
        color: '#f59e0b',
        order: 6
    },
];

export const CATEGORY_GROUPS = {
    visa: {
        label: '한국 비자·체류',
        label_en: 'Korea Visa & Stay',
        label_vi: 'Visa & Lưu trú Hàn Quốc',
        emoji: '🛂',
        slugs: CATEGORY_GROUP_SLUGS.visa
    },
    students: {
        label: '한국 유학·학생',
        label_en: 'Study & Students in Korea',
        label_vi: 'Du học & Sinh viên tại Hàn Quốc',
        emoji: '🎓',
        slugs: CATEGORY_GROUP_SLUGS.students
    },
    career: {
        label: '한국 취업·경력',
        label_en: 'Jobs & Career in Korea',
        label_vi: 'Việc làm & Sự nghiệp tại Hàn Quốc',
        emoji: '💼',
        slugs: CATEGORY_GROUP_SLUGS.career
    },
    living: {
        label: '한국 생활정보',
        label_en: 'Living in Korea',
        label_vi: 'Đời sống tại Hàn Quốc',
        emoji: '🏠',
        slugs: CATEGORY_GROUP_SLUGS.living
    }
} as const;

// Helper function to get translated category name
export function getCategoryName(category: LegacyCategory, locale: string = 'ko'): string {
    if (locale === 'vi' && category.name_vi) return category.name_vi;
    if (locale === 'en' && category.name_en) return category.name_en;
    return category.name;
}

export const ALLOWED_CATEGORY_SLUGS = new Set<string>([
    ...Object.keys(CATEGORY_GROUPS),
    ...Object.values(CATEGORY_GROUPS).flatMap((group) => Array.from(group.slugs)),
]);
