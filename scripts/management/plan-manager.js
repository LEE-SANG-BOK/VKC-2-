#!/usr/bin/env node

/**
 * 플랜 관리 시스템
 * - 개발 요청사항 → 플랜 생성 → 사용자 승인 → 파일 저장
 * - 진행 상황 추적 및 컨텍스트 보존
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { createGitHubIssue, commitAndPush } from './github-auto-issue.js'

const PLANS_DIR = '/Users/bk/Desktop/viet-kconnect/plans'
const CONTEXTS_DIR = '/Users/bk/Desktop/viet-kconnect/contexts'

// 디렉토리 생성
if (!fs.existsSync(PLANS_DIR)) {
  fs.mkdirSync(PLANS_DIR, { recursive: true })
}
if (!fs.existsSync(CONTEXTS_DIR)) {
  fs.mkdirSync(CONTEXTS_DIR, { recursive: true })
}

/**
 * 개발 요청사항을 분석하여 플랜 생성
 */
function generatePlan(request, requestId = null) {
  const planId = requestId || `plan-${Date.now()}`
  const timestamp = new Date().toISOString()

  // 요청사항 분석
  const analysis = analyzeRequest(request)

  const plan = {
    id: planId,
    timestamp,
    request: request,
    analysis,
    tasks: generateTasks(analysis),
    resources: estimateResources(analysis),
    dependencies: identifyDependencies(analysis),
    timeline: generateTimeline(analysis),
    risks: identifyRisks(analysis),
    status: 'pending_approval',
    createdBy: 'claude-code',
    version: '1.0'
  }

  return plan
}

/**
 * 요청사항 분석
 */
function analyzeRequest(request) {
  const keywords = {
    ui: ['ui', 'component', 'design', '화면', '페이지', 'layout'],
    api: ['api', 'endpoint', '서버', 'backend', 'crud'],
    auth: ['auth', '인증', 'login', '로그인', 'oauth'],
    database: ['db', 'database', '데이터베이스', 'schema', '스키마'],
    testing: ['test', '테스트', 'testing', '검증'],
    deployment: ['deploy', '배포', 'production', '운영'],
    performance: ['performance', '성능', 'optimization', '최적화']
  }

  const analysis = {
    type: 'general',
    complexity: 'medium',
    domains: [],
    estimatedDays: 1,
    priority: 'normal'
  }

  const lowerRequest = request.toLowerCase()

  // 도메인 식별
  for (const [domain, words] of Object.entries(keywords)) {
    if (words.some(word => lowerRequest.includes(word))) {
      analysis.domains.push(domain)
    }
  }

  // 복잡도 추정
  if (analysis.domains.length >= 3) {
    analysis.complexity = 'high'
    analysis.estimatedDays = 5
  } else if (analysis.domains.length >= 2) {
    analysis.complexity = 'medium'
    analysis.estimatedDays = 3
  } else {
    analysis.complexity = 'low'
    analysis.estimatedDays = 1
  }

  // 우선순위 판단
  if (lowerRequest.includes('긴급') || lowerRequest.includes('urgent')) {
    analysis.priority = 'high'
  }

  // 타입 결정
  if (analysis.domains.includes('ui')) {
    analysis.type = 'frontend'
  } else if (analysis.domains.includes('api') || analysis.domains.includes('database')) {
    analysis.type = 'backend'
  } else if (analysis.domains.length > 1) {
    analysis.type = 'fullstack'
  }

  return analysis
}

/**
 * 작업 목록 생성
 */
