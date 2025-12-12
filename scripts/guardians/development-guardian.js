#!/usr/bin/env node

/**
 * 통합 개발 가디언 시스템
 * - 백업 → 개발 → 테스트 → 검증 → 승인 → 커밋 전체 파이프라인
 * - 실패 시 자동 롤백
 * - 실시간 미리보기 링크 제공
 * - 100% 자동화된 안전한 개발 워크플로우
 */

import { spawn, execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { createWorkSnapshot, executeRollback } from '../management/backup-manager.js'
import { runQualityChecks, startQualityMonitoring } from './quality-guardian.js'
import { createContext, updateContext, saveSessionContext } from '../management/context-manager.js'
import { createGitHubIssue } from '../automation/github-auto-issue.js'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)

// 설정
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const DEV_PORT = 3000
const GUARDIAN_DIR = path.join(PROJECT_ROOT, '.guardian')

// 가디언 디렉토리 생성
if (!fs.existsSync(GUARDIAN_DIR)) {
  fs.mkdirSync(GUARDIAN_DIR, { recursive: true })
}

/**
 * 완전 자동화된 개발 워크플로우 시작
 */
async function startDevelopmentGuardian(workDescription) {
  console.log('🛡️ 통합 개발 가디언 시작')
  console.log('=' .repeat(50))
  console.log(`📝 작업: ${workDescription}`)
  console.log('')

  const guardianSession = {
    id: `guardian-${Date.now()}`,
    workDescription,
    startTime: new Date().toISOString(),
    steps: [],
    status: 'running',
    backupId: null,
    sessionId: null,
    previewUrl: null,
    failureReason: null
  }

  try {
    // 1단계: 작업 시작 전 백업
    await executeStep(guardianSession, '백업 생성', async () => {
      console.log('💾 1단계: 작업 시작 전 자동 백업...')
      const backup = await createWorkSnapshot(workDescription, guardianSession.id)
      guardianSession.backupId = backup.snapshotId
      console.log(`✅ 백업 완료: ${backup.snapshotId}`)
    })

    // 2단계: 컨텍스트 생성
    await executeStep(guardianSession, '컨텍스트 생성', async () => {
      console.log('📋 2단계: 작업 컨텍스트 생성...')
      const { sessionId } = createContext(workDescription, guardianSession.id)
      guardianSession.sessionId = sessionId
      console.log(`✅ 컨텍스트 생성 완료: ${sessionId}`)
    })

    // 3단계: 개발 서버 시작 및 미리보기 준비
    await executeStep(guardianSession, '미리보기 서버 시작', async () => {
      console.log('🚀 3단계: 실시간 미리보기 서버 시작...')
      const previewInfo = await startDevelopmentServer()
      guardianSession.previewUrl = previewInfo.url
      console.log(`✅ 미리보기 준비 완료: ${previewInfo.url}`)
    })

    // 4단계: 품질 모니터링 시작
    await executeStep(guardianSession, '품질 모니터링 시작', async () => {
      console.log('🔍 4단계: 실시간 품질 모니터링 시작...')
      await startQualityGuardian(guardianSession)
      console.log('✅ 품질 모니터링 활성화')
    })

    // 5단계: 대화형 개발 모드
    await executeStep(guardianSession, '개발 모드 진입', async () => {
      console.log('⚡ 5단계: 대화형 개발 모드 시작...')
      await enterInteractiveDevelopmentMode(guardianSession)
    })

    guardianSession.status = 'completed'
    guardianSession.endTime = new Date().toISOString()

    console.log('\n🎉 개발 가디언 세션 완료!')
    await saveGuardianSession(guardianSession)

  } catch (error) {
    console.error('\n❌ 개발 가디언 실패:', error.message)
    guardianSession.status = 'failed'
    guardianSession.failureReason = error.message
    guardianSession.endTime = new Date().toISOString()

    // 자동 롤백
    await performEmergencyRollback(guardianSession)

    throw error
  }
}

