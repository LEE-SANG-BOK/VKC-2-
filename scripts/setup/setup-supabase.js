#!/usr/bin/env node

/**
 * Supabase 환경 설정 및 데이터베이스 마이그레이션 스크립트
 * 실제 Supabase 프로젝트로 전환하는 자동화 도구
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🚀 Supabase 환경 설정 및 마이그레이션 도구')
console.log('=====================================\n')

/**
 * 1. 환경 변수 확인
 */
function checkEnvironmentVariables() {
  console.log('🔍 환경 변수 확인 중...')

  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ]

  const envPath = path.join(__dirname, '../.env')

  if (!fs.existsSync(envPath)) {
    console.error('❌ .env 파일이 존재하지 않습니다.')
    return false
  }

  const envContent = fs.readFileSync(envPath, 'utf8')

  for (const envVar of requiredEnvVars) {
    if (!envContent.includes(envVar) || envContent.includes(`${envVar}=your-`)) {
      console.log(`⚠️  ${envVar} 설정이 필요합니다.`)
      return false
    }
  }

  console.log('✅ 환경 변수 설정 완료\n')
  return true
}

/**
 * 2. 마이그레이션 파일 목록 확인
 */
function listMigrationFiles() {
  console.log('📋 마이그레이션 파일 목록:')

  const migrationsDir = path.join(__dirname, '../supabase/migrations')

  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ migrations 디렉토리가 존재하지 않습니다.')
    return []
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort()

  files.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`)
  })

  console.log(`\n✅ 총 ${files.length}개의 마이그레이션 파일 발견\n`)
  return files
}

/**
 * 3. SQL 파일 내용 검증
 */
function validateMigrationFiles(files) {
  console.log('🔍 마이그레이션 파일 검증 중...')

  const migrationsDir = path.join(__dirname, '../supabase/migrations')
  let isValid = true

  files.forEach(file => {
    const filePath = path.join(migrationsDir, file)
    const content = fs.readFileSync(filePath, 'utf8')

    // 기본 검증
    if (content.length < 100) {
      console.log(`⚠️  ${file}: 파일이 너무 짧습니다.`)
      isValid = false
    }

    // SQL 구문 확인
    if (!content.includes('CREATE TABLE') && !content.includes('CREATE POLICY')) {
      console.log(`⚠️  ${file}: CREATE 구문을 찾을 수 없습니다.`)
      isValid = false
    }
  })

  if (isValid) {
    console.log('✅ 모든 마이그레이션 파일이 유효합니다.\n')
  }

  return isValid
}

/**
 * 4. 현재 설정 상태 확인
 */
function checkCurrentStatus() {
  console.log('📊 현재 설정 상태:')

  const envPath = path.join(__dirname, '../.env')
  const envContent = fs.readFileSync(envPath, 'utf8')

  // Mock mode removed

  // Supabase URL 확인
  const hasRealUrl = envContent.includes('supabase.co') && !envContent.includes('your-project-ref')
  console.log(`   Supabase URL: ${hasRealUrl ? '🟢 실제 URL 설정됨' : '🟡 플레이스홀더 상태'}`)

  // OAuth 설정 확인
  const hasGoogleOAuth = !envContent.includes('NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-')
  const hasFacebookOAuth = !envContent.includes('NEXT_PUBLIC_FACEBOOK_APP_ID=your-')
  const hasKakaoOAuth = !envContent.includes('NEXT_PUBLIC_KAKAO_CLIENT_ID=your-')

  console.log(`   Google OAuth: ${hasGoogleOAuth ? '🟢 설정됨' : '🟡 미설정'}`)
  console.log(`   Facebook OAuth: ${hasFacebookOAuth ? '🟢 설정됨' : '🟡 미설정'}`)
  console.log(`   Kakao OAuth: ${hasKakaoOAuth ? '🟢 설정됨' : '🟡 미설정'}`)

  console.log('')

  return {
    hasRealUrl,
    hasGoogleOAuth,
    hasFacebookOAuth,
    hasKakaoOAuth
  }
}

/**
 * 5. 다음 단계 안내
 */
function showNextSteps(status) {
  console.log('🎯 다음 단계 안내:')
  console.log('=================')

  if (!status.hasRealUrl) {
    console.log('\n📌 1단계: Supabase 프로젝트 생성')
    console.log('   1. https://supabase.com 접속')
    console.log('   2. 새 프로젝트 생성: "viet-kconnect"')
    console.log('   3. Project URL과 anon key 복사')
    console.log('   4. .env 파일의 NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 업데이트')
  }

  console.log('\n📌 2단계: 데이터베이스 마이그레이션')
  console.log('   1. Supabase 대시보드 → SQL Editor')
  console.log('   2. supabase/migrations/001_initial_schema.sql 내용 복사 → 실행')
  console.log('   3. supabase/migrations/002_rls_policies.sql 내용 복사 → 실행')

  if (!status.hasGoogleOAuth || !status.hasFacebookOAuth || !status.hasKakaoOAuth) {
    console.log('\n📌 3단계: OAuth 설정')
    console.log('   • Google: https://console.cloud.google.com/')
    console.log('   • Facebook: https://developers.facebook.com/')
    console.log('   • Kakao: https://developers.kakao.com/')
  }

  // Mock mode removed; real Supabase required

  console.log('\n📌 5단계: 테스트 데이터 생성')
  console.log('   npm run db:generate')

  console.log('\n📌 6단계: 애플리케이션 재시작')
  console.log('   npm run dev')
}

/**
 * 메인 실행 함수
 */
async function main() {
  try {
    // 환경 변수 확인
    const envValid = checkEnvironmentVariables()

    // 마이그레이션 파일 확인
    const migrationFiles = listMigrationFiles()

    if (migrationFiles.length === 0) {
      console.error('❌ 마이그레이션 파일을 찾을 수 없습니다.')
      process.exit(1)
    }

    // 파일 검증
    const filesValid = validateMigrationFiles(migrationFiles)

    if (!filesValid) {
      console.error('❌ 마이그레이션 파일 검증 실패')
      process.exit(1)
    }

    // 현재 상태 확인
    const status = checkCurrentStatus()

    // 다음 단계 안내
    showNextSteps(status)

    console.log('\n✅ Supabase 설정 준비 완료!')
    console.log('   위의 단계를 순서대로 따라 진행하세요.')

  } catch (error) {
    console.error('❌ 설정 중 오류 발생:', error.message)
    process.exit(1)
  }
}

// CLI에서 직접 실행된 경우
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { main, checkEnvironmentVariables, listMigrationFiles }
