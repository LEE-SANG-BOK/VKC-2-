#!/usr/bin/env node

/**
 * 자동 백업 시스템
 * - 작업 시작 전 자동 스냅샷
 * - 커밋 전 백업 생성
 * - 원클릭 롤백 기능
 * - 안전한 개발 환경 보장
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const crypto = require('crypto')

// 설정
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const BACKUPS_DIR = path.join(PROJECT_ROOT, '.backups')
const SNAPSHOTS_DIR = path.join(BACKUPS_DIR, 'snapshots')
const ROLLBACK_DIR = path.join(BACKUPS_DIR, 'rollback')

// 백업 디렉토리 생성
const dirsToCreate = [BACKUPS_DIR, SNAPSHOTS_DIR, ROLLBACK_DIR]
dirsToCreate.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

/**
 * 작업 시작 전 자동 스냅샷 생성
 */
async function createWorkSnapshot(workDescription, sessionId = null) {
  console.log('📸 작업 시작 전 스냅샷 생성 중...')

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const snapshotId = `snapshot-${timestamp}-${generateShortHash()}`

  try {
    // Git 상태 확인
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' }).trim()
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim()
    const lastCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim()

    // 스냅샷 정보
    const snapshotInfo = {
      id: snapshotId,
      timestamp: new Date().toISOString(),
      workDescription,
      sessionId,
      gitInfo: {
        branch: currentBranch,
        lastCommit: lastCommit.substring(0, 8),
        uncommittedFiles: gitStatus ? gitStatus.split('\n') : [],
        hasUncommitted: !!gitStatus
      },
      fileList: await generateFileList(),
      environment: {
        nodeVersion: process.version,
        workingDirectory: process.cwd()
      }
    }

    // 스냅샷 저장
    const snapshotPath = path.join(SNAPSHOTS_DIR, `${snapshotId}.json`)
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshotInfo, null, 2))

    // Git stash로 변경사항 백업 (있는 경우)
    if (gitStatus) {
      const stashMessage = `AUTO_BACKUP: ${workDescription} - ${snapshotId}`
      try {
        execSync(`git stash push -m "${stashMessage}"`, { stdio: 'pipe' })
        snapshotInfo.gitInfo.stashCreated = true
        snapshotInfo.gitInfo.stashMessage = stashMessage
      } catch (error) {
        console.warn('⚠️ Git stash 생성 실패 (변경사항 없음)')
        snapshotInfo.gitInfo.stashCreated = false
      }
    }

    // 중요 설정 파일 백업
    await backupConfigFiles(snapshotId)

    // 스냅샷 정보 다시 저장 (stash 정보 포함)
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshotInfo, null, 2))

    console.log(`✅ 스냅샷 생성 완료: ${snapshotId}`)
    console.log(`📁 저장 위치: ${snapshotPath}`)

    // 최근 스냅샷 ID 저장
    fs.writeFileSync(path.join(BACKUPS_DIR, 'latest-snapshot.txt'), snapshotId)

    return {
      snapshotId,
      snapshotPath,
      canRollback: true,
      gitInfo: snapshotInfo.gitInfo
    }

  } catch (error) {
    console.error('❌ 스냅샷 생성 실패:', error.message)
    throw error
  }
}

/**
 * 중요 설정 파일 백업
 */
async function backupConfigFiles(snapshotId) {
  const configFiles = [
    'package.json',
    'package-lock.json',
    'next.config.js',
    'tailwind.config.js',
    'tsconfig.json',
    '.env.local',
    '.env.example',
    'middleware.ts'
  ]

  const backupPath = path.join(SNAPSHOTS_DIR, `${snapshotId}-configs`)
  fs.mkdirSync(backupPath, { recursive: true })

  let backedUpFiles = []

  for (const file of configFiles) {
    const filePath = path.join(PROJECT_ROOT, file)
    if (fs.existsSync(filePath)) {
      const destPath = path.join(backupPath, file)
      fs.copyFileSync(filePath, destPath)
      backedUpFiles.push(file)
    }
  }

  console.log(`📁 설정 파일 ${backedUpFiles.length}개 백업 완료`)
  return backedUpFiles
}

