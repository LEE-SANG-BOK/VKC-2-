#!/usr/bin/env node

/**
 * 컨텍스트 보존 시스템
 * - 세션간 작업 내용 저장/복원
 * - 진행 상황 파일 기반 추적
 * - 컨텍스트 한계 보완
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const CONTEXTS_DIR = path.join(PROJECT_ROOT, 'contexts')
const SESSIONS_DIR = path.join(CONTEXTS_DIR, 'sessions')
const PROGRESS_DIR = path.join(CONTEXTS_DIR, 'progress')
const PLANS_DIR = path.join(PROJECT_ROOT, 'plans')

// 디렉토리 생성
const dirsToCreate = [CONTEXTS_DIR, SESSIONS_DIR, PROGRESS_DIR]
dirsToCreate.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

/**
 * 세션 컨텍스트 저장
 */
function saveSessionContext(sessionId, context) {
  const timestamp = new Date().toISOString()
  const sessionData = {
    sessionId,
    timestamp,
    ...context,
    version: '1.0'
  }

  const sessionPath = path.join(SESSIONS_DIR, `${sessionId}.json`)
  fs.writeFileSync(sessionPath, JSON.stringify(sessionData, null, 2))

  // 최근 세션 추적
  updateRecentSession(sessionId)

  console.log(`💾 세션 컨텍스트 저장: ${sessionPath}`)
  return sessionPath
}

/**
 * 세션 컨텍스트 로드
 */
function loadSessionContext(sessionId) {
  const sessionPath = path.join(SESSIONS_DIR, `${sessionId}.json`)

  if (!fs.existsSync(sessionPath)) {
    throw new Error(`세션을 찾을 수 없습니다: ${sessionId}`)
  }

  const sessionData = JSON.parse(fs.readFileSync(sessionPath, 'utf8'))
  console.log(`📖 세션 컨텍스트 로드: ${sessionId}`)

  return sessionData
}

/**
 * 최근 세션 업데이트
 */
function updateRecentSession(sessionId) {
  const recentSessionPath = path.join(CONTEXTS_DIR, 'recent-session.txt')
  fs.writeFileSync(recentSessionPath, sessionId)
}

/**
 * 최근 세션 가져오기
 */
function getRecentSession() {
  const recentSessionPath = path.join(CONTEXTS_DIR, 'recent-session.txt')

  if (!fs.existsSync(recentSessionPath)) {
    return null
  }

  return fs.readFileSync(recentSessionPath, 'utf8').trim()
}

/**
 * 진행 상황 저장
 */
function saveProgress(planId, progressData) {
  const timestamp = new Date().toISOString()
  const progress = {
    planId,
    timestamp,
    ...progressData,
    version: '1.0'
  }

  const progressPath = path.join(PROGRESS_DIR, `${planId}-progress.json`)
  fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2))

  // 진행 상황 요약 업데이트
  updateProgressSummary(planId, progress)

  console.log(`📊 진행 상황 저장: ${progressPath}`)
  return progressPath
}

/**
 * 진행 상황 로드
 */
function loadProgress(planId) {
  const progressPath = path.join(PROGRESS_DIR, `${planId}-progress.json`)

  if (!fs.existsSync(progressPath)) {
    console.log(`⚠️ 진행 상황 파일 없음: ${planId}`)
    return null
  }

  const progressData = JSON.parse(fs.readFileSync(progressPath, 'utf8'))
  console.log(`📊 진행 상황 로드: ${planId}`)

  return progressData
}

/**
 * 진행 상황 요약 업데이트
 */
function updateProgressSummary(planId, progress) {
  const summaryPath = path.join(CONTEXTS_DIR, 'progress-summary.json')
  let summary = {}

  if (fs.existsSync(summaryPath)) {
    summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
  }

  summary[planId] = {
    status: progress.status || 'in_progress',
    completedTasks: progress.completedTasks || 0,
    totalTasks: progress.totalTasks || 0,
    lastUpdate: progress.timestamp,
    estimatedCompletion: progress.estimatedCompletion
  }

  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
}