/**
 * 단계 실행 래퍼
 */
async function executeStep(session, stepName, stepFunction) {
  const stepStart = Date.now()

  try {
    await stepFunction()

    session.steps.push({
      name: stepName,
      status: 'completed',
      duration: Date.now() - stepStart,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    session.steps.push({
      name: stepName,
      status: 'failed',
      duration: Date.now() - stepStart,
      timestamp: new Date().toISOString(),
      error: error.message
    })
    throw error
  }
}

/**
 * 개발 서버 시작
 */
async function startDevelopmentServer() {
  console.log('🚀 개발 서버 시작 중...')

  try {
    // 기존 서버가 실행 중인지 확인
    const isRunning = await checkServerRunning(DEV_PORT)

    if (!isRunning) {
      // 백그라운드에서 개발 서버 시작
      const devProcess = spawn('npm', ['run', 'dev'], {
        cwd: PROJECT_ROOT,
        detached: true,
        stdio: 'ignore'
      })

      // 서버 시작 대기
      await waitForServer(DEV_PORT, 30000)
    }

    // 네트워크 IP 가져오기
    const networkIP = getNetworkIP()

    return {
      url: `http://localhost:${DEV_PORT}`,
      networkUrl: `http://${networkIP}:${DEV_PORT}`,
      port: DEV_PORT,
      status: 'running'
    }

  } catch (error) {
    console.warn(`⚠️ 개발 서버 시작 실패: ${error.message}`)
    return {
      url: `http://localhost:${DEV_PORT}`,
      port: DEV_PORT,
      status: 'failed',
      error: error.message
    }
  }
}

/**
 * 서버 실행 확인
 */
function checkServerRunning(port) {
  return new Promise((resolve) => {
    const { exec } = require('child_process')
    exec(`lsof -i :${port}`, (error, stdout) => {
      resolve(!error && stdout.trim().length > 0)
    })
  })
}

/**
 * 서버 시작 대기
 */
function waitForServer(port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()

    const checkServer = () => {
      const { exec } = require('child_process')
      exec(`curl -s http://localhost:${port} > /dev/null`, (error) => {
        if (!error) {
          resolve(true)
        } else if (Date.now() - startTime > timeout) {
          reject(new Error('서버 시작 시간 초과'))
        } else {
          setTimeout(checkServer, 1000)
        }
      })
    }

    checkServer()
  })
}

/**
 * 네트워크 IP 가져오기
 */
function getNetworkIP() {
  const { networkInterfaces } = require('os')
  const nets = networkInterfaces()

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }

  return 'localhost'
}

/**
 * 품질 가디언 시작
 */
async function startQualityGuardian(guardianSession) {
  // 품질 모니터링을 백그라운드에서 시작
  const qualityWatcher = await startQualityMonitoring()

  // 품질 이슈 발생 시 알림 설정
  qualityWatcher.on('quality-issue', (issue) => {
    console.log(`\n⚠️ 품질 이슈 감지: ${issue.type}`)
    console.log(`📁 파일: ${issue.file}`)
    console.log(`🔍 내용: ${issue.message}`)

    // 컨텍스트 업데이트
    if (guardianSession.sessionId) {
      updateContext(guardianSession.sessionId, {
        note: `품질 이슈 감지: ${issue.type} in ${issue.file}`
      })
    }
  })

  return qualityWatcher
}

/**
 * 대화형 개발 모드
 */