function generateTasks(analysis) {
  const tasks = []

  // 도메인별 기본 작업
  const domainTasks = {
    ui: [
      '컴포넌트 설계 및 구조 분석',
      'UI/UX 디자인 구현',
      '반응형 레이아웃 적용',
      '접근성 검증'
    ],
    api: [
      'API 엔드포인트 설계',
      '라우터 및 미들웨어 구현',
      '에러 핸들링 구현',
      'API 문서화'
    ],
    auth: [
      '인증 시스템 분석',
      '보안 정책 구현',
      '세션 관리 구현',
      '권한 검증 시스템'
    ],
    database: [
      '데이터베이스 스키마 설계',
      '마이그레이션 파일 생성',
      '데이터 검증 로직',
      '성능 최적화'
    ],
    testing: [
      '단위 테스트 작성',
      '통합 테스트 구현',
      '테스트 커버리지 확보',
      '테스트 자동화'
    ]
  }

  // 공통 작업
  tasks.push(
    '요구사항 분석 및 설계',
    '기존 코드베이스 분석'
  )

  // 도메인별 작업 추가
  analysis.domains.forEach(domain => {
    if (domainTasks[domain]) {
      tasks.push(...domainTasks[domain])
    }
  })

  // 마무리 작업
  tasks.push(
    '코드 리뷰 및 품질 검증',
    '문서화 업데이트',
    '배포 준비'
  )

  return tasks.map((task, index) => ({
    id: `task-${index + 1}`,
    title: task,
    status: 'pending',
    estimatedHours: Math.ceil(analysis.estimatedDays * 8 / tasks.length),
    dependencies: []
  }))
}

/**
 * 리소스 추정
 */
function estimateResources(analysis) {
  return {
    estimatedDays: analysis.estimatedDays,
    complexity: analysis.complexity,
    requiredSkills: analysis.domains,
    tools: getRequiredTools(analysis.domains),
    files: estimateFileChanges(analysis)
  }
}

/**
 * 필요한 도구 식별
 */
function getRequiredTools(domains) {
  const toolMap = {
    ui: ['React', 'Tailwind CSS', 'shadcn/ui'],
    api: ['Next.js API Routes', 'Express'],
    auth: ['Supabase Auth', 'JWT'],
    database: ['Supabase', 'PostgreSQL'],
    testing: ['Jest', 'Playwright', 'Testing Library']
  }

  const tools = new Set()
  domains.forEach(domain => {
    if (toolMap[domain]) {
      toolMap[domain].forEach(tool => tools.add(tool))
    }
  })

  return Array.from(tools)
}

/**
 * 파일 변경 추정
 */
function estimateFileChanges(analysis) {
  const changes = {
    new: [],
    modified: [],
    deleted: []
  }

  const filePatterns = {
    ui: {
      new: ['components/*.tsx', 'app/*/page.tsx'],
      modified: ['app/layout.tsx', 'tailwind.config.js']
    },
    api: {
      new: ['app/api/*/route.ts'],
      modified: ['middleware.ts']
    },
    auth: {
      modified: ['contexts/AuthContext.tsx', 'lib/auth.ts']
    },
    database: {
      new: ['supabase/migrations/*.sql'],
      modified: ['lib/supabase.ts']
    }
  }

  analysis.domains.forEach(domain => {
    if (filePatterns[domain]) {
      if (filePatterns[domain].new) {
        changes.new.push(...filePatterns[domain].new)
      }
      if (filePatterns[domain].modified) {
        changes.modified.push(...filePatterns[domain].modified)
      }
    }
  })

  return changes
}

/**
 * 의존성 식별
 */
function identifyDependencies(analysis) {
  const dependencies = []

  // 도메인간 의존성
  if (analysis.domains.includes('ui') && analysis.domains.includes('api')) {
    dependencies.push({
      type: 'sequential',
      description: 'API 구현 후 UI 연동'
    })
  }

  if (analysis.domains.includes('auth') && analysis.domains.includes('database')) {
    dependencies.push({
      type: 'parallel',
      description: '인증과 데이터베이스는 병렬 진행 가능'
    })
  }

  return dependencies
}

/**
 * 타임라인 생성
 */
function generateTimeline(analysis) {
  const totalDays = analysis.estimatedDays
  const phases = []

  if (totalDays <= 1) {
    phases.push({
      phase: 1,
      name: '구현 및 테스트',
      duration: 1,
      activities: ['설계', '구현', '테스트', '배포']
    })
  } else if (totalDays <= 3) {
    phases.push(
      {
        phase: 1,
        name: '분석 및 설계',
        duration: 1,
        activities: ['요구사항 분석', '아키텍처 설계']
      },
      {
        phase: 2,
        name: '구현',
        duration: totalDays - 1,
        activities: ['핵심 기능 구현', '통합']
      },
      {
        phase: 3,
        name: '테스트 및 배포',
        duration: 1,
        activities: ['테스트', '문서화', '배포']
      }
    )
  } else {
    phases.push(
      {
        phase: 1,
        name: '설계',
        duration: Math.ceil(totalDays * 0.2),
        activities: ['요구사항 분석', '상세 설계']
      },
      {
        phase: 2,
        name: '구현',
        duration: Math.ceil(totalDays * 0.6),
        activities: ['핵심 기능 구현', '단위 테스트']
      },
      {
        phase: 3,
        name: '통합 및 테스트',
        duration: Math.ceil(totalDays * 0.15),
        activities: ['통합 테스트', '성능 최적화']
      },
      {
        phase: 4,
        name: '배포',
        duration: Math.ceil(totalDays * 0.05),
        activities: ['배포 준비', '문서화']
      }
    )
  }

  return {
    totalDays,
    phases,
    milestones: phases.map(p => `Phase ${p.phase}: ${p.name}`)
  }
}

