#!/usr/bin/env node

/**
 * 실시간 품질 검증 시스템
 * - 코드 변경 시 자동 테스트 실행
 * - 에러 자동 감지 및 분석
 * - 린트/타입체크 자동 실행
 * - 실시간 품질 모니터링
 */

import { execSync, spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'

const require = createRequire(import.meta.url)
const chokidar = require('chokidar')

// 설정
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const QUALITY_DIR = path.join(PROJECT_ROOT, '.quality')
const REPORTS_DIR = path.join(QUALITY_DIR, 'reports')

// 품질 검증 디렉토리 생성
const dirsToCreate = [QUALITY_DIR, REPORTS_DIR]
dirsToCreate.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

/**
 * 실시간 품질 모니터링 시작
 */
async function startQualityMonitoring(watchPatterns = ['**/*.{js,jsx,ts,tsx}', '**/*.{css,scss}']) {
  console.log('🔍 실시간 품질 모니터링 시작...')

  const watcher = chokidar.watch(watchPatterns, {
    ignored: [
      '**/node_modules/**',
      '**/.next/**',
      '**/.git/**',
      '**/coverage/**',
      '**/.quality/**',
      '**/dist/**',
      '**/build/**'
    ],
    persistent: true,
    ignoreInitial: true
  })

  let isProcessing = false
  let pendingChanges = new Set()

  const processChanges = async () => {
    if (isProcessing || pendingChanges.size === 0) return

    isProcessing = true
    const changedFiles = Array.from(pendingChanges)
    pendingChanges.clear()

    console.log(`\n🔄 변경 감지: ${changedFiles.length}개 파일`)
    console.log('=' .repeat(50))

    try {
      await runQualityChecks(changedFiles)
    } catch (error) {
      console.error('❌ 품질 검증 실패:', error.message)
    }

    isProcessing = false

    // 대기 중인 변경사항이 있으면 다시 처리
    if (pendingChanges.size > 0) {
      setTimeout(processChanges, 1000)
    }
  }

  watcher
    .on('change', filePath => {
      pendingChanges.add(filePath)
      console.log(`📝 변경: ${path.relative(PROJECT_ROOT, filePath)}`)

      // 1초 후 처리 (여러 파일 변경 시 배치 처리)
      setTimeout(processChanges, 1000)
    })
    .on('add', filePath => {
      pendingChanges.add(filePath)
      console.log(`➕ 추가: ${path.relative(PROJECT_ROOT, filePath)}`)
      setTimeout(processChanges, 1000)
    })
    .on('unlink', filePath => {
      console.log(`🗑️ 삭제: ${path.relative(PROJECT_ROOT, filePath)}`)
    })

  console.log('👀 파일 감시 활성화:')
  watchPatterns.forEach(pattern => console.log(`   ${pattern}`))
  console.log('\n✨ 파일을 수정하면 자동으로 품질 검증이 실행됩니다!')

  return watcher
}

/**
 * 품질 검증 실행
 */
async function runQualityChecks(changedFiles = []) {
  const startTime = Date.now()
  const reportId = `quality-${Date.now()}`

  const results = {
    id: reportId,
    timestamp: new Date().toISOString(),
    changedFiles,
    checks: {
      lint: { status: 'pending', errors: [], warnings: [] },
      typecheck: { status: 'pending', errors: [] },
      tests: { status: 'pending', passed: 0, failed: 0, coverage: null },
      build: { status: 'pending', errors: [] }
    },
    summary: {
      totalIssues: 0,
      criticalIssues: 0,
      overallStatus: 'pending'
    },
    executionTime: 0
  }

  try {
    console.log('🔍 품질 검증 시작...')

    // 1. ESLint 검사
    console.log('📋 1. ESLint 검사 중...')
    results.checks.lint = await runLintCheck(changedFiles)

    // 2. 타입 체크
    console.log('🔧 2. TypeScript 타입 체크 중...')
    results.checks.typecheck = await runTypeCheck()

    // 3. 테스트 실행 (변경된 파일과 관련된 테스트만)
    console.log('🧪 3. 관련 테스트 실행 중...')
    results.checks.tests = await runRelatedTests(changedFiles)

    // 4. 빌드 검증 (선택적)
    if (shouldRunBuildCheck(changedFiles)) {
      console.log('🏗️ 4. 빌드 검증 중...')
      results.checks.build = await runBuildCheck()
    } else {
      results.checks.build.status = 'skipped'
    }

  } catch (error) {
    console.error('❌ 품질 검증 중 오류:', error.message)
    results.summary.overallStatus = 'error'
  }

  // 결과 요약
  results.executionTime = Date.now() - startTime
  results.summary = generateSummary(results.checks)

  // 리포트 저장
  await saveQualityReport(results)

  // 결과 출력
  displayQualityResults(results)

  return results
}

/**
 * ESLint 검사
 */
async function runLintCheck(changedFiles) {
  try {
    const result = { status: 'running', errors: [], warnings: [] }

    // 변경된 파일이 있으면 해당 파일만, 없으면 전체 검사
    const filesToCheck = changedFiles.length > 0
      ? changedFiles.filter(f => f.match(/\.(js|jsx|ts|tsx)$/))
      : ['.']

    if (filesToCheck.length === 0) {
      result.status = 'skipped'
      return result
    }

    const lintCommand = `npm run lint ${filesToCheck.join(' ')}`
    const output = execSync(lintCommand, {
      encoding: 'utf8',
      cwd: PROJECT_ROOT
    })

    result.status = 'passed'
    result.output = output

  } catch (error) {
    const result = { status: 'failed', errors: [], warnings: [] }

    // ESLint 출력 파싱
    const output = error.stdout || error.message
    const lines = output.split('\n')

    lines.forEach(line => {
      if (line.includes('error')) {
        result.errors.push(line.trim())
      } else if (line.includes('warning')) {
        result.warnings.push(line.trim())
      }
    })

    return result
  }
}

/**
 * TypeScript 타입 체크
 */
async function runTypeCheck() {
  try {
    const result = { status: 'running', errors: [] }

    const output = execSync('npm run type-check', {
      encoding: 'utf8',
      cwd: PROJECT_ROOT
    })

    result.status = 'passed'
    result.output = output
    return result

  } catch (error) {
    const result = { status: 'failed', errors: [] }

    // TypeScript 에러 파싱
    const output = error.stdout || error.message
    const lines = output.split('\n')

    lines.forEach(line => {
      if (line.includes('error TS')) {
        result.errors.push(line.trim())
      }
    })

    return result
  }
}

/**
 * 관련 테스트 실행
 */
async function runRelatedTests(changedFiles) {
  try {
    const result = { status: 'running', passed: 0, failed: 0, coverage: null }

    // 변경된 파일과 관련된 테스트 파일 찾기
    const testFiles = findRelatedTestFiles(changedFiles)

    if (testFiles.length === 0) {
      result.status = 'skipped'
      result.reason = '관련 테스트 파일 없음'
      return result
    }

    // 테스트 실행
    const testCommand = testFiles.length > 0
      ? `npm test ${testFiles.join(' ')}`
      : 'npm test'

    const output = execSync(testCommand, {
      encoding: 'utf8',
      cwd: PROJECT_ROOT
    })

    // 테스트 결과 파싱
    const testResults = parseTestOutput(output)
    result.status = testResults.failed === 0 ? 'passed' : 'failed'
    result.passed = testResults.passed
    result.failed = testResults.failed
    result.coverage = testResults.coverage

    return result

  } catch (error) {
    return {
      status: 'failed',
      passed: 0,
      failed: 1,
      error: error.message
    }
  }
}

/**
 * 관련 테스트 파일 찾기
 */
function findRelatedTestFiles(changedFiles) {
  const testFiles = []

  changedFiles.forEach(file => {
    const relativePath = path.relative(PROJECT_ROOT, file)
    const testPatterns = [
      relativePath.replace(/\.(js|jsx|ts|tsx)$/, '.test.$1'),
      relativePath.replace(/\.(js|jsx|ts|tsx)$/, '.spec.$1'),
      relativePath.replace('src/', 'src/tests/').replace(/\.(js|jsx|ts|tsx)$/, '.test.$1')
    ]

    testPatterns.forEach(pattern => {
      const testPath = path.join(PROJECT_ROOT, pattern)
      if (fs.existsSync(testPath)) {
        testFiles.push(pattern)
      }
    })
  })

  return [...new Set(testFiles)] // 중복 제거
}

/**
 * 테스트 출력 파싱
 */
function parseTestOutput(output) {
  const result = { passed: 0, failed: 0, coverage: null }

  // Vitest 출력 파싱
  const lines = output.split('\n')

  lines.forEach(line => {
    const passMatch = line.match(/(\d+) passed/)
    const failMatch = line.match(/(\d+) failed/)
    const coverageMatch = line.match(/All files\s+\|\s+([\d.]+)/)

    if (passMatch) result.passed = parseInt(passMatch[1])
    if (failMatch) result.failed = parseInt(failMatch[1])
    if (coverageMatch) result.coverage = parseFloat(coverageMatch[1])
  })

  return result
}

/**
 * 빌드 체크 필요성 판단
 */
function shouldRunBuildCheck(changedFiles) {
  const criticalFiles = [
    'next.config.js',
    'tailwind.config.js',
    'tsconfig.json',
    'package.json'
  ]

  return changedFiles.some(file =>
    criticalFiles.some(critical => file.includes(critical))
  )
}

/**
 * 빌드 검증
 */
async function runBuildCheck() {
  try {
    const result = { status: 'running', errors: [] }

    const output = execSync('npm run build', {
      encoding: 'utf8',
      cwd: PROJECT_ROOT,
      timeout: 60000 // 1분 타임아웃
    })

    result.status = 'passed'
    result.output = output
    return result

  } catch (error) {
    return {
      status: 'failed',
      errors: [error.message],
      output: error.stdout || error.message
    }
  }
}

/**
 * 결과 요약 생성
 */
function generateSummary(checks) {
  let totalIssues = 0
  let criticalIssues = 0
  let overallStatus = 'passed'

  Object.values(checks).forEach(check => {
    if (check.status === 'failed') {
      overallStatus = 'failed'

      if (check.errors) {
        totalIssues += check.errors.length
        criticalIssues += check.errors.length
      }
      if (check.warnings) {
        totalIssues += check.warnings.length
      }
      if (check.failed) {
        totalIssues += check.failed
        criticalIssues += check.failed
      }
    }
  })

  return {
    totalIssues,
    criticalIssues,
    overallStatus
  }
}

/**
 * 품질 리포트 저장
 */
async function saveQualityReport(results) {
  const reportPath = path.join(REPORTS_DIR, `${results.id}.json`)
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2))

  // 최근 리포트 ID 저장
  fs.writeFileSync(path.join(QUALITY_DIR, 'latest-report.txt'), results.id)

  console.log(`📊 품질 리포트 저장: ${reportPath}`)
}