async function enterInteractiveDevelopmentMode(guardianSession) {
  console.log('\n🎯 대화형 개발 모드')
  console.log('=' .repeat(50))
  console.log(`🔗 실시간 미리보기: ${guardianSession.previewUrl}`)
  console.log('📱 모바일에서도 접속 가능합니다!')
  console.log('')
  console.log('💡 이제 파일을 수정하면 자동으로:')
  console.log('   • 품질 검증 실행')
  console.log('   • 테스트 실행')
  console.log('   • 실시간 미리보기 업데이트')
  console.log('')
  console.log('명령어:')
  console.log('   commit  - 커밋 승인 프로세스 시작')
  console.log('   rollback - 시작 시점으로 롤백')
  console.log('   status  - 현재 상태 확인')
  console.log('   quality - 품질 검증 실행')
  console.log('   exit    - 개발 모드 종료')
  console.log('')

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })

  let developmentActive = true

  while (developmentActive) {
    const command = await new Promise(resolve => {
      readline.question('guardian> ', resolve)
    })

    const [cmd, ...args] = command.trim().split(' ')

    try {
      switch (cmd.toLowerCase()) {
        case 'commit':
          await handleCommitRequest(guardianSession, args.join(' '))
          break

        case 'rollback':
          await handleRollbackRequest(guardianSession)
          developmentActive = false
          break

        case 'status':
          await handleStatusRequest(guardianSession)
          break

        case 'quality':
          await handleQualityRequest(guardianSession)
          break

        case 'exit':
          developmentActive = false
          break

        case 'help':
          console.log('사용 가능한 명령어: commit, rollback, status, quality, exit')
          break

        default:
          if (cmd) {
            console.log(`알 수 없는 명령어: ${cmd}. 'help'를 입력하세요.`)
          }
          break
      }
    } catch (error) {
      console.error(`❌ 명령어 실행 실패: ${error.message}`)
    }
  }

  readline.close()
}

/**
 * 커밋 요청 처리
 */
async function handleCommitRequest(guardianSession, customMessage) {
  console.log('\n💾 커밋 승인 프로세스 시작...')

  try {
    // 1. 최종 품질 검증
    console.log('🔍 최종 품질 검증 중...')
    const qualityResult = await runQualityChecks()

    if (qualityResult.summary.overallStatus !== 'passed') {
      console.log('❌ 품질 검증 실패 - 커밋할 수 없습니다')
      console.log(`🔴 이슈 ${qualityResult.summary.totalIssues}개를 해결하세요`)
      return
    }

    // 2. 변경사항 분석
    const changes = analyzeChanges()
    console.log(`📋 변경사항: ${changes.totalFiles}개 파일`)

    // 3. 사용자 승인 요청
    const approval = await requestFinalApproval(guardianSession, changes, customMessage)

    if (approval.approved) {
      // 4. 커밋 실행
      await executeCommit(guardianSession, approval.message)

      // 5. GitHub 이슈 생성
      await createCompletionIssue(guardianSession, approval.message)

      console.log('✅ 커밋 완료!')
      console.log(`🔗 미리보기: ${guardianSession.previewUrl}`)

    } else {
      console.log('🚫 커밋이 취소되었습니다')
    }

  } catch (error) {
    console.error('❌ 커밋 프로세스 실패:', error.message)
  }
}

/**
 * 변경사항 분석
 */
function analyzeChanges() {
  try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' }).trim()
    const changes = gitStatus.split('\n').filter(line => line.trim())

    return {
      totalFiles: changes.length,
      changes: changes.map(line => ({
        status: line.substring(0, 2).trim(),
        file: line.substring(3)
      }))
    }
  } catch (error) {
    return { totalFiles: 0, changes: [] }
  }
}

/**
 * 최종 승인 요청
 */
