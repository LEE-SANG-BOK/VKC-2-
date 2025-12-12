#!/usr/bin/env node

/**
 * 통합 워크플로우 매니저
 * - plan-manager + context-manager + github-auto-issue 통합
 * - 완전한 개발 요청 → 실행 파이프라인
 */

import { generatePlan, executePlan, requestApproval } from './plan-manager.js'
import { createContext, updateContext, saveProgress, generateProgressDashboard } from './context-manager.js'
import { processAgentCompletion, createGitHubIssue } from '../automation/github-auto-issue.js'
import { generateProgressDashboard as generateAgentDashboard } from '../automation/parallel-agent-manager.js'

/**
 * 완전한 개발 워크플로우 실행
 */
async function executeCompleteWorkflow(request) {
  console.log('🚀 통합 개발 워크플로우 시작\n')
  console.log(`📝 요청사항: ${request}\n`)

  let sessionId

  try {
    // 1단계: 컨텍스트 생성
    console.log('📋 1단계: 컨텍스트 생성 중...')
    const contextResult = createContext(request)
    sessionId = contextResult.sessionId

    // 2단계: 플랜 생성
    console.log('🧠 2단계: 플랜 생성 중...')
    const plan = generatePlan(request, `plan-${sessionId}`)

    // 컨텍스트와 플랜 연결
    updateContext(sessionId, {
      planId: plan.id,
      currentPhase: 'plan_review',
      note: '플랜 생성 완료, 사용자 승인 대기'
    })

    // 3단계: 사용자 승인
    console.log('🤝 3단계: 사용자 승인 요청...')
    const approved = await requestApproval(plan)

    if (!approved) {
      updateContext(sessionId, {
        currentPhase: 'cancelled',
        note: '사용자가 플랜을 거부함'
      })
      console.log('🚫 워크플로우가 취소되었습니다.')
      return { sessionId, status: 'cancelled' }
    }

    // 4단계: 플랜 실행 및 진행 상황 추적
    console.log('⚡ 4단계: 플랜 실행 시작...')
    updateContext(sessionId, {
      currentPhase: 'executing',
      completedStep: '플랜 승인 완료',
      note: '플랜 실행 시작'
    })

    const result = await executePlan(plan)

    // 5단계: 진행 상황 저장
    console.log('📊 5단계: 진행 상황 추적 설정...')
    const initialProgress = {
      status: 'in_progress',
      completedTasks: 0,
      totalTasks: plan.tasks.length,
      estimatedCompletion: calculateEstimatedCompletion(plan),
      milestones: plan.timeline.milestones,
      currentMilestone: 0
    }

    saveProgress(plan.id, initialProgress)

    // 6단계: Agent 시스템과 연동
    console.log('🤖 6단계: Agent 시스템 연동...')
    await linkWithAgentSystem(plan, sessionId)

    // 7단계: 대시보드 업데이트
    console.log('📈 7단계: 대시보드 업데이트...')
    generateProgressDashboard()
    generateAgentDashboard()

    // 최종 컨텍스트 업데이트
    updateContext(sessionId, {
      currentPhase: 'monitoring',
      completedStep: '워크플로우 설정 완료',
      note: `플랜 ${plan.id} 실행 중, 진행 상황 모니터링 시작`
    })

    console.log('\n✅ 통합 워크플로우 설정 완료!')
    console.log(`📋 세션 ID: ${sessionId}`)
    console.log(`🎯 플랜 ID: ${plan.id}`)
    console.log(`📁 플랜 파일: ${result.markdownPath}`)

    return {
      sessionId,
      planId: plan.id,
      status: 'executing',
      result
    }

  } catch (error) {
    console.error('\n❌ 워크플로우 실행 중 오류:', error.message)

    // 오류 컨텍스트 저장
    if (sessionId) {
      updateContext(sessionId, {
        currentPhase: 'error',
        note: `오류 발생: ${error.message}`
      })
    }

    throw error
  }
}

/**
 * 예상 완료 시간 계산
 */