/**
 * 결과 표시
 */
function displayQualityResults(results) {
  console.log('\n📊 품질 검증 결과')
  console.log('=' .repeat(50))

  // 전체 상태
  const statusIcon = results.summary.overallStatus === 'passed' ? '✅' : '❌'
  console.log(`${statusIcon} 전체 상태: ${results.summary.overallStatus.toUpperCase()}`)
  console.log(`⏱️ 실행 시간: ${results.executionTime}ms`)

  if (results.summary.totalIssues > 0) {
    console.log(`⚠️ 총 이슈: ${results.summary.totalIssues}개`)
    console.log(`🔴 심각한 이슈: ${results.summary.criticalIssues}개`)
  }

  console.log('')

  // 각 검사별 결과
  Object.entries(results.checks).forEach(([checkName, check]) => {
    const icon = check.status === 'passed' ? '✅' :
                 check.status === 'failed' ? '❌' :
                 check.status === 'skipped' ? '⏭️' : '⏳'

    console.log(`${icon} ${checkName.toUpperCase()}: ${check.status}`)

    if (check.errors && check.errors.length > 0) {
      console.log(`   🔴 에러: ${check.errors.length}개`)
      check.errors.slice(0, 3).forEach(error => {
        console.log(`      ${error}`)
      })
      if (check.errors.length > 3) {
        console.log(`      ... 및 ${check.errors.length - 3}개 더`)
      }
    }

    if (check.warnings && check.warnings.length > 0) {
      console.log(`   🟡 경고: ${check.warnings.length}개`)
    }

    if (check.passed !== undefined) {
      console.log(`   ✅ 통과: ${check.passed}개`)
      if (check.failed > 0) {
        console.log(`   ❌ 실패: ${check.failed}개`)
      }
    }

    if (check.coverage !== null && check.coverage !== undefined) {
      console.log(`   📊 커버리지: ${check.coverage}%`)
    }
  })

  console.log('')

  // 권장사항
  if (results.summary.overallStatus === 'failed') {
    console.log('💡 권장사항:')
    if (results.checks.lint.status === 'failed') {
      console.log('   • ESLint 에러를 수정하세요')
    }
    if (results.checks.typecheck.status === 'failed') {
      console.log('   • TypeScript 타입 에러를 수정하세요')
    }
    if (results.checks.tests.status === 'failed') {
      console.log('   • 실패한 테스트를 수정하세요')
    }
    if (results.checks.build.status === 'failed') {
      console.log('   • 빌드 에러를 해결하세요')
    }
  } else {
    console.log('🎉 모든 품질 검증을 통과했습니다!')
  }
}