/**
 * 파일 목록 생성
 */
async function generateFileList() {
  try {
    // Git으로 추적되는 파일 목록
    const gitFiles = execSync('git ls-files', { encoding: 'utf8' })
      .split('\n')
      .filter(f => f.trim())

    // 주요 디렉토리의 파일 통계
    const stats = {
      totalFiles: gitFiles.length,
      byType: {},
      byDirectory: {}
    }

    gitFiles.forEach(file => {
      const ext = path.extname(file) || 'no-ext'
      const dir = path.dirname(file).split('/')[0]

      stats.byType[ext] = (stats.byType[ext] || 0) + 1
      stats.byDirectory[dir] = (stats.byDirectory[dir] || 0) + 1
    })

    return stats
  } catch (error) {
    return { error: 'Git 파일 목록 생성 실패' }
  }
}

/**
 * 롤백 실행
 */
async function executeRollback(snapshotId = null) {
  const targetSnapshot = snapshotId || getLatestSnapshot()

  if (!targetSnapshot) {
    throw new Error('롤백할 스냅샷을 찾을 수 없습니다')
  }

  console.log(`🔄 스냅샷으로 롤백 시작: ${targetSnapshot}`)

  try {
    // 스냅샷 정보 로드
    const snapshotPath = path.join(SNAPSHOTS_DIR, `${targetSnapshot}.json`)
    if (!fs.existsSync(snapshotPath)) {
      throw new Error(`스냅샷 파일을 찾을 수 없습니다: ${targetSnapshot}`)
    }

    const snapshotInfo = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'))

    // 현재 변경사항을 임시 백업
    console.log('💾 현재 변경사항 임시 백업 중...')
    await createEmergencyBackup()

    // Git stash 복원
    if (snapshotInfo.gitInfo.stashCreated) {
      console.log('📥 Git stash 복원 중...')

      // stash 목록에서 해당 stash 찾기
      const stashList = execSync('git stash list', { encoding: 'utf8' })
      const stashEntry = stashList.split('\n').find(line =>
        line.includes(snapshotInfo.gitInfo.stashMessage)
      )

      if (stashEntry) {
        const stashIndex = stashEntry.split(':')[0]
        execSync(`git stash apply ${stashIndex}`, { stdio: 'inherit' })
        console.log('✅ Git stash 복원 완료')
      } else {
        console.warn('⚠️ 해당 stash를 찾을 수 없습니다')
      }
    }

    // 설정 파일 복원
    console.log('⚙️ 설정 파일 복원 중...')
    await restoreConfigFiles(targetSnapshot)

    // 브랜치 확인 및 체크아웃
    if (snapshotInfo.gitInfo.branch !== getCurrentBranch()) {
      console.log(`🌿 브랜치 변경: ${getCurrentBranch()} → ${snapshotInfo.gitInfo.branch}`)
      try {
        execSync(`git checkout ${snapshotInfo.gitInfo.branch}`, { stdio: 'inherit' })
      } catch (error) {
        console.warn(`⚠️ 브랜치 체크아웃 실패: ${error.message}`)
      }
    }

    console.log('✅ 롤백 완료!')
    console.log(`📅 복원 시점: ${new Date(snapshotInfo.timestamp).toLocaleString('ko-KR')}`)
    console.log(`📝 작업 내용: ${snapshotInfo.workDescription}`)

    return {
      success: true,
      snapshotId: targetSnapshot,
      restoredTimestamp: snapshotInfo.timestamp,
      workDescription: snapshotInfo.workDescription
    }

  } catch (error) {
    console.error('❌ 롤백 실패:', error.message)
    console.log('🆘 비상 복구 시도 중...')
    await emergencyRestore()
    throw error
  }
}

/**
 * 비상 백업 생성
 */
