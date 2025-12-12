#!/usr/bin/env node

/**
 * 8개 Agent 병렬 작업 관리 시스템
 * - 독립적 업무 영역 배치
 * - 의존성 관리
 * - 진행률 모니터링
 * - 자동 이슈 생성
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { createGitHubIssue, commitAndPush } from './github-auto-issue.js'

// 환경 변수 확인
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.VITE_GITHUB_TOKEN
const REPO_OWNER = 'leesangbok1'
const REPO_NAME = 'vkc'

if (!GITHUB_TOKEN) {
  console.warn('⚠️ GITHUB_TOKEN 환경 변수가 설정되지 않음 (GitHub 기능 비활성화)')
}

/**
 * 8개 Agent 병렬 작업 정의
 */
const AGENT_TASKS = {
  'agent-1': {
    title: 'Agent 1: 프로젝트 매니저 & 자동화',
    priority: '🔴 긴급',
    dependencies: [],
    estimatedDays: 1,
    branch: 'feature/agent-1-automation',
    tasks: [
      'GitHub 자동 이슈 시스템 최적화',
      '8개 에이전트 작업 진행률 모니터링 대시보드',
      '일일 진행 보고서 자동 생성',
      '브랜치 관리 및 PR 자동화'
    ],
    files: [
      'scripts/parallel-agent-manager.js',
      'scripts/github-auto-issue.js',
      'docs/agents/agent-1-github-issues.md'
    ]
  },
  'agent-2': {
    title: 'Agent 2: Next.js 15 최적화 & 빌드',
    priority: '🟡 일반',
    dependencies: [],
    estimatedDays: 2,
    branch: 'feature/agent-2-nextjs-optimization',
    tasks: [
      'Next.js 15 앱 라우터 최적화',
      '타입스크립트 설정 완성',
      '빌드 시스템 개선',
      '퍼포먼스 최적화 (Code splitting, Lazy loading)'
    ],
    files: [
      'next.config.js',
      'tsconfig.json',
      'app/layout.tsx',
      'docs/agents/agent-2-nextjs-structure.md'
    ]
  },
  'agent-3': {
    title: 'Agent 3: Supabase 운영 환경 구축',
    priority: '🟡 일반',
    dependencies: [],
    estimatedDays: 2,
    branch: 'feature/agent-3-supabase-production',
    tasks: [
      'Supabase 프로덕션 환경 설정',
      'RLS 정책 최적화',
      '백업 및 모니터링 시스템',
      '환경 변수 관리 시스템'
    ],
    files: [
      'lib/supabase.ts',
      'supabase/migrations/',
      'docs/agents/agent-3-supabase-setup.md'
    ]
  },
  'agent-4': {
    title: 'Agent 4: 데이터베이스 운영 최적화',
    priority: '🟡 일반',
    dependencies: ['agent-3'],
    estimatedDays: 2,
    branch: 'feature/agent-4-database-optimization',
    tasks: [
      'Mock 데이터 생성 시스템 완성',
      '데이터베이스 성능 최적화',
      '인덱스 전략 및 쿼리 최적화',
      '베트남 사용자 데이터 시드 완성'
    ],
    files: [
      'scripts/db/generate-mock-data.ts',
      'scripts/db/seed.sql',
      'docs/agents/agent-4-database-schema.md'
    ]
  },
  'agent-5': {
    title: 'Agent 5: OAuth 인증 시스템 완성',
    priority: '🔴 긴급',
    dependencies: [],
    estimatedDays: 3,
    branch: 'feature/agent-5-oauth-authentication',
    tasks: [
      'Google, Facebook, Kakao OAuth 실제 연동',
      'JWT 토큰 관리 시스템',
      '사용자 세션 관리',
      '보안 정책 구현'
    ],
    files: [
      'contexts/AuthContext.tsx',
      'lib/auth/',
      'docs/agents/agent-5-auth-system.md'
    ]
  },
  'agent-6': {
    title: 'Agent 6: 소셜 로그인 & 프로필',
    priority: '🟡 일반',
    dependencies: ['agent-5'],
    estimatedDays: 2,
    branch: 'feature/agent-6-social-profile',
    tasks: [
      '소셜 로그인 UI/UX 완성',
      '사용자 프로필 시스템',
      '베트남 사용자 특화 정보 수집',
      '신뢰도 시스템 연동'
    ],
    files: [
      'components/auth/',
      'app/profile/',
      'docs/agents/agent-6-social-login.md'
    ]
  },
  'agent-7': {
    title: 'Agent 7: CRUD API & 실시간 시스템',
    priority: '🔴 긴급',
    dependencies: [],
    estimatedDays: 3,
    branch: 'feature/agent-7-api-realtime',
    tasks: [
      '질문/답변 CRUD API 완성',
      'AI 전문가 매칭 API 통합',
      '실시간 알림 시스템 (Firebase)',
      '검색 및 필터링 기능'
    ],
    files: [
      'app/api/questions/',
      'app/api/answers/',
      'src/services/AIService.js',
      'docs/agents/agent-7-crud-api.md'
    ]
  },
  'agent-8': {
    title: 'Agent 8: UI/UX 베트남 테마 완성',
    priority: '🔴 긴급',
    dependencies: [],
    estimatedDays: 3,
    branch: 'feature/agent-8-vietnamese-theme',
    tasks: [
      'QuestionCard 컴포넌트 베트남 테마 적용',
      'Trust Badge 시각화 시스템',
      '베트남 국기 컬러 시스템 (EA4335, FFCD00)',
      'shadcn/ui 컴포넌트 커스터마이징'
    ],
    files: [
      'components/questions/QuestionCard.tsx',
      'components/ui/',
      'docs/create-designs.md',
      'docs/agents/agent-8-ui-components.md'
    ]
  }
}