/**
 * 품질 히스토리 조회
 */
function getQualityHistory(limit = 10) {
  if (!fs.existsSync(REPORTS_DIR)) {
    return []
  }

  const reports = fs.readdirSync(REPORTS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const reportPath = path.join(REPORTS_DIR, f)
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
      return {
        id: report.id,
        timestamp: report.timestamp,
        status: report.summary.overallStatus,
        issues: report.summary.totalIssues,
        executionTime: report.executionTime
      }
    })
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit)

  return reports
}

/**
 * 메인 실행 함수
 */
async function main() {
  const command = process.argv[2]
  const arg = process.argv[3]

  console.log('🛡️ 실시간 품질 검증 시스템\n')

  try {
    switch (command) {
      case 'watch':
        const watcher = await startQualityMonitoring()

        // Graceful shutdown
        process.on('SIGINT', () => {
          console.log('\n🛑 품질 모니터링 종료 중...')
          watcher.close()
          process.exit(0)
        })
        break

      case 'check':
        const changedFiles = arg ? [arg] : []
        await runQualityChecks(changedFiles)
        break

      case 'history':
        const limit = parseInt(arg) || 10
        const history = getQualityHistory(limit)

        console.log('📈 품질 검증 히스토리:')
        history.forEach(report => {
          const statusIcon = report.status === 'passed' ? '✅' : '❌'
          console.log(`  ${statusIcon} ${report.id}`)
          console.log(`     📅 ${new Date(report.timestamp).toLocaleString('ko-KR')}`)
          console.log(`     🔍 이슈: ${report.issues}개, 시간: ${report.executionTime}ms`)
          console.log('')
        })
        break

      default:
        console.log(`사용법:
  node quality-guardian.js watch              - 실시간 품질 모니터링 시작
  node quality-guardian.js check [FILE]       - 품질 검증 실행
  node quality-guardian.js history [LIMIT]    - 품질 히스토리 조회`)
        break
    }
  } catch (error) {
    console.error('\n❌ 품질 검증 시스템 오류:', error.message)
    process.exit(1)
  }
}

// CLI에서 직접 실행된 경우
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export {
  startQualityMonitoring,
  runQualityChecks,
  getQualityHistory,
  main
}