function calculateEstimatedCompletion(plan) {
  const startDate = new Date()
  const estimatedDays = plan.analysis.estimatedDays
  const completionDate = new Date(startDate)
  completionDate.setDate(completionDate.getDate() + estimatedDays)

  return completionDate.toISOString()
}

/**
 * Agent 시스템과 연동
 */
async function linkWithAgentSystem(plan, sessionId) {
  // 플랜의 도메인에 따라 관련 Agent 식별
  const relevantAgents = identifyRelevantAgents(plan.analysis.domains)

  // 각 관련 Agent에 대해 이슈 생성
  for (const agentId of relevantAgents) {
    try {
      const issueTitle = `🔗 ${plan.id} 연동: ${agentId} 작업 요청`
      const issueBody = generateAgentLinkIssue(plan, agentId, sessionId)

      await createGitHubIssue(issueTitle, issueBody, [
        'agent-link',
        'plan-integration',
        agentId,
        plan.analysis.priority
      ])

      console.log(`✅ ${agentId} 연동 이슈 생성 완료`)

    } catch (error) {
      console.error(`❌ ${agentId} 연동 이슈 생성 실패:`, error.message)
    }
  }
}

/**
 * 관련 Agent 식별
 */
function identifyRelevantAgents(domains) {
  const agentMap = {
    ui: ['agent-8'],
    api: ['agent-7'],
    auth: ['agent-5', 'agent-6'],
    database: ['agent-3', 'agent-4'],
    testing: ['agent-1'],
    deployment: ['agent-2', 'agent-3']
  }

  const agents = new Set()
  domains.forEach(domain => {
    if (agentMap[domain]) {
      agentMap[domain].forEach(agent => agents.add(agent))
    }
  })

  return Array.from(agents)
}

/**
 * Agent 연동 이슈 생성
 */
function generateAgentLinkIssue(plan, agentId, sessionId) {
  return `## 🔗 플랜 연동 요청

### 📋 플랜 정보
- **플랜 ID**: \`${plan.id}\`
- **세션 ID**: \`${sessionId}\`
- **요청사항**: ${plan.request}
- **우선순위**: ${plan.analysis.priority}
- **예상 소요일**: ${plan.analysis.estimatedDays}일

### 🎯 ${agentId} 관련 작업
${plan.tasks
  .filter(task => isTaskRelevantToAgent(task, agentId))
  .map(task => `- [ ] ${task.title}`)
  .join('\n') || '관련 작업 없음'}

### 📊 진행 상황
- **현재 상태**: 플랜 실행 시작
- **예상 완료**: ${plan.timeline.phases[0]?.name || 'Phase 1'}

### 🔄 연동 방법
1. 이 이슈를 ${agentId} 작업에 링크
2. 관련 작업 완료 시 이슈에 진행 상황 업데이트
3. 완료 시 \`closes #[이슈번호]\` 커밋 메시지 사용

### 📁 관련 파일
${plan.resources.files.new.concat(plan.resources.files.modified)
  .map(f => `- \`${f}\``)
  .join('\n') || '파일 정보 없음'}

