#!/usr/bin/env tsx
/**
 * Supabase 마이그레이션 자동 적용 스크립트
 *
 * 사용법:
 *   npm run db:migrate
 *   또는
 *   tsx scripts/apply-migrations.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

// 환경 변수 로드
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.')
  console.error('   .env.local 파일을 확인하세요.')
  process.exit(1)
}

// Service Role 키로 Supabase 클라이언트 생성 (전체 권한)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function applyMigrations() {
  console.log('🚀 Supabase 마이그레이션 시작...\n')

  const migrationsDir = join(process.cwd(), 'supabase', 'migrations')

  // 마이그레이션 파일 목록 가져오기 (정렬)
  const migrationFiles = readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort()

  console.log(`📁 발견된 마이그레이션 파일: ${migrationFiles.length}개\n`)

  for (const file of migrationFiles) {
    console.log(`📝 실행 중: ${file}`)

    try {
      const filePath = join(migrationsDir, file)
      const sql = readFileSync(filePath, 'utf-8')

      let data: unknown = null
      let error: Error | null = null

      try {
        const response = await supabase.rpc('exec_sql', { sql_query: sql })
        data = response.data
        error = response.error
      } catch (rpcError: unknown) {
        console.warn('   ℹ️  exec_sql RPC 호출 실패, REST API로 재시도합니다.', rpcError)
        error = rpcError instanceof Error ? rpcError : new Error(String(rpcError))
      }

      if (error) {
        try {
          const restResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              apikey: supabaseServiceKey ?? '',
              Authorization: `Bearer ${supabaseServiceKey ?? ''}`
            },
            body: JSON.stringify({ sql_query: sql })
          })

          const responseText = await restResponse.text()
          if (!restResponse.ok) {
            throw new Error(
              `REST 호출 실패 (status: ${restResponse.status})${responseText ? ` - ${responseText}` : ''}`
            )
          }

          try {
            data = responseText ? JSON.parse(responseText) : null
          } catch {
            data = responseText
          }
          error = null
        } catch (restError: unknown) {
          const reason = restError instanceof Error ? restError.message : String(restError)
          console.error(`   ❌ 실패: ${reason}`)
          console.error(`   → SQL Editor에서 수동 실행을 권장합니다 (${file})`)
          continue
        }
      }

      if (data !== null || !error) {
        console.log('   ✅ 성공')
      }
    } catch (err) {
      console.error(`   ⚠️  오류: ${err}`)
      console.log(`   → SQL Editor에서 수동 실행을 권장합니다`)
    }

    console.log('')
  }

  console.log('✨ 마이그레이션 완료!\n')
  console.log('📊 데이터베이스 테이블 확인:')
  console.log('   https://supabase.com/dashboard/project/efgpisqicpfjaserekuc/editor\n')
}

// 실행
applyMigrations().catch(console.error)
