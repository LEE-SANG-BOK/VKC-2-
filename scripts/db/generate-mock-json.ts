#!/usr/bin/env tsx

/**
 * 베트남 특화 샘플 JSON 데이터 생성 스크립트
 * 실제 Supabase 연동과 무관한 예시 데이터 파일을 생성합니다.
 */

import { faker } from '@faker-js/faker'
import fs from 'fs'
import path from 'path'

// 베트남 특화 카테고리 데이터
const vietnamCategories = [
  { name: '비자/체류', slug: 'visa', icon: '📄', color: '#EA4335', description: '비자 신청, 연장, 체류 관련 정보' },
  { name: '취업/근로', slug: 'work', icon: '💼', color: '#4285F4', description: '구직, 취업, 근로계약 관련 정보' },
  { name: '생활정보', slug: 'life', icon: '🏠', color: '#34A853', description: '일상생활, 주거, 생활팁' },
  { name: '교육/학업', slug: 'education', icon: '📚', color: '#FBBC04', description: '대학, 어학원, 교육 정보' },
  { name: '의료/건강', slug: 'health', icon: '🏥', color: '#FF6D01', description: '병원, 보험, 건강 관리' },
  { name: '금융/세금', slug: 'finance', icon: '💰', color: '#9C27B0', description: '은행, 세금, 금융 서비스' },
  { name: '교통/여행', slug: 'transport', icon: '🚌', color: '#FF5722', description: '교통수단, 여행, 항공편' },
  { name: '법률/행정', slug: 'legal', icon: '⚖️', color: '#607D8B', description: '법률 상담, 행정 절차' },
  { name: '문화/언어', slug: 'culture', icon: '🎭', color: '#E91E63', description: '한국 문화, 언어 학습' },
  { name: '음식/맛집', slug: 'food', icon: '🍜', color: '#795548', description: '베트남 음식, 맛집 추천' }
]

// 베트남 관련 질문 템플릿
const questionTemplates = [
  // 비자/체류
  '베트남에서 한국 비자 {visa_type} 신청하는 방법이 궁금해요',
  '비자 연장 시 필요한 서류는 무엇인가요?',
  '{region}에서 외국인등록 하는 곳 알려주세요',
  '관광비자로 입국해서 학생비자 변경 가능한가요?',
  'E-7 비자에서 F-2 비자로 변경하려면 어떻게 해야 하나요?',

  // 취업/근로
  '{region}에서 베트남 사람 구인하는 회사 있나요?',
  '한국어 못해도 일할 수 있는 곳 추천해주세요',
  '최저임금이 얼마인지 알고 싶어요',
  '야간 아르바이트 찾고 있는데 추천 부탁드려요',
  '공장에서 일하는데 안전장비 안 주는데 어떻게 해야 하나요?',

  // 생활정보
  '{region}에서 베트남 식재료 파는 곳 알려주세요',
  '한국 전화요금이 너무 비싼데 싼 곳 있나요?',
  '원룸 계약할 때 주의할 점이 뭐가 있나요?',
  '가스비 전기비 너무 많이 나오는데 절약 방법 있나요?',
  '한국 겨울이 너무 추운데 난방비 아끼는 방법 있나요?',

  // 교육/학업
  '한국어 무료로 배울 수 있는 곳 있나요?',
  '한국 대학교 입학하려면 어떻게 해야 하나요?',
  'TOPIK 시험 언제 신청하나요?',
  '야간 한국어 수업 있는 곳 추천해주세요',
  '한국어 능력시험 몇 급까지 따야 좋을까요?',

  // 의료/건강
  '병원비가 너무 비싼데 보험 가입 방법 알려주세요',
  '응급실에 가면 통역 서비스 있나요?',
  '치과 치료비 저렴한 곳 추천해주세요',
  '베트남에서 가져온 약 한국에서 써도 되나요?',
  '건강검진 받으려면 어디로 가야 하나요?',

  // 금융/세금
  '한국 은행계좌 개설하려면 뭐가 필요한가요?',
  '베트남으로 돈 보내는 가장 싼 방법이 뭐예요?',
  '세금 신고는 어떻게 하나요?',
  '카드 발급받으려면 어떻게 해야 하나요?',
  '적금 넣고 싶은데 어느 은행이 좋나요?',

  // 교통/여행
  '지하철 환승 방법을 모르겠어요',
  '버스 타는 방법 알려주세요',
  '택시 기본요금이 얼마인가요?',
  '베트남 항공료 싼 시기가 언제인가요?',
  'KTX 예약은 어떻게 하나요?',

  // 법률/행정
  '근로계약서 없이 일하고 있는데 괜찮나요?',
  '사장이 월급을 안 줘요. 어떻게 해야 하나요?',
  '교통사고 났을 때 어떻게 해야 하나요?',
  '집주인이 보증금을 안 돌려줘요',
  '경찰서에서 통역 서비스 받을 수 있나요?',

  // 문화/언어
  '한국 예절에 대해 알고 싶어요',
  '한국 친구 사귀는 방법 알려주세요',
  '추석이나 설날에는 뭐 하나요?',
  '한국 드라마 보면서 한국어 공부하는 방법',
  '한국인과 대화할 때 주의할 점이 있나요?',

  // 음식/맛집
  '{region}에서 베트남 쌀국수 맛있는 집 추천해주세요',
  '한국 음식 중에 베트남 사람 입맛에 맞는 거 뭐가 있나요?',
  '베트남 향신료 파는 곳 알려주세요',
  '할랄 음식 파는 곳이 있나요?',
  '저렴하고 맛있는 한국 음식 추천해주세요'
]

