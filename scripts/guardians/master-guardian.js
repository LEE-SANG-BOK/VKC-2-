#!/usr/bin/env node

/**
 * 마스터 가디언 시스템
 * - 모든 시스템을 통합하는 최상위 컨트롤러
 * - 단일 명령어로 완전 자동화된 개발 환경 제공
 * - 실시간 미리보기 + 커밋 승인 + 자동 백업 + 품질 검증
 */

import { startDevelopmentGuardian } from './development-guardian.js'
import { executeCompleteWorkflow } from '../management/workflow-manager.js'
import { createWorkSnapshot, executeRollback, listSnapshots } from '../management/backup-manager.js'
import { runQualityChecks } from './quality-guardian.js'
import { resumeSession, listSessions } from '../management/context-manager.js'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

/**
 * 마스터 가디언 시작 - 모든 기능 통합
 */
async function startMasterGuardian(workDescription) {
  console.log('👑 마스터 가디언 시스템 시작')
  console.log('=' .repeat(60))
  console.log(`📝 작업: ${workDescription}`)
  console.log('')

  console.log('🚀 다음 시스템들이 자동으로 활성화됩니다:')
  console.log('   💾 자동 백업 시스템')
  console.log('   🔍 실시간 품질 검증')
  console.log('   📋 컨텍스트 보존')
  console.log('   🔗 실시간 미리보기')
  console.log('   🤖 GitHub 자동화')
  console.log('   ⚡ 대화형 개발 모드')
  console.log('')

  try {
    // 통합 개발 가디언 시작
    await startDevelopmentGuardian(workDescription)

    console.log('\n🎉 마스터 가디언 세션 완료!')
    console.log('📊 시스템 상태: 모든 보호 장치 활성화')

  } catch (error) {
    console.error('\n❌ 마스터 가디언 실패:', error.message)
    console.log('🆘 비상 복구 모드 진입...')

    // 비상 복구 시도
    await emergencyRecovery()
  }
}

/**
 * 빠른 시작 모드 - 기존 세션 재개
 */
async function quickStart() {
  console.log('⚡ 빠른 시작 모드')
  console.log('=' .repeat(30))

  // 최근 세션 확인
  const sessions = listSessions()

  if (sessions.length === 0) {
    console.log('📝 진행 중인 세션이 없습니다.')
    console.log('새 작업을 시작하려면: node master-guardian.js start "작업 설명"')
    return
  }

  console.log('📋 최근 세션들:')
  sessions.slice(0, 5).forEach((session, index) => {
    console.log(`   ${index + 1}. ${session.sessionId}: ${session.request}`)
    console.log(`      단계: ${session.currentPhase}, 완료: ${session.completedSteps}개`)
  })

  console.log('')

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise(resolve => {
    readline.question('재개할 세션 번호 (1-5) 또는 Enter로 최근 세션: ', async (answer) => {
      readline.close()

      const sessionIndex = parseInt(answer) - 1
      const targetSession = isNaN(sessionIndex) ? sessions[0] : sessions[sessionIndex]

      if (targetSession) {
        console.log(`🔄 세션 재개: ${targetSession.sessionId}`)
        await resumeSession(targetSession.sessionId)

        // 개발 가디언 재시작
        await startDevelopmentGuardian(targetSession.request)
      } else {
        console.log('❌ 유효하지 않은 세션 번호입니다.')
      }

      resolve()
    })
  })
}

/**
 * 시스템 상태 확인
 */
async function checkSystemStatus() {
  console.log('📊 마스터 가디언 시스템 상태')
  console.log('=' .repeat(40))

  // 1. 백업 시스템 상태
  const snapshots = listSnapshots()
  console.log(`💾 백업 시스템: ${snapshots.length}개 스냅샷 available`)

  // 2. 세션 상태
  const sessions = listSessions()
  console.log(`📋 세션 관리: ${sessions.length}개 세션 기록`)

  // 3. 개발 서버 상태
  const serverRunning = await checkServerRunning(3000)
  console.log(`🚀 개발 서버: ${serverRunning ? '실행 중' : '중지됨'}`)

  // 4. Git 상태
  try {
    const { execSync } = require('child_process')
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' }).trim()
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim()

    console.log(`🌿 Git 브랜치: ${branch}`)
    console.log(`📁 변경된 파일: ${gitStatus ? gitStatus.split('\n').length + '개' : '없음'}`)
  } catch (error) {
    console.log('🌿 Git 상태: 확인 불가')
  }

  // 5. 품질 상태
  try {
    console.log('🔍 품질 검증 실행 중...')
    const qualityResult = await runQualityChecks()
    console.log(`✅ 품질 상태: ${qualityResult.summary.overallStatus}`)
    if (qualityResult.summary.totalIssues > 0) {
      console.log(`⚠️ 품질 이슈: ${qualityResult.summary.totalIssues}개`)
    }
  } catch (error) {
    console.log('🔍 품질 검증: 확인 불가')
  }

  console.log('')
  console.log('🛡️ 모든 보호 시스템이 준비되었습니다!')
}

/**
 * 서버 실행 확인
 */
function checkServerRunning(port) {
  return new Promise((resolve) => {
    import('child_process').then(({ exec }) => {
      exec(`lsof -i :${port}`, (error, stdout) => {
        resolve(!error && stdout.trim().length > 0)
      })
    }).catch(() => resolve(false))
  })
}

/**
 * 비상 복구
 */