/**
 * 현재 작업 상태 체크
 */
function checkCurrentWorkStatus() {
  const status = {
    totalTasks: Object.keys(AGENT_TASKS).length,
    completed: 0,
    inProgress: 0,
    pending: 0,
    blocked: 0,
    details: {}
  }

  for (const [agentId, task] of Object.entries(AGENT_TASKS)) {
    const agentFile = `/Users/bk/Desktop/viet-kconnect/docs/agents/${agentId}-*.md`
    const files = execSync(`ls ${agentFile} 2>/dev/null || echo ""`, { encoding: 'utf8' }).trim().split('\n').filter(f => f)

    let agentStatus = 'pending'

    if (files.length > 0) {
      const content = fs.readFileSync(files[0], 'utf8')

      if (content.includes('✅ 완료') || content.includes('✅ **완료**')) {
        agentStatus = 'completed'
        status.completed++
      } else if (content.includes('🟢') || content.includes('진행 중')) {
        agentStatus = 'inProgress'
        status.inProgress++
      } else if (task.dependencies.length > 0) {
        // 의존성 체크
        const dependenciesReady = task.dependencies.every(depId => {
          const depFile = execSync(`ls /Users/bk/Desktop/viet-kconnect/docs/agents/${depId}-*.md 2>/dev/null || echo ""`, { encoding: 'utf8' }).trim()
          if (depFile) {
            const depContent = fs.readFileSync(depFile.split('\n')[0], 'utf8')
            return depContent.includes('✅ 완료') || depContent.includes('✅ **완료**')
          }
          return false
        })

        if (!dependenciesReady) {
          agentStatus = 'blocked'
          status.blocked++
        } else {
          status.pending++
        }
      } else {
        status.pending++
      }
    } else {
      status.pending++
    }

    status.details[agentId] = {
      ...task,
      status: agentStatus,
      canStart: agentStatus === 'pending' && (task.dependencies.length === 0 ||
        task.dependencies.every(depId => status.details[depId]?.status === 'completed'))
    }
  }

  return status
}

/**
 * 병렬 작업 가능한 Agent 식별
 */