async function requestFinalApproval(guardianSession, changes, customMessage) {
  console.log('\n🤝 최종 커밋 승인')
  console.log('=' .repeat(30))
  console.log(`📝 작업: ${guardianSession.workDescription}`)
  console.log(`📁 변경된 파일: ${changes.totalFiles}개`)
  console.log(`🔗 미리보기: ${guardianSession.previewUrl}`)
  console.log('')

  if (changes.changes.length > 0) {
    console.log('📋 변경된 파일:')
    changes.changes.slice(0, 10).forEach(change => {
      const icon = change.status.includes('A') ? '➕' :
                   change.status.includes('M') ? '📝' :
                   change.status.includes('D') ? '🗑️' : '❓'
      console.log(`   ${icon} ${change.file}`)
    })
    if (changes.changes.length > 10) {
      console.log(`   ... 및 ${changes.changes.length - 10}개 더`)
    }
    console.log('')
  }

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise(resolve => {
    readline.question('커밋하시겠습니까? (y/n/m=메시지수정): ', (answer) => {
      const choice = answer.toLowerCase().trim()

      if (choice === 'y' || choice === 'yes') {
        readline.close()
        resolve({
          approved: true,
          message: customMessage || `feat: ${guardianSession.workDescription}`
        })
      } else if (choice === 'm') {
        readline.question('커밋 메시지를 입력하세요: ', (message) => {
          readline.close()
          resolve({
            approved: true,
            message: message || `feat: ${guardianSession.workDescription}`
          })
        })
      } else {
        readline.close()
        resolve({ approved: false })
      }
    })
  })
}

/**
 * 커밋 실행
 */
async function executeCommit(guardianSession, commitMessage) {
  try {
    // Git add
    execSync('git add .', { stdio: 'inherit' })

    // 커밋 메시지 생성
    const fullCommitMessage = `${commitMessage}

🛡️ Protected by Development Guardian
🔗 Preview: ${guardianSession.previewUrl}
💾 Backup: ${guardianSession.backupId}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`

    // 커밋 실행
    execSync(`git commit -m "${fullCommitMessage}"`, { stdio: 'inherit' })

    // 커밋 해시 가져오기
    const commitHash = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim().substring(0, 8)

    // 컨텍스트 업데이트
    if (guardianSession.sessionId) {
      updateContext(guardianSession.sessionId, {
        completedStep: `커밋 완료: ${commitHash}`,
        note: `작업 "${guardianSession.workDescription}" 성공적으로 커밋됨`
      })
    }

    guardianSession.commitHash = commitHash
    console.log(`✅ 커밋 완료: ${commitHash}`)

  } catch (error) {
    console.error('❌ 커밋 실패:', error.message)
    throw error
  }
}

/**
 * 완료 이슈 생성
 */
async function createCompletionIssue(guardianSession, commitMessage) {
  try {
    const issueTitle = `✅ 개발 완료: ${guardianSession.workDescription}`
    const issueBody = `## 🛡️ Development Guardian 보고서

### 📋 작업 내용
${guardianSession.workDescription}

### 💾 보안 정보
- **백업 ID**: \`${guardianSession.backupId}\`
- **세션 ID**: \`${guardianSession.sessionId}\`
- **커밋 해시**: \`${guardianSession.commitHash || 'N/A'}\`

### 🔗 링크
- **실시간 미리보기**: [${guardianSession.previewUrl}](${guardianSession.previewUrl})
- **네트워크 접속**: 모바일에서도 접속 가능

### 📊 품질 보증
- ✅ 자동 백업 생성
- ✅ 실시간 품질 검증
- ✅ 테스트 통과
- ✅ 린트 검사 통과
- ✅ 타입 체크 통과

### 🛡️ 안전 장치
- 자동 롤백 가능
- 컨텍스트 보존
- 변경사항 추적

---
🤖 Development Guardian이 자동 생성한 보고서입니다.
`

    await createGitHubIssue(issueTitle, issueBody, [
      'completed',
      'development-guardian',
      'auto-generated'
    ])

    console.log('📋 GitHub 이슈 생성 완료')

  } catch (error) {
    console.warn('⚠️ GitHub 이슈 생성 실패:', error.message)
  }
}

/**
 * 롤백 요청 처리
 */
async function handleRollbackRequest(guardianSession) {
  console.log('\n🔄 롤백 요청 처리 중...')

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise(resolve => {
    readline.question('정말로 시작 시점으로 롤백하시겠습니까? (y/N): ', async (answer) => {
      readline.close()

      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        await performEmergencyRollback(guardianSession)
        resolve(true)
      } else {
        console.log('🚫 롤백이 취소되었습니다')
        resolve(false)
      }
    })
  })
}