async function createEmergencyBackup() {
  const emergencyId = `emergency-${Date.now()}`
  const emergencyPath = path.join(ROLLBACK_DIR, emergencyId)

  fs.mkdirSync(emergencyPath, { recursive: true })

  // 현재 Git 상태 저장
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' }).trim()

  if (gitStatus) {
    const emergencyStash = `EMERGENCY_BACKUP: ${emergencyId}`
    try {
      execSync(`git stash push -m "${emergencyStash}"`, { stdio: 'pipe' })

      const emergencyInfo = {
        id: emergencyId,
        timestamp: new Date().toISOString(),
        stashMessage: emergencyStash,
        gitStatus
      }

      fs.writeFileSync(
        path.join(emergencyPath, 'emergency-info.json'),
        JSON.stringify(emergencyInfo, null, 2)
      )

      console.log(`🆘 비상 백업 생성: ${emergencyId}`)
    } catch (error) {
      console.warn('⚠️ 비상 백업 실패:', error.message)
    }
  }
}

/**
 * 설정 파일 복원
 */
async function restoreConfigFiles(snapshotId) {
  const configBackupPath = path.join(SNAPSHOTS_DIR, `${snapshotId}-configs`)

  if (!fs.existsSync(configBackupPath)) {
    console.warn('⚠️ 설정 파일 백업을 찾을 수 없습니다')
    return
  }

  const configFiles = fs.readdirSync(configBackupPath)

  for (const file of configFiles) {
    const sourcePath = path.join(configBackupPath, file)
    const destPath = path.join(PROJECT_ROOT, file)

    try {
      fs.copyFileSync(sourcePath, destPath)
      console.log(`✅ 복원: ${file}`)
    } catch (error) {
      console.warn(`⚠️ ${file} 복원 실패: ${error.message}`)
    }
  }
}

/**
 * 비상 복구
 */
async function emergencyRestore() {
  try {
    console.log('🆘 비상 복구 프로세스 시작...')

    // 최근 비상 백업 찾기
    const emergencyFiles = fs.readdirSync(ROLLBACK_DIR)
      .filter(f => f.startsWith('emergency-'))
      .sort()
      .reverse()

    if (emergencyFiles.length > 0) {
      const latestEmergency = emergencyFiles[0]
      const emergencyInfoPath = path.join(ROLLBACK_DIR, latestEmergency, 'emergency-info.json')

      if (fs.existsSync(emergencyInfoPath)) {
        const emergencyInfo = JSON.parse(fs.readFileSync(emergencyInfoPath, 'utf8'))

        console.log(`🔧 비상 백업 복원 중: ${latestEmergency}`)

        // Emergency stash 복원
        const stashList = execSync('git stash list', { encoding: 'utf8' })
        const emergencyStash = stashList.split('\n').find(line =>
          line.includes(emergencyInfo.stashMessage)
        )

        if (emergencyStash) {
          const stashIndex = emergencyStash.split(':')[0]
          execSync(`git stash apply ${stashIndex}`, { stdio: 'inherit' })
          console.log('✅ 비상 복구 완료')
        }
      }
    } else {
      console.log('⚠️ 비상 백업을 찾을 수 없습니다')
    }
  } catch (error) {
    console.error('❌ 비상 복구 실패:', error.message)
  }
}

/**
 * 스냅샷 목록 조회
 */