// 베트남 사용자 프로필 데이터
const vietnamUserProfiles = {
  names: [
    'Nguyễn Văn Hùng', 'Trần Thị Lan', 'Lê Minh Tuấn', 'Phạm Thị Hoa', 'Hoàng Văn Nam',
    'Vũ Thị Mai', 'Đặng Minh Khôi', 'Bùi Thị Linh', 'Ngô Văn Đức', 'Đỗ Thị Nga',
    'Lý Minh Sơn', 'Phan Thị Thu', 'Tôn Văn Khang', 'Đinh Thị My', 'Trịnh Minh Tâm',
    'Chu Thị Loan', 'Võ Văn Phúc', 'Tạ Thị Hiền', 'Lưu Minh Đạt', 'Dương Thị Hạnh'
  ],
  regions: [
    '서울 강남구', '서울 서초구', '서울 관악구', '서울 영등포구', '서울 구로구',
    '서울 금천구', '서울 동작구', '인천 남동구', '인천 연수구', '부천시',
    '안산시', '수원시', '성남시', '고양시', '화성시'
  ],
  visaTypes: ['E-9', 'E-7', 'F-2', 'F-4', 'H-2', 'D-2', 'D-4', 'B-1', 'C-3'],
  companies: [
    'LG전자', '삼성전자', 'SK하이닉스', '현대자동차', '기아자동차',
    '포스코', 'LG화학', '한화솔루션', 'CJ제일제당', '롯데',
    '중소기업', '제조업체', 'IT회사', '건설회사', '물류회사'
  ]
}

// 답변 템플릿
const answerTemplates = [
  '저도 같은 경험 있어요. {경험} 했는데 도움이 되었어요.',
  '관련 기관에 문의해보시는 게 좋을 것 같아요. {기관명}에서 상세한 안내 받으실 수 있어요.',
  '{지역명}에서 {몇년}째 살고 있는데, 제 경험으로는 {조언}이 도움될 거예요.',
  '저는 {방법}으로 해결했어요. 참고하시면 좋을 것 같아요.',
  '이런 경우에는 {절차}를 따라 하시면 됩니다. 필요한 서류는 {서류목록}이에요.'
]