/**
 * 컨텍스트 생성 (새 작업 시작 시)
 */
function createContext(request, planId = null) {
  const sessionId = `session-${Date.now()}`
  const timestamp = new Date().toISOString()

  const context = {
    request,
    planId,
    startTime: timestamp,
    currentPhase: 'analysis',
    completedSteps: [],
    nextSteps: [],
    notes: [],
    fileChanges: {
      created: [],
      modified: [],
      deleted: []
    },
    codebaseSnapshot: captureCodebaseSnapshot(),
    environment: {
      branch: getCurrentBranch(),
      commitHash: getCurrentCommit(),
      workingDirectory: process.cwd()
    }
  }

  saveSessionContext(sessionId, context)
  return { sessionId, context }
}

/**
 * 컨텍스트 업데이트
 */
function updateContext(sessionId, updates) {
  const context = loadSessionContext(sessionId)

  // 업데이트 적용
  Object.assign(context, updates)
  context.lastUpdate = new Date().toISOString()

  // 변경 내역 추가
  if (updates.completedStep) {
    context.completedSteps.push({
      step: updates.completedStep,
      timestamp: context.lastUpdate
    })
  }

  if (updates.note) {
    context.notes.push({
      note: updates.note,
      timestamp: context.lastUpdate
    })
  }

  if (updates.fileChange) {
    const { type, file } = updates.fileChange
    if (context.fileChanges[type] && !context.fileChanges[type].includes(file)) {
      context.fileChanges[type].push(file)
    }
  }

  saveSessionContext(sessionId, context)
  return context
}

/**
 * 코드베이스 스냅샷 캡처
 */