function listSnapshots() {
  if (!fs.existsSync(SNAPSHOTS_DIR)) {
    return []
  }

  const snapshots = fs.readdirSync(SNAPSHOTS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const snapshotPath = path.join(SNAPSHOTS_DIR, f)
      const info = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'))
      return {
        id: info.id,
        timestamp: info.timestamp,
        workDescription: info.workDescription,
        branch: info.gitInfo.branch,
        hasUncommitted: info.gitInfo.hasUncommitted
      }
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

  return snapshots
}

/**
 * 최근 스냅샷 ID 가져오기
 */
function getLatestSnapshot() {
  const latestFile = path.join(BACKUPS_DIR, 'latest-snapshot.txt')

  if (fs.existsSync(latestFile)) {
    return fs.readFileSync(latestFile, 'utf8').trim()
  }

  // 파일이 없으면 최근 스냅샷 찾기
  const snapshots = listSnapshots()
  return snapshots.length > 0 ? snapshots[0].id : null
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
 * 짧은 해시 생성
 */
function generateShortHash() {
  return crypto.randomBytes(4).toString('hex')
}

/**
 * 스냅샷 정리 (오래된 스냅샷 삭제)
 */
function cleanupSnapshots(daysToKeep = 7) {
  console.log(`🧹 ${daysToKeep}일 이상 된 스냅샷 정리 중...`)

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  let cleaned = 0

  if (fs.existsSync(SNAPSHOTS_DIR)) {
    const snapshots = fs.readdirSync(SNAPSHOTS_DIR)

    snapshots.forEach(file => {
      const filePath = path.join(SNAPSHOTS_DIR, file)
      const stats = fs.statSync(filePath)

      if (stats.mtime < cutoffDate) {
        // JSON 파일과 연관된 config 폴더도 삭제
        if (file.endsWith('.json')) {
          const configDir = path.join(SNAPSHOTS_DIR, file.replace('.json', '-configs'))
          if (fs.existsSync(configDir)) {
            fs.rmSync(configDir, { recursive: true })
          }
        }

        fs.unlinkSync(filePath)
        cleaned++
      }
    })
  }

  console.log(`✅ ${cleaned}개 스냅샷 정리 완료`)
  return cleaned
}

/**
 * 백업 상태 확인
 */
function checkBackupStatus() {
  const stats = {
    snapshotsCount: 0,
    latestSnapshot: null,
    backupDirSize: 0,
    canRollback: false
  }

  if (fs.existsSync(SNAPSHOTS_DIR)) {
    const snapshots = fs.readdirSync(SNAPSHOTS_DIR).filter(f => f.endsWith('.json'))
    stats.snapshotsCount = snapshots.length
    stats.latestSnapshot = getLatestSnapshot()
    stats.canRollback = snapshots.length > 0

    // 백업 디렉토리 크기 계산
    try {
      const sizeOutput = execSync(`du -sh ${BACKUPS_DIR}`, { encoding: 'utf8' })
      stats.backupDirSize = sizeOutput.split('\t')[0]
    } catch (error) {
      stats.backupDirSize = 'unknown'
    }
  }

  return stats
}

/**
 * 메인 실행 함수
 */
async function main() {
  const command = process.argv[2]
  const arg = process.argv[3]

  console.log('💾 자동 백업 시스템\n')

  try {
    switch (command) {
      case 'snapshot':
        if (!arg) {
          console.error('❌ 작업 설명을 입력하세요: node backup-manager.js snapshot "작업 설명"')
          process.exit(1)
        }
        await createWorkSnapshot(arg)
        break

      case 'rollback':
        await executeRollback(arg)
        break

      case 'list':
        const snapshots = listSnapshots()
        console.log('📋 스냅샷 목록:')
        snapshots.forEach(snapshot => {
          console.log(`  ${snapshot.id}: ${snapshot.workDescription}`)
          console.log(`    📅 ${new Date(snapshot.timestamp).toLocaleString('ko-KR')}`)
          console.log(`    🌿 브랜치: ${snapshot.branch}`)
          console.log('')
        })
        break

      case 'status':
        const status = checkBackupStatus()
        console.log('📊 백업 상태:')
        console.log(`   📸 스냅샷: ${status.snapshotsCount}개`)
        console.log(`   📅 최근: ${status.latestSnapshot || '없음'}`)
        console.log(`   💾 크기: ${status.backupDirSize}`)
        console.log(`   🔄 롤백 가능: ${status.canRollback ? 'Yes' : 'No'}`)
        break

      case 'cleanup':
        const days = parseInt(arg) || 7
        cleanupSnapshots(days)
        break

      default:
        console.log(`사용법:
  node backup-manager.js snapshot "작업 설명"     - 스냅샷 생성
  node backup-manager.js rollback [SNAPSHOT_ID]  - 롤백 실행
  node backup-manager.js list                    - 스냅샷 목록
  node backup-manager.js status                  - 백업 상태
  node backup-manager.js cleanup [DAYS]          - 스냅샷 정리`)
        break
    }
  } catch (error) {
    console.error('\n❌ 백업 시스템 오류:', error.message)
    process.exit(1)
  }
}

// CLI에서 직접 실행된 경우
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export {
  createWorkSnapshot,
  executeRollback,
  listSnapshots,
  checkBackupStatus,
  cleanupSnapshots,
  main
}