function generateMockData() {
  console.log('🚀 베트남 K-Connect 목업 데이터 생성 중...')

  // 1. 카테고리 데이터 (ID 추가)
  const categories = vietnamCategories.map((cat, index) => ({
    id: faker.string.uuid(),
    ...cat,
    question_count: 0,
    created_at: faker.date.recent({ days: 30 }).toISOString(),
    updated_at: new Date().toISOString()
  }))

  console.log(`📁 카테고리 ${categories.length}개 생성 완료`)

  // 2. 사용자 데이터 (150명)
  const users = Array.from({ length: 150 }, (_, i) => {
    const name = vietnamUserProfiles.names[i % vietnamUserProfiles.names.length]
    const region = faker.helpers.arrayElement(vietnamUserProfiles.regions)
    const visaType = faker.helpers.arrayElement(vietnamUserProfiles.visaTypes)
    const company = faker.helpers.arrayElement(vietnamUserProfiles.companies)
    const yearsInKorea = faker.number.int({ min: 0, max: 10 })

    return {
      id: faker.string.uuid(),
      email: `${name.toLowerCase().replace(/\s+/g, '').replace(/[^\w]/g, '')}${i}@example.com`,
      name,
      avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`,
      bio: `${region} 거주 ${yearsInKorea}년차 베트남 사람입니다. ${company}에서 일하고 있어요.`,
      provider: faker.helpers.arrayElement(['google', 'kakao', 'facebook']),
      provider_id: faker.string.alphanumeric(10),
      visa_type: visaType,
      company,
      years_in_korea: yearsInKorea,
      region,
      preferred_language: 'ko',
      is_verified: faker.datatype.boolean(0.3),
      trust_score: faker.number.int({ min: 10, max: 100 }),
      badges: {
        senior: yearsInKorea >= 5,
        expert: faker.datatype.boolean(0.1),
        verified: faker.datatype.boolean(0.3),
        helper: faker.datatype.boolean(0.2),
        moderator: faker.datatype.boolean(0.05)
      },
      question_count: 0,
      answer_count: 0,
      helpful_answer_count: 0,
      created_at: faker.date.recent({ days: 365 }).toISOString(),
      updated_at: new Date().toISOString()
    }
  })

  console.log(`👥 사용자 ${users.length}명 생성 완료`)

  // 3. 질문 데이터 (600개)
  const questions = Array.from({ length: 600 }, (_, i) => {
    const category = faker.helpers.arrayElement(categories)
    const user = faker.helpers.arrayElement(users)
    const template = faker.helpers.arrayElement(questionTemplates)

    // 템플릿 변수 치환
    let title = template
      .replace('{region}', faker.helpers.arrayElement(vietnamUserProfiles.regions))
      .replace('{visa_type}', faker.helpers.arrayElement(vietnamUserProfiles.visaTypes))
      .replace('{경험}', faker.helpers.arrayElement(['직접 신청', '대행업체 이용', '온라인 신청']))
      .replace('{기관명}', faker.helpers.arrayElement(['출입국관리사무소', '구청', '주민센터']))

    const content = `${title}\n\n상세한 정보나 경험담을 공유해주시면 정말 감사하겠습니다.\n\n${user.region}에 거주 중이고, ${user.visa_type} 비자로 ${user.years_in_korea}년째 한국에서 생활하고 있습니다.`

    return {
      id: faker.string.uuid(),
      title,
      content,
      user_id: user.id,
      category_id: category.id,
      tags: [category.slug, 'vietnam', faker.helpers.arrayElement(['urgent', 'help', 'info', 'experience'])],
      views: faker.number.int({ min: 0, max: 500 }),
      vote_score: faker.number.int({ min: -5, max: 50 }),
      answer_count: 0,
      is_resolved: faker.datatype.boolean(0.4),
      ai_category: category.slug,
      ai_urgency: faker.helpers.arrayElement(['low', 'medium', 'high']),
      ai_expert_match: faker.datatype.boolean(0.6),
      status: faker.helpers.arrayElement(['active', 'closed']),
      created_at: faker.date.recent({ days: 90 }).toISOString(),
      updated_at: faker.date.recent({ days: 30 }).toISOString()
    }
  })

  console.log(`❓ 질문 ${questions.length}개 생성 완료`)

  // 4. 답변 데이터 (1000개)
  const answers = Array.from({ length: 1000 }, (_, i) => {
    const question = faker.helpers.arrayElement(questions)
    const user = faker.helpers.arrayElement(users.filter(u => u.id !== question.user_id))
    const template = faker.helpers.arrayElement(answerTemplates)

    let content = template
      .replace('{경험}', faker.helpers.arrayElement(['직접 경험', '친구를 통해', '인터넷에서 찾아서']))
      .replace('{기관명}', faker.helpers.arrayElement(['출입국관리사무소', '구청', '주민센터', '고용노동부']))
      .replace('{지역명}', user.region)
      .replace('{몇년}', user.years_in_korea.toString())
      .replace('{조언}', faker.helpers.arrayElement(['미리 준비하는 것', '여러 곳에 문의해보는 것', '경험자에게 물어보는 것']))
      .replace('{방법}', faker.helpers.arrayElement(['온라인 신청', '직접 방문', '대행업체 이용']))
      .replace('{절차}', faker.helpers.arrayElement(['온라인 접수', '서류 준비 후 방문', '전화 상담 후 진행']))
      .replace('{서류목록}', faker.helpers.arrayElement(['여권, 외국인등록증', '재직증명서, 급여명세서', '주민등록등본, 계약서']))

    return {
      id: faker.string.uuid(),
      content: content + `\n\n도움이 되었으면 좋겠어요! 추가 질문 있으시면 언제든 물어보세요.`,
      question_id: question.id,
      user_id: user.id,
      vote_score: faker.number.int({ min: 0, max: 30 }),
      is_accepted: faker.datatype.boolean(0.2),
      ai_helpfulness: faker.number.float({ min: 0.5, max: 1.0 }),
      created_at: faker.date.between({
        from: new Date(question.created_at),
        to: new Date()
      }).toISOString(),
      updated_at: new Date().toISOString()
    }
  })

  console.log(`💬 답변 ${answers.length}개 생성 완료`)

  // 답변 개수 업데이트
  questions.forEach(question => {
    question.answer_count = answers.filter(a => a.question_id === question.id).length
  })

  // 사용자 통계 업데이트
  users.forEach(user => {
    user.question_count = questions.filter(q => q.user_id === user.id).length
    user.answer_count = answers.filter(a => a.user_id === user.id).length
    user.helpful_answer_count = answers.filter(a => a.user_id === user.id && a.vote_score > 5).length
  })

  // 카테고리 통계 업데이트
  categories.forEach(category => {
    category.question_count = questions.filter(q => q.category_id === category.id).length
  })

  // 5. JSON 파일 저장
  const mockData = {
    generated_at: new Date().toISOString(),
    summary: {
      categories: categories.length,
      users: users.length,
      questions: questions.length,
      answers: answers.length
    },
    data: {
      categories,
      users,
      questions,
      answers
    }
  }

  const outputDir = path.join(process.cwd(), 'public', 'mock-data')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const outputPath = path.join(outputDir, 'vietnamese-qna-data.json')
  fs.writeFileSync(outputPath, JSON.stringify(mockData, null, 2))

  console.log('\n✅ 베트남 K-Connect 목업 데이터 생성 완료!')
  console.log(`📄 파일 위치: ${outputPath}`)
  console.log(`📊 생성된 데이터:`)
  console.log(`   - 카테고리: ${categories.length}개`)
  console.log(`   - 사용자: ${users.length}명`)
  console.log(`   - 질문: ${questions.length}개`)
  console.log(`   - 답변: ${answers.length}개`)
  console.log(`   - 총 데이터: ${categories.length + users.length + questions.length + answers.length}개`)

  return mockData
}

// 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  generateMockData()
}

export { generateMockData }