/**
 * 리스크 식별
 */
function identifyRisks(analysis) {
  const risks = []

  if (analysis.complexity === 'high') {
    risks.push({
      level: 'high',
      description: '높은 복잡도로 인한 일정 지연 가능성',
      mitigation: '단계별 검증 및 조기 테스트'
    })
  }

  if (analysis.domains.includes('auth')) {
    risks.push({
      level: 'medium',
      description: '보안 취약점 발생 가능성',
      mitigation: '보안 가이드라인 준수 및 코드 리뷰'
    })
  }

  if (analysis.domains.includes('database')) {
    risks.push({
      level: 'medium',
      description: '데이터 마이그레이션 중 데이터 손실',
      mitigation: '백업 및 롤백 계획 수립'
    })
  }

  return risks
}

/**
 * 플랜을 파일로 저장
 */
function savePlan(plan) {
  const planPath = path.join(PLANS_DIR, `${plan.id}.json`)
  const markdownPath = path.join(PLANS_DIR, `${plan.id}.md`)

  // JSON 형태로 저장
  fs.writeFileSync(planPath, JSON.stringify(plan, null, 2))

  // Markdown 형태로 저장 (읽기 편함)
  const markdown = generatePlanMarkdown(plan)
  fs.writeFileSync(markdownPath, markdown)

  console.log(`📋 플랜 저장 완료:`)
  console.log(`   JSON: ${planPath}`)
  console.log(`   MD: ${markdownPath}`)

  return { planPath, markdownPath }
}

/**
 * 플랜 Markdown 생성
 */
function generatePlanMarkdown(plan) {
  return `# 🎯 개발 플랜: ${plan.id}

## 📝 요청사항
${plan.request}

## 📊 분석 결과
- **타입**: ${plan.analysis.type}
- **복잡도**: ${plan.analysis.complexity}
- **도메인**: ${plan.analysis.domains.join(', ')}
- **예상 소요일**: ${plan.analysis.estimatedDays}일
- **우선순위**: ${plan.analysis.priority}

## ✅ 작업 목록
${plan.tasks.map((task, idx) => `${idx + 1}. **${task.title}** (${task.estimatedHours}시간)`).join('\n')}

## 🛠️ 필요 리소스
- **도구**: ${plan.resources.tools.join(', ')}
- **스킬**: ${plan.resources.requiredSkills.join(', ')}

## 📁 예상 파일 변경
### 새로 생성
${plan.resources.files.new.map(f => `- ${f}`).join('\n') || '없음'}

### 수정 예정
${plan.resources.files.modified.map(f => `- ${f}`).join('\n') || '없음'}

## ⏱️ 타임라인
${plan.timeline.phases.map(phase =>
  `### Phase ${phase.phase}: ${phase.name} (${phase.duration}일)
${phase.activities.map(a => `- ${a}`).join('\n')}`
).join('\n\n')}

## ⚠️ 리스크 및 대응방안
${plan.risks.map(risk =>
  `### ${risk.level.toUpperCase()} - ${risk.description}
**대응방안**: ${risk.mitigation}`
).join('\n\n')}

## 🔗 의존성
${plan.dependencies.map(dep => `- **${dep.type}**: ${dep.description}`).join('\n') || '없음'}

---
**생성일**: ${plan.timestamp}
**상태**: ${plan.status}
**버전**: ${plan.version}
`
}

/**
 * 사용자 승인 요청
 */