async function emergencyRecovery() {
  console.log('🆘 비상 복구 프로세스 시작...')

  try {
    // 최근 스냅샷으로 롤백
    const snapshots = listSnapshots()

    if (snapshots.length > 0) {
      const latestSnapshot = snapshots[0]
      console.log(`🔄 최근 스냅샷으로 롤백: ${latestSnapshot.id}`)

      await executeRollback(latestSnapshot.id)
      console.log('✅ 비상 복구 완료')
    } else {
      console.log('⚠️ 복구할 스냅샷이 없습니다')
    }

  } catch (error) {
    console.error('❌ 비상 복구 실패:', error.message)
    console.log('🔧 수동 복구가 필요합니다')
  }
}

/**
 * 완전 자동화 모드
 */
async function fullAutoMode(workDescription) {
  console.log('🤖 완전 자동화 모드')
  console.log('=' .repeat(30))
  console.log('사용자 개입 없이 모든 과정을 자동으로 실행합니다.')
  console.log('')

  try {
    // 1. 백업 생성
    console.log('💾 자동 백업 생성...')
    await createWorkSnapshot(workDescription, `auto-${Date.now()}`)

    // 2. 워크플로우 실행
    console.log('⚡ 자동 워크플로우 실행...')
    const result = await executeCompleteWorkflow(workDescription)

    console.log('✅ 완전 자동화 완료!')
    console.log(`🔗 결과 확인: http://localhost:3000`)

    return result

  } catch (error) {
    console.error('❌ 자동화 실패:', error.message)
    await emergencyRecovery()
    throw error
  }
}

/**
 * 대화형 메뉴
 */
async function showInteractiveMenu() {
  console.log('👑 마스터 가디언 시스템')
  console.log('=' .repeat(30))
  console.log('1. 🚀 새 작업 시작 (완전 보호 모드)')
  console.log('2. ⚡ 빠른 시작 (기존 세션 재개)')
  console.log('3. 🤖 완전 자동화 모드')
  console.log('4. 📊 시스템 상태 확인')
  console.log('5. 💾 백업 관리')
  console.log('6. 🔍 품질 검증')
  console.log('7. 🆘 비상 복구')
  console.log('8. 종료')
  console.log('')

  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise(resolve => {
    readline.question('선택하세요 (1-8): ', async (choice) => {
      readline.close()

      switch (choice.trim()) {
        case '1':
          readline.question('작업 설명을 입력하세요: ', async (workDesc) => {
            await startMasterGuardian(workDesc)
            resolve()
          })
          break

        case '2':
          await quickStart()
          resolve()
          break

        case '3':
          readline.question('작업 설명을 입력하세요: ', async (workDesc) => {
            await fullAutoMode(workDesc)
            resolve()
          })
          break

        case '4':
          await checkSystemStatus()
          resolve()
          break

        case '5':
          const snapshots = listSnapshots()
          console.log('💾 백업 목록:')
          snapshots.slice(0, 10).forEach(snapshot => {
            console.log(`   ${snapshot.id}: ${snapshot.workDescription}`)
          })
          resolve()
          break

        case '6':
          console.log('🔍 품질 검증 실행 중...')
          await runQualityChecks()
          resolve()
          break

        case '7':
          await emergencyRecovery()
          resolve()
          break

        case '8':
          console.log('👋 마스터 가디언을 종료합니다.')
          resolve()
          break

        default:
          console.log('❌ 유효하지 않은 선택입니다.')
          await showInteractiveMenu()
          resolve()
          break
      }
    })
  })
}

/**
 * 메인 실행 함수
 */
async function main() {
  const command = process.argv[2]
  const arg = process.argv[3]

  try {
    switch (command) {
      case 'start':
        if (!arg) {
          console.error('❌ 작업 설명을 입력하세요: node master-guardian.js start "작업 설명"')
          process.exit(1)
        }
        await startMasterGuardian(arg)
        break

      case 'quick':
        await quickStart()
        break

      case 'auto':
        if (!arg) {
          console.error('❌ 작업 설명을 입력하세요: node master-guardian.js auto "작업 설명"')
          process.exit(1)
        }
        await fullAutoMode(arg)
        break

      case 'status':
        await checkSystemStatus()
        break

      case 'menu':
        await showInteractiveMenu()
        break

      default:
        console.log('👑 마스터 가디언 시스템')
        console.log('')
        console.log('완전 자동화된 안전한 개발 환경을 제공합니다.')
        console.log('')
        console.log('사용법:')
        console.log('  node master-guardian.js start "작업설명"   - 새 작업 시작 (완전 보호)')
        console.log('  node master-guardian.js quick            - 빠른 시작 (세션 재개)')
        console.log('  node master-guardian.js auto "작업설명"   - 완전 자동화 모드')
        console.log('  node master-guardian.js status           - 시스템 상태 확인')
        console.log('  node master-guardian.js menu             - 대화형 메뉴')
        console.log('')
        console.log('🛡️ 포함된 보호 기능:')
        console.log('   • 자동 백업 & 롤백')
        console.log('   • 실시간 품질 검증')
        console.log('   • 컨텍스트 보존')
        console.log('   • 실시간 미리보기')
        console.log('   • 커밋 승인 시스템')
        console.log('   • GitHub 자동화')
        console.log('')
        break
    }
  } catch (error) {
    console.error('\n❌ 마스터 가디언 오류:', error.message)
    console.log('\n🆘 비상 복구를 시도합니다...')
    await emergencyRecovery()
    process.exit(1)
  }
}

// CLI에서 직접 실행된 경우
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export {
  startMasterGuardian,
  quickStart,
  fullAutoMode,
  checkSystemStatus,
  main
}
