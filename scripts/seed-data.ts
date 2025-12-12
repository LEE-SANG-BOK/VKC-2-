#!/usr/bin/env tsx

/**
 * Supabase 시드 데이터 스크립트
 * Mock 데이터를 실제 Supabase 데이터베이스에 입력
 *
 * 사용법: npm run db:seed
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from '../lib/supabase'

// 환경변수에서 Supabase 정보 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수 누락: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// 서비스 롤 키로 관리자 권한 클라이언트 생성
const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// 베트남 커뮤니티 5개 핵심 카테고리 (로드맵 기준)
const categories = [
  {
    id: 1,
    name: '비자/법률',
    slug: 'visa',
    description: '비자 신청, 연장, 체류, 법률 문제 관련 질문',
    icon: '🛂',
    color: '#3B82F6',
    parent_id: null,
    sort_order: 1,
    is_active: true
  },
  {
    id: 2,
    name: '취업/직장',
    slug: 'employment',
    description: '취업, 직장 생활, 근로 조건 관련 질문',
    icon: '💼',
    color: '#10B981',
    parent_id: null,
    sort_order: 2,
    is_active: true
  },
  {
    id: 3,
    name: '주거/부동산',
    slug: 'housing',
    description: '집 구하기, 전월세, 주거 관련 질문',
    icon: '🏠',
    color: '#F59E0B',
    parent_id: null,
    sort_order: 3,
    is_active: true
  },
  {
    id: 4,
    name: '의료/건강',
    slug: 'health',
    description: '의료보험, 병원, 건강 관련 질문',
    icon: '🏥',
    color: '#EF4444',
    parent_id: null,
    sort_order: 4,
    is_active: true
  },
  {
    id: 5,
    name: '생활정보',
    slug: 'life',
    description: '일상 생활, 문화, 쇼핑, 교육 등 기타 정보',
    icon: '🌟',
    color: '#8B5CF6',
    parent_id: null,
    sort_order: 5,
    is_active: true
  }
]

// 베트남 사용자 데이터
const users = [
  {
    id: 'user-1',
    email: 'vietnam.student@example.com',
    name: '베트남학생',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vietnam1',
    bio: '한국에서 공부하는 베트남 학생입니다.',
    provider: 'google',
    provider_id: 'google-123',
    role: 'verified' as const,
    verification_status: 'approved' as const,
    verification_type: 'student' as const,
    specialty_areas: ['visa', 'education'],
    verified_at: '2024-01-15T00:00:00Z',
    visa_type: 'D-2',
    company: null,
    years_in_korea: 2,
    region: '서울',
    preferred_language: 'ko',
    is_verified: true,
    verification_date: '2024-01-15T00:00:00Z',
    trust_score: 75,
    badges: {
      senior: false,
      expert: false,
      verified: true,
      helper: true,
      moderator: false
    },
    question_count: 5,
    answer_count: 12,
    helpful_answer_count: 8,
    last_active: '2024-01-20T10:30:00Z',
    created_at: '2023-12-01T00:00:00Z',
    updated_at: '2024-01-20T10:30:00Z'
  },
  {
    id: 'user-2',
    email: 'hcm.resident@example.com',
    name: '호치민출신',
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=vietnam2',
    bio: '호치민에서 온 한국 거주자입니다.',
    provider: 'google',
    provider_id: 'google-456',
    role: 'verified' as const,
    verification_status: 'approved' as const,
    verification_type: 'resident' as const,
    specialty_areas: ['work', 'life'],
    verified_at: '2023-08-10T00:00:00Z',
    visa_type: 'F-2',
    company: '한국기업',
    years_in_korea: 5,
    region: '부산',
    preferred_language: 'ko',
    is_verified: true,
    verification_date: '2023-08-10T00:00:00Z',
    trust_score: 92,
    badges: {
      senior: true,
      expert: false,
      verified: true,
      helper: true,
      moderator: false
    },
    question_count: 3,
    answer_count: 28,
    helpful_answer_count: 22,
    last_active: '2024-01-19T15:20:00Z',
    created_at: '2023-06-15T00:00:00Z',
    updated_at: '2024-01-19T15:20:00Z'
  }
]

// 베트남 Q&A 질문 데이터
const questions = [
  {
    id: 'question-1',
    title: '한국에서 비자 연장 신청 방법이 궁금합니다',
    content: '학생비자(D-2)에서 취업비자(E-7)로 변경하려고 하는데 필요한 서류와 절차를 알고 싶습니다. 특히 어떤 회사 서류가 필요한지, 소요 기간은 얼마나 되는지 궁금합니다.',
    author_id: 'user-1',
    category_id: 1,
    tags: ['비자연장', 'D-2', 'E-7', '취업비자'],
    ai_category_confidence: 0.95,
    ai_tags: ['visa', 'employment', 'documents'],
    urgency: 'high',
    matched_experts: ['visa-expert-1', 'employment-expert-2'],
    expert_notifications_sent: true,
    view_count: 127,
    answer_count: 3,
    helpful_count: 2,
    upvote_count: 8,
    downvote_count: 1,
    status: 'open',
    is_pinned: false,
    is_featured: false,
    is_reported: false,
    is_approved: true,
    moderated_by: null,
    moderated_at: null,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    last_activity_at: '2024-01-18T14:20:00Z',
    resolved_at: null
  },
  {
    id: 'question-2',
    title: '서울에서 베트남 음식 재료 구매할 수 있는 곳',
    content: '베트남 요리를 해먹고 싶은데 어디서 재료를 구할 수 있을까요? 특히 쌀국수, 피시소스, 베트남 고수 등을 찾고 있습니다.',
    author_id: 'user-2',
    category_id: 5,
    tags: ['베트남음식', '재료구매', '서울', '쇼핑'],
    ai_category_confidence: 0.88,
    ai_tags: ['food', 'shopping', 'vietnamese'],
    urgency: 'normal',
    matched_experts: ['food-expert-1'],
    expert_notifications_sent: false,
    view_count: 89,
    answer_count: 5,
    helpful_count: 4,
    upvote_count: 12,
    downvote_count: 0,
    status: 'resolved',
    is_pinned: true,
    is_featured: false,
    is_reported: false,
    is_approved: true,
    moderated_by: null,
    moderated_at: null,
    created_at: '2024-01-14T15:20:00Z',
    updated_at: '2024-01-16T09:45:00Z',
    last_activity_at: '2024-01-16T09:45:00Z',
    resolved_at: '2024-01-16T09:45:00Z'
  },
  {
    id: 'question-3',
    title: '한국 회사에서 일할 때 주의사항',
    content: '한국 회사 문화와 업무 방식에 대해 조언 부탁드립니다. 특히 상하관계, 회식 문화, 업무 소통 방식 등이 궁금합니다.',
    author_id: 'user-1',
    category_id: 2,
    tags: ['회사문화', '업무', '소통', '조언'],
    ai_category_confidence: 0.92,
    ai_tags: ['work', 'culture', 'communication'],
    urgency: 'normal',
    matched_experts: ['culture-expert-1', 'work-expert-2'],
    expert_notifications_sent: true,
    view_count: 203,
    answer_count: 7,
    helpful_count: 6,
    upvote_count: 15,
    downvote_count: 2,
    status: 'open',
    is_pinned: false,
    is_featured: true,
    is_reported: false,
    is_approved: true,
    moderated_by: null,
    moderated_at: null,
    created_at: '2024-01-13T09:45:00Z',
    updated_at: '2024-01-19T16:30:00Z',
    last_activity_at: '2024-01-19T16:30:00Z',
    resolved_at: null
  },
  {
    id: 'question-4',
    title: '전월세 계약 시 주의사항이 궁금합니다',
    content: '처음 한국에서 집을 구하려고 하는데 전월세 계약 시 어떤 것들을 확인해야 하나요? 보증금, 월세, 계약서 등에 대해 자세히 알고 싶습니다.',
    author_id: 'user-1',
    category_id: 3,
    tags: ['전월세', '계약', '보증금', '주거'],
    ai_category_confidence: 0.94,
    ai_tags: ['housing', 'rental', 'contract'],
    urgency: 'high',
    matched_experts: ['housing-expert-1'],
    expert_notifications_sent: true,
    view_count: 156,
    answer_count: 2,
    helpful_count: 1,
    upvote_count: 9,
    downvote_count: 0,
    status: 'open',
    is_pinned: false,
    is_featured: false,
    is_reported: false,
    is_approved: true,
    moderated_by: null,
    moderated_at: null,
    created_at: '2024-01-12T16:15:00Z',
    updated_at: '2024-01-17T11:20:00Z',
    last_activity_at: '2024-01-17T11:20:00Z',
    resolved_at: null
  },
  {
    id: 'question-5',
    title: '한국 의료보험 가입 방법',
    content: '외국인도 국민건강보험에 가입할 수 있나요? 가입 조건과 절차, 보험료 등에 대해 알고 싶습니다.',
    author_id: 'user-2',
    category_id: 4,
    tags: ['의료보험', '건강보험', '외국인', '가입'],
    ai_category_confidence: 0.96,
    ai_tags: ['health', 'insurance', 'medical'],
    urgency: 'normal',
    matched_experts: ['health-expert-1'],
    expert_notifications_sent: false,
    view_count: 98,
    answer_count: 1,
    helpful_count: 1,
    upvote_count: 6,
    downvote_count: 0,
    status: 'open',
    is_pinned: false,
    is_featured: false,
    is_reported: false,
    is_approved: true,
    moderated_by: null,
    moderated_at: null,
    created_at: '2024-01-11T13:45:00Z',
    updated_at: '2024-01-14T16:30:00Z',
    last_activity_at: '2024-01-14T16:30:00Z',
    resolved_at: null
  }
]

// 답변 데이터
const answers = [
  {
    id: 'answer-1',
    content: 'D-2에서 E-7로 변경할 때는 먼저 회사에서 사업자등록증, 고용계약서, 표준임금확인서 등을 준비해야 합니다. 출입국 사무소에 직접 방문하시거나 온라인으로도 신청 가능해요.',
    question_id: 'question-1',
    author_id: 'user-2',
    parent_answer_id: null,
    is_accepted: true,
    accepted_at: '2024-01-16T10:00:00Z',
    accepted_by: 'user-1',
    upvote_count: 5,
    downvote_count: 0,
    helpful_count: 3,
    is_reported: false,
    is_approved: true,
    moderated_by: null,
    moderated_at: null,
    ai_helpfulness_score: 0.92,
    ai_sentiment: 'positive',
    created_at: '2024-01-15T14:30:00Z',
    updated_at: '2024-01-15T14:30:00Z'
  }
]

async function seedData() {
  console.log('🌱 Supabase 시드 데이터 삽입 시작...')

  try {
    // 1. 카테고리 삽입
    console.log('📂 카테고리 삽입 중...')
    const { error: categoriesError } = await supabase
      .from('categories')
      .upsert(categories, { onConflict: 'id' })

    if (categoriesError) {
      console.error('❌ 카테고리 삽입 실패:', categoriesError)
      return
    }
    console.log('✅ 카테고리 5개 삽입 완료')

    // 2. 사용자 삽입
    console.log('👥 사용자 삽입 중...')
    const { error: usersError } = await supabase
      .from('users')
      .upsert(users, { onConflict: 'id' })

    if (usersError) {
      console.error('❌ 사용자 삽입 실패:', usersError)
      return
    }
    console.log('✅ 사용자 2명 삽입 완료')

    // 3. 질문 삽입
    console.log('❓ 질문 삽입 중...')
    const { error: questionsError } = await supabase
      .from('questions')
      .upsert(questions, { onConflict: 'id' })

    if (questionsError) {
      console.error('❌ 질문 삽입 실패:', questionsError)
      return
    }
    console.log('✅ 질문 3개 삽입 완료')

    // 4. 답변 삽입
    console.log('💬 답변 삽입 중...')
    const { error: answersError } = await supabase
      .from('answers')
      .upsert(answers, { onConflict: 'id' })

    if (answersError) {
      console.error('❌ 답변 삽입 실패:', answersError)
      return
    }
    console.log('✅ 답변 1개 삽입 완료')

    console.log('\n🎉 시드 데이터 삽입 완료!')
    console.log('📊 삽입된 데이터:')
    console.log('  - 카테고리: 5개 (비자/법률, 취업/직장, 주거/부동산, 의료/건강, 생활정보)')
    console.log('  - 사용자: 2명 (베트남 학생, 호치민 거주자)')
    console.log('  - 질문: 5개 (비자 연장, 음식 재료, 회사 문화, 전월세, 의료보험)')
    console.log('  - 답변: 1개 (비자 연장 답변)')
    console.log('\n🚀 이제 실제 데이터로 테스트할 수 있습니다!')

  } catch (error) {
    console.error('❌ 시드 데이터 삽입 중 오류:', error)
    process.exit(1)
  }
}

async function clearData() {
  console.log('🗑️  기존 데이터 삭제 중...')

  try {
    // 순서 중요: 외래키 제약조건 때문에 역순으로 삭제
    await supabase.from('answers').delete().neq('id', '')
    await supabase.from('questions').delete().neq('id', '')
    await supabase.from('users').delete().neq('id', '')
    await supabase.from('categories').delete().neq('id', '')

    console.log('✅ 기존 데이터 삭제 완료')
  } catch (error) {
    console.error('❌ 데이터 삭제 실패:', error)
  }
}

// 메인 실행
async function main() {
  const args = process.argv.slice(2)
  const shouldClear = args.includes('--clear')

  if (shouldClear) {
    await clearData()
  }

  await seedData()
  process.exit(0)
}

if (require.main === module) {
  main()
}

export { seedData, clearData }