async function requestApproval(plan) {
  const { createRequire } = await import('module')
  const require = createRequire(import.meta.url)

  return new Promise((resolve) => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    })

    console.log(`\n📋 ${plan.id} 플랜이 생성되었습니다.`)
    console.log(`📊 복잡도: ${plan.analysis.complexity}, 예상 소요일: ${plan.analysis.estimatedDays}일`)
    console.log(`🎯 작업 수: ${plan.tasks.length}개`)
    console.log(`\n승인하시겠습니까? 승인 시 플랜이 저장되고 실행됩니다.`)

    readline.question('(y/N): ', (answer) => {
      readline.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  })
}

/**
 * 플랜 실행
 */
async function executePlan(plan) {
  console.log(`🚀 ${plan.id} 플랜 실행 시작...`)

  // 플랜 상태 업데이트
  plan.status = 'executing'
  plan.executionStarted = new Date().toISOString()

  // 플랜 저장
  const { planPath, markdownPath } = savePlan(plan)

  // GitHub 이슈 생성
  try {
    const issueTitle = `📋 개발 플랜: ${plan.id}`
    const issueBody = generatePlanMarkdown(plan)

    await createGitHubIssue(issueTitle, issueBody, [
      'plan',
      plan.analysis.complexity,
      plan.analysis.priority,
      ...plan.analysis.domains
    ])

    console.log('✅ GitHub 이슈 생성 완료')
  } catch (error) {
    console.error('❌ GitHub 이슈 생성 실패:', error.message)
  }

  // 커밋
  try {
    const commitMessage = `feat: 개발 플랜 생성 - ${plan.id}`
    commitAndPush(commitMessage)
    console.log('✅ 플랜 커밋 완료')
  } catch (error) {
    console.error('❌ 커밋 실패:', error.message)
  }

  return { planPath, markdownPath }
}

/**
 * 저장된 플랜 목록 조회
 */
function listPlans() {
  if (!fs.existsSync(PLANS_DIR)) {
    return []
  }

  const planFiles = fs.readdirSync(PLANS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const planPath = path.join(PLANS_DIR, f)
      const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'))
      return {
        id: plan.id,
        status: plan.status,
        complexity: plan.analysis.complexity,
        estimatedDays: plan.analysis.estimatedDays,
        timestamp: plan.timestamp,
        path: planPath
      }
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  return planFiles
}

/**
 * 특정 플랜 로드
 */
function loadPlan(planId) {
  const planPath = path.join(PLANS_DIR, `${planId}.json`)

  if (!fs.existsSync(planPath)) {
    throw new Error(`플랜을 찾을 수 없습니다: ${planId}`)
  }

  return JSON.parse(fs.readFileSync(planPath, 'utf8'))
}

/**
 * 메인 실행 함수
 */
async function main(request) {
  console.log('🎯 플랜 관리 시스템 시작\n')

  try {
    if (!request) {
      // 인터랙티브 모드
      const { createRequire } = await import('module')
      const require = createRequire(import.meta.url)
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      })

      return new Promise((resolve) => {
        readline.question('개발 요청사항을 입력하세요: ', async (userRequest) => {
          readline.close()
          await processRequest(userRequest)
          resolve()
        })
      })
    } else {
      await processRequest(request)
    }
  } catch (error) {
    console.error('\n❌ 플랜 처리 중 오류 발생:', error.message)
    process.exit(1)
  }
}

/**
 * 요청 처리
 */
async function processRequest(request) {
  console.log(`📝 요청사항: ${request}\n`)

  // 1. 플랜 생성
  console.log('🧠 플랜 생성 중...')
  const plan = generatePlan(request)

  // 2. 사용자 승인 요청
  const approved = await requestApproval(plan)

  if (approved) {
    // 3. 플랜 실행
    const result = await executePlan(plan)
    console.log(`\n✅ 플랜 실행 완료`)
    console.log(`📁 플랜 파일: ${result.markdownPath}`)
  } else {
    console.log('\n🚫 플랜이 취소되었습니다.')
  }
}

// CLI에서 직접 실행된 경우
if (import.meta.url === `file://${process.argv[1]}`) {
  const request = process.argv[2]
  main(request)
}

export {
  generatePlan,
  savePlan,
  executePlan,
  requestApproval,
  listPlans,
  loadPlan,
  main
}