function identifyParallelWorkAgents() {
  const status = checkCurrentWorkStatus()
  const parallelAgents = {
    immediate: [], // 즉시 시작 가능
    week1: [], // 1주차 병렬 작업
    week2: [], // 2주차 의존성 해결 후
    blocked: [] // 의존성으로 인한 대기
  }

  for (const [agentId, details] of Object.entries(status.details)) {
    if (details.status === 'completed') {
      continue
    }

    if (details.dependencies.length === 0) {
      if (details.priority.includes('🔴')) {
        parallelAgents.week1.push(agentId)
      } else {
        parallelAgents.week2.push(agentId)
      }
    } else {
      const dependenciesReady = details.dependencies.every(depId =>
        status.details[depId]?.status === 'completed'
      )

      if (dependenciesReady) {
        parallelAgents.week2.push(agentId)
      } else {
        parallelAgents.blocked.push(agentId)
      }
    }
  }

  return parallelAgents
}

/**
 * Agent별 자동 이슈 생성
 */
async function createParallelWorkIssues() {
  console.log('🚀 8개 Agent 병렬 작업 이슈 생성 시작...\n')

  const parallelAgents = identifyParallelWorkAgents()
  const status = checkCurrentWorkStatus()

  console.log('📊 현재 작업 현황:')
  console.log(`   ✅ 완료: ${status.completed}개`)
  console.log(`   🟢 진행중: ${status.inProgress}개`)
  console.log(`   ⏳ 대기: ${status.pending}개`)
  console.log(`   🔒 차단: ${status.blocked}개`)

  console.log('\n🎯 병렬 작업 계획:')
  console.log(`   Week 1 (긴급): ${parallelAgents.week1.length}개`)
  console.log(`   Week 2 (일반): ${parallelAgents.week2.length}개`)
  console.log(`   차단됨: ${parallelAgents.blocked.length}개`)

  // Week 1 긴급 작업 이슈 생성
  for (const agentId of parallelAgents.week1) {
    const task = AGENT_TASKS[agentId]
    await createAgentIssue(agentId, task, 'Week 1 - 긴급 병렬 작업')
  }

  // Week 2 일반 작업 이슈 생성
  for (const agentId of parallelAgents.week2) {
    const task = AGENT_TASKS[agentId]
    await createAgentIssue(agentId, task, 'Week 2 - 의존성 해결 후')
  }

  console.log('\n✅ 모든 병렬 작업 이슈 생성 완료')
}

/**
 * 개별 Agent 이슈 생성
 */
async function createAgentIssue(agentId, task, phase) {
  const title = `${task.title} [${phase}]`

  const body = `## 🎯 ${task.title}

### 📋 작업 개요
**우선순위**: ${task.priority}
**예상 소요일**: ${task.estimatedDays}일
**브랜치**: \`${task.branch}\`
**단계**: ${phase}

### 🔄 의존성
${task.dependencies.length > 0
  ? task.dependencies.map(dep => `- [ ] ${AGENT_TASKS[dep]?.title || dep}`).join('\n')
  : '- 독립적 작업 (의존성 없음)'
}

### ✅ 주요 작업 목록
${task.tasks.map(t => `- [ ] ${t}`).join('\n')}

### 📁 관련 파일
${task.files.map(f => `- \`${f}\``).join('\n')}

### 🎯 완료 조건
- [ ] 모든 주요 작업 완료
- [ ] 테스트 및 검증 완료
- [ ] 문서화 업데이트
- [ ] 코드 리뷰 통과

### 📊 진행률 체크
- [ ] 25% - 기본 구조 완성
- [ ] 50% - 핵심 기능 구현
- [ ] 75% - 테스트 및 최적화
- [ ] 100% - 완료 및 문서화

---
**${phase} 병렬 작업 계획의 일환**

🤖 자동 생성된 이슈입니다.
Agent ID: \`${agentId}\`
`

  try {
    const labels = [
      'agent-work',
      'parallel-task',
      task.priority.includes('🔴') ? 'urgent' : 'normal',
      phase.includes('Week 1') ? 'week-1' : 'week-2'
    ]

    await createGitHubIssue(title, body, labels)

    // 1초 대기 (API rate limit 방지)
    await new Promise(resolve => setTimeout(resolve, 1000))

  } catch (error) {
    console.error(`❌ ${agentId} 이슈 생성 실패:`, error.message)
  }
}