---
**자동 생성**: 통합 워크플로우 시스템
**생성 시간**: ${new Date().toLocaleString('ko-KR')}
`
}

/**
 * 작업이 특정 Agent와 관련 있는지 확인
 */
function isTaskRelevantToAgent(task, agentId) {
  const agentKeywords = {
    'agent-1': ['자동화', '모니터링', '관리', 'github'],
    'agent-2': ['next.js', '빌드', '최적화', '타입스크립트'],
    'agent-3': ['supabase', '환경', '설정', '백업'],
    'agent-4': ['데이터베이스', '스키마', '성능', '쿼리'],
    'agent-5': ['oauth', '인증', 'jwt', '보안'],
    'agent-6': ['소셜', '로그인', '프로필', '사용자'],
    'agent-7': ['api', 'crud', '실시간', '검색'],
    'agent-8': ['ui', '컴포넌트', '테마', '디자인']
  }

  const keywords = agentKeywords[agentId] || []
  const taskTitle = task.title.toLowerCase()

  return keywords.some(keyword => taskTitle.includes(keyword.toLowerCase()))
}

/**
 * 진행 상황 모니터링 시작
 */
async function startProgressMonitoring(planId, sessionId) {
  console.log(`🔍 ${planId} 진행 상황 모니터링 시작...`)

  // Agent 완료 상황 체크
  await processAgentCompletion()

  // 진행률 업데이트
  const progress = loadProgress(planId)
  if (progress) {
    // 실제 진행률 계산 로직
    const updatedProgress = await calculateActualProgress(planId)
    saveProgress(planId, updatedProgress)

    // 컨텍스트 업데이트
    updateContext(sessionId, {
      note: `진행률 업데이트: ${updatedProgress.completedTasks}/${updatedProgress.totalTasks}`
    })
  }
}

/**
 * 실제 진행률 계산
 */
async function calculateActualProgress(planId) {
  // GitHub 이슈, 커밋, 파일 변경 등을 기반으로 실제 진행률 계산
  // 현재는 기본 구현

  return {
    status: 'in_progress',
    completedTasks: 2, // 실제 계산 로직 필요
    totalTasks: 10,
    lastUpdate: new Date().toISOString()
  }
}

/**
 * 워크플로우 상태 확인
 */
function checkWorkflowStatus(sessionId) {
  try {
    const context = loadSessionContext(sessionId)
    const progress = context.planId ? loadProgress(context.planId) : null

    console.log(`📊 워크플로우 상태: ${sessionId}`)
    console.log(`📝 요청: ${context.request}`)
    console.log(`🎯 플랜: ${context.planId || '없음'}`)
    console.log(`📈 단계: ${context.currentPhase}`)
    console.log(`✅ 완료: ${context.completedSteps.length}개 단계`)

    if (progress) {
      console.log(`📊 진행률: ${progress.completedTasks}/${progress.totalTasks} (${Math.round(progress.completedTasks / progress.totalTasks * 100)}%)`)
    }

    return { context, progress }
  } catch (error) {
    console.error(`❌ 워크플로우 상태 확인 실패: ${error.message}`)
    return null
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  const command = process.argv[2]
  const arg = process.argv[3]

  console.log('🔧 통합 워크플로우 매니저\n')

  try {
    switch (command) {
      case 'execute':
        if (!arg) {
          console.error('❌ 요청사항을 입력하세요: node workflow-manager.js execute "요청사항"')
          process.exit(1)
        }
        await executeCompleteWorkflow(arg)
        break

      case 'monitor':
        if (!arg) {
          console.error('❌ 세션 ID를 입력하세요: node workflow-manager.js monitor [SESSION_ID]')
          process.exit(1)
        }
        await startProgressMonitoring(arg)
        break

      case 'status':
        if (!arg) {
          console.error('❌ 세션 ID를 입력하세요: node workflow-manager.js status [SESSION_ID]')
          process.exit(1)
        }
        checkWorkflowStatus(arg)
        break

      case 'dashboard':
        generateProgressDashboard()
        generateAgentDashboard()
        console.log('📊 통합 대시보드 업데이트 완료')
        break

      default:
        console.log(`사용법:
  node workflow-manager.js execute "요청사항"    - 완전한 워크플로우 실행
  node workflow-manager.js monitor PLAN_ID      - 진행 상황 모니터링
  node workflow-manager.js status SESSION_ID    - 워크플로우 상태 확인
  node workflow-manager.js dashboard            - 통합 대시보드 업데이트`)
        break
    }
  } catch (error) {
    console.error('\n❌ 워크플로우 관리 중 오류 발생:', error.message)
    process.exit(1)
  }
}

// CLI에서 직접 실행된 경우
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export {
  executeCompleteWorkflow,
  linkWithAgentSystem,
  startProgressMonitoring,
  checkWorkflowStatus,
  main
}