function captureCodebaseSnapshot() {
  try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' }).trim()
    const gitBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim()
    const gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()

    return {
      branch: gitBranch,
      commit: gitCommit.substring(0, 8),
      uncommittedChanges: gitStatus.split('\n').filter(line => line.trim()),
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    return {
      error: 'Git 정보를 가져올 수 없음',
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * 현재 브랜치 가져오기
 */
function getCurrentBranch() {
  try {
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim()
  } catch (error) {
    return 'unknown'
  }
}

/**
 * 현재 커밋 해시 가져오기
 */
function getCurrentCommit() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().substring(0, 8)
  } catch (error) {
    return 'unknown'
  }
}

/**
 * 세션 재개
 */
function resumeSession(sessionId = null) {
  const targetSessionId = sessionId || getRecentSession()

  if (!targetSessionId) {
    console.log('📝 재개할 세션이 없습니다. 새 세션을 시작하세요.')
    return null
  }

  try {
    const context = loadSessionContext(targetSessionId)

    console.log(`🔄 세션 재개: ${targetSessionId}`)
    console.log(`📝 요청사항: ${context.request}`)
    console.log(`📊 진행 상황: ${context.completedSteps.length}개 단계 완료`)
    console.log(`🔗 플랜 ID: ${context.planId || '없음'}`)

    // 플랜과 연결된 진행 상황 로드
    if (context.planId) {
      const progress = loadProgress(context.planId)
      if (progress) {
        console.log(`📈 플랜 진행률: ${progress.completedTasks || 0}/${progress.totalTasks || 0} 작업`)
      }
    }

    return context
  } catch (error) {
    console.error(`❌ 세션 재개 실패: ${error.message}`)
    return null
  }
}

/**
 * 컨텍스트 요약 생성
 */
function generateContextSummary(sessionId) {
  const context = loadSessionContext(sessionId)

  const summary = `# 📋 세션 컨텍스트 요약: ${sessionId}

## 📝 요청사항
${context.request}

## 🎯 연결된 플랜
${context.planId ? `\`${context.planId}\`` : '없음'}

## 📊 진행 상황
- **현재 단계**: ${context.currentPhase}
- **완료된 단계**: ${context.completedSteps.length}개
- **다음 단계**: ${context.nextSteps.length}개

## ✅ 완료된 작업
${context.completedSteps.map((step, idx) =>
  `${idx + 1}. ${step.step} (${new Date(step.timestamp).toLocaleString('ko-KR')})`
).join('\n') || '없음'}

## 📁 파일 변경 내역
### 생성된 파일
${context.fileChanges.created.map(f => `- ${f}`).join('\n') || '없음'}

### 수정된 파일
${context.fileChanges.modified.map(f => `- ${f}`).join('\n') || '없음'}

### 삭제된 파일
${context.fileChanges.deleted.map(f => `- ${f}`).join('\n') || '없음'}

## 📝 노트
${context.notes.map((note, idx) =>
  `${idx + 1}. ${note.note} (${new Date(note.timestamp).toLocaleString('ko-KR')})`
).join('\n') || '없음'}

## 🌿 환경 정보
- **브랜치**: ${context.environment.branch}
- **커밋**: ${context.environment.commitHash}
- **작업 디렉토리**: ${context.environment.workingDirectory}

---
**세션 시작**: ${new Date(context.startTime).toLocaleString('ko-KR')}
**마지막 업데이트**: ${new Date(context.lastUpdate || context.timestamp).toLocaleString('ko-KR')}
`

  const summaryPath = path.join(CONTEXTS_DIR, `${sessionId}-summary.md`)
  fs.writeFileSync(summaryPath, summary)

  console.log(`📋 컨텍스트 요약 생성: ${summaryPath}`)
  return summaryPath
}

/**
 * 세션 목록 조회
 */
function listSessions() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    return []
  }

  const sessionFiles = fs.readdirSync(SESSIONS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const sessionPath = path.join(SESSIONS_DIR, f)
      const session = JSON.parse(fs.readFileSync(sessionPath, 'utf8'))
      return {
        sessionId: session.sessionId,
        request: session.request,
        planId: session.planId,
        currentPhase: session.currentPhase,
        completedSteps: session.completedSteps?.length || 0,
        startTime: session.startTime || session.timestamp,
        lastUpdate: session.lastUpdate || session.timestamp
      }
    })
    .sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate))

  return sessionFiles
}

/**
 * 진행 상황 대시보드 생성
 */
function generateProgressDashboard() {
  const sessions = listSessions()
  const summaryPath = path.join(CONTEXTS_DIR, 'progress-summary.json')
  let progressSummary = {}

  if (fs.existsSync(summaryPath)) {
    progressSummary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
  }

  const dashboard = `# 📊 프로젝트 진행 상황 대시보드

## 📈 전체 현황
- **활성 세션**: ${sessions.length}개
- **진행 중인 플랜**: ${Object.keys(progressSummary).length}개
- **마지막 업데이트**: ${new Date().toLocaleString('ko-KR')}

## 🔄 최근 세션들
${sessions.slice(0, 5).map(session => `
### ${session.sessionId}
- **요청**: ${session.request}
- **플랜**: ${session.planId || '없음'}
- **단계**: ${session.currentPhase}
- **완료**: ${session.completedSteps}개 단계
- **업데이트**: ${new Date(session.lastUpdate).toLocaleString('ko-KR')}
`).join('\n')}

## 📋 플랜별 진행률
${Object.entries(progressSummary).map(([planId, progress]) => `
### ${planId}
- **상태**: ${progress.status}
- **진행률**: ${progress.completedTasks}/${progress.totalTasks} (${Math.round(progress.completedTasks / progress.totalTasks * 100)}%)
- **업데이트**: ${new Date(progress.lastUpdate).toLocaleString('ko-KR')}
`).join('\n')}

## 🔄 세션 재개 방법
\`\`\`bash
# 최근 세션 재개
node scripts/context-manager.js resume

# 특정 세션 재개
node scripts/context-manager.js resume [SESSION_ID]

# 세션 목록 보기
node scripts/context-manager.js list
\`\`\`

---
**생성 시간**: ${new Date().toLocaleString('ko-KR')}
`

  const dashboardPath = path.join(CONTEXTS_DIR, 'progress-dashboard.md')
  fs.writeFileSync(dashboardPath, dashboard)

  console.log(`📊 진행 상황 대시보드 생성: ${dashboardPath}`)
  return dashboardPath
}