/**
 * 진행률 모니터링 대시보드 생성
 */
function generateProgressDashboard() {
  const status = checkCurrentWorkStatus()
  const parallelAgents = identifyParallelWorkAgents()

  const dashboard = `# 🎯 Viet K-Connect 8개 Agent 병렬 작업 대시보드

## 📊 전체 진행률
- **전체 Agent**: ${status.totalTasks}개
- **완료**: ${status.completed}개 (${Math.round(status.completed / status.totalTasks * 100)}%)
- **진행중**: ${status.inProgress}개
- **대기**: ${status.pending}개
- **차단**: ${status.blocked}개

## 🚀 병렬 작업 현황

### Week 1 - 긴급 병렬 작업 (독립적)
${parallelAgents.week1.map(id => `- **${id}**: ${AGENT_TASKS[id].title} (${AGENT_TASKS[id].estimatedDays}일)`).join('\n') || '없음'}

### Week 2 - 의존성 해결 후
${parallelAgents.week2.map(id => `- **${id}**: ${AGENT_TASKS[id].title} (${AGENT_TASKS[id].estimatedDays}일)`).join('\n') || '없음'}

### 차단된 작업
${parallelAgents.blocked.map(id => `- **${id}**: ${AGENT_TASKS[id].title} - 의존: ${AGENT_TASKS[id].dependencies.join(', ')}`).join('\n') || '없음'}

## 📈 상세 Agent 상태

${Object.entries(status.details).map(([id, details]) => `
### ${details.title}
- **상태**: ${details.status === 'completed' ? '✅ 완료' : details.status === 'inProgress' ? '🟢 진행중' : details.status === 'blocked' ? '🔒 차단됨' : '⏳ 대기'}
- **우선순위**: ${details.priority}
- **예상 소요일**: ${details.estimatedDays}일
- **의존성**: ${details.dependencies.length > 0 ? details.dependencies.join(', ') : '없음'}
- **시작 가능**: ${details.canStart ? '✅' : '❌'}
`).join('\n')}

---
**최종 업데이트**: ${new Date().toLocaleString('ko-KR')}
**목표**: 2-3주 내 서비스 런칭
`

  const dashboardPath = '/Users/bk/Desktop/viet-kconnect/docs/AGENT_PROGRESS_DASHBOARD.md'
  fs.writeFileSync(dashboardPath, dashboard)

  console.log(`📊 진행률 대시보드 생성: ${dashboardPath}`)
  return dashboard
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🎯 8개 Agent 병렬 작업 관리자 시작\n')

  try {
    // 1. 현재 상태 분석
    console.log('🔍 현재 작업 상태 분석 중...')
    const status = checkCurrentWorkStatus()

    // 2. 진행률 대시보드 생성
    console.log('📊 진행률 대시보드 생성 중...')
    generateProgressDashboard()

    // 3. 병렬 작업 이슈 생성
    console.log('🚀 병렬 작업 이슈 생성 중...')
    await createParallelWorkIssues()

    // 4. 커밋 및 푸시
    console.log('💾 변경사항 커밋 중...')
    const commitMessage = 'feat: 8개 Agent 병렬 작업 시스템 구축 완료'
    commitAndPush(commitMessage)

    console.log('\n✅ 8개 Agent 병렬 작업 시스템 구축 완료!')
    console.log('📋 다음 단계: 각 Agent가 할당받은 브랜치에서 독립적으로 작업 시작')

  } catch (error) {
    console.error('\n❌ 시스템 구축 중 오류 발생:', error.message)
    process.exit(1)
  }
}

// CLI에서 직접 실행된 경우
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export {
  main,
  checkCurrentWorkStatus,
  identifyParallelWorkAgents,
  createParallelWorkIssues,
  generateProgressDashboard,
  AGENT_TASKS
}