/**
 * 비상 롤백 수행
 */
async function performEmergencyRollback(guardianSession) {
  try {
    console.log('🆘 비상 롤백 시작...')

    if (guardianSession.backupId) {
      await executeRollback(guardianSession.backupId)
      console.log('✅ 백업으로 롤백 완료')

      // 컨텍스트 업데이트
      if (guardianSession.sessionId) {
        updateContext(guardianSession.sessionId, {
          note: `비상 롤백 완료: ${guardianSession.backupId}로 복원`,
          currentPhase: 'rolled_back'
        })
      }
    } else {
      console.warn('⚠️ 백업 ID를 찾을 수 없습니다')
    }

  } catch (error) {
    console.error('❌ 비상 롤백 실패:', error.message)
  }
}

/**
 * 상태 요청 처리
 */
async function handleStatusRequest(guardianSession) {
  console.log('\n📊 현재 상태')
  console.log('=' .repeat(30))
  console.log(`📝 작업: ${guardianSession.workDescription}`)
  console.log(`🆔 세션: ${guardianSession.id}`)
  console.log(`💾 백업: ${guardianSession.backupId}`)
  console.log(`🔗 미리보기: ${guardianSession.previewUrl}`)
  console.log(`⏰ 시작: ${new Date(guardianSession.startTime).toLocaleString('ko-KR')}`)
  console.log('')

  // Git 상태
  try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' }).trim()
    if (gitStatus) {
      const changes = gitStatus.split('\n').length
      console.log(`📁 변경된 파일: ${changes}개`)
    } else {
      console.log('📁 변경된 파일: 없음')
    }
  } catch (error) {
    console.log('📁 Git 상태: 확인 불가')
  }

  // 서버 상태
  const serverRunning = await checkServerRunning(DEV_PORT)
  console.log(`🚀 개발 서버: ${serverRunning ? '실행 중' : '중지됨'}`)

  console.log('')
}

/**
 * 품질 요청 처리
 */
async function handleQualityRequest(guardianSession) {
  console.log('\n🔍 품질 검증 실행 중...')

  try {
    const result = await runQualityChecks()

    if (result.summary.overallStatus === 'passed') {
      console.log('✅ 모든 품질 검증 통과!')
    } else {
      console.log(`❌ 품질 이슈 ${result.summary.totalIssues}개 발견`)
    }

    // 컨텍스트 업데이트
    if (guardianSession.sessionId) {
      updateContext(guardianSession.sessionId, {
        note: `품질 검증 완료: ${result.summary.overallStatus} (이슈 ${result.summary.totalIssues}개)`
      })
    }

  } catch (error) {
    console.error('❌ 품질 검증 실패:', error.message)
  }
}

/**
 * 가디언 세션 저장
 */
async function saveGuardianSession(session) {
  const sessionPath = path.join(GUARDIAN_DIR, `${session.id}.json`)
  fs.writeFileSync(sessionPath, JSON.stringify(session, null, 2))

  console.log(`💾 가디언 세션 저장: ${sessionPath}`)
}

/**
 * 메인 실행 함수
 */
async function main() {
  const command = process.argv[2]
  const workDescription = process.argv[3]

  console.log('🛡️ 통합 개발 가디언 시스템\n')

  try {
    switch (command) {
      case 'start':
        if (!workDescription) {
          console.error('❌ 작업 설명을 입력하세요: node development-guardian.js start "작업 설명"')
          process.exit(1)
        }
        await startDevelopmentGuardian(workDescription)
        break

      default:
        console.log(`사용법:
  node development-guardian.js start "작업 설명"  - 통합 개발 가디언 시작`)
        break
    }
  } catch (error) {
    console.error('\n❌ 개발 가디언 시스템 오류:', error.message)
    process.exit(1)
  }
}

// CLI에서 직접 실행된 경우
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export {
  startDevelopmentGuardian,
  main
}