/**
 * 컨텍스트 정리 (오래된 세션 삭제)
 */
function cleanupContexts(daysToKeep = 30) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  let cleaned = 0

  // 세션 정리
  if (fs.existsSync(SESSIONS_DIR)) {
    const sessionFiles = fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.json'))

    sessionFiles.forEach(file => {
      const filePath = path.join(SESSIONS_DIR, file)
      const stats = fs.statSync(filePath)

      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath)
        cleaned++
      }
    })
  }

  // 진행 상황 정리
  if (fs.existsSync(PROGRESS_DIR)) {
    const progressFiles = fs.readdirSync(PROGRESS_DIR).filter(f => f.endsWith('.json'))

    progressFiles.forEach(file => {
      const filePath = path.join(PROGRESS_DIR, file)
      const stats = fs.statSync(filePath)

      if (stats.mtime < cutoffDate) {
        fs.unlinkSync(filePath)
        cleaned++
      }
    })
  }

  console.log(`🧹 ${cleaned}개의 오래된 컨텍스트 파일 정리 완료`)
  return cleaned
}

/**
 * 메인 실행 함수
 */
async function main() {
  const command = process.argv[2]
  const arg = process.argv[3]

  console.log('🔧 컨텍스트 관리 시스템\n')

  try {
    switch (command) {
      case 'create':
        if (!arg) {
          console.error('❌ 요청사항을 입력하세요: node context-manager.js create "요청사항"')
          process.exit(1)
        }
        const { sessionId, context } = createContext(arg)
        console.log(`✅ 새 컨텍스트 생성: ${sessionId}`)
        generateContextSummary(sessionId)
        break

      case 'resume':
        const resumedContext = resumeSession(arg)
        if (resumedContext) {
          generateContextSummary(resumedContext.sessionId)
        }
        break

      case 'list':
        const sessions = listSessions()
        console.log('📋 세션 목록:')
        sessions.forEach(session => {
          console.log(`  ${session.sessionId}: ${session.request.substring(0, 50)}...`)
        })
        break

      case 'dashboard':
        generateProgressDashboard()
        break

      case 'cleanup':
        const days = parseInt(arg) || 30
        cleanupContexts(days)
        break

      case 'summary':
        if (!arg) {
          console.error('❌ 세션 ID를 입력하세요: node context-manager.js summary [SESSION_ID]')
          process.exit(1)
        }
        generateContextSummary(arg)
        break

      default:
        console.log(`사용법:
  node context-manager.js create "요청사항"     - 새 컨텍스트 생성
  node context-manager.js resume [SESSION_ID]  - 세션 재개
  node context-manager.js list                 - 세션 목록
  node context-manager.js dashboard            - 진행 상황 대시보드
  node context-manager.js summary SESSION_ID   - 세션 요약
  node context-manager.js cleanup [DAYS]       - 오래된 컨텍스트 정리`)
        break
    }
  } catch (error) {
    console.error('\n❌ 컨텍스트 관리 중 오류 발생:', error.message)
    process.exit(1)
  }
}

// CLI에서 직접 실행된 경우
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export {
  createContext,
  updateContext,
  saveSessionContext,
  loadSessionContext,
  saveProgress,
  loadProgress,
  resumeSession,
  generateContextSummary,
  generateProgressDashboard,
  listSessions,
  cleanupContexts,
  main
}
