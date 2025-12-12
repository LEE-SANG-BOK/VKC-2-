#!/usr/bin/env tsx

/**
 * 데이터베이스 초기화 스크립트
 * Agent 7 구현 - Viet K-Connect 데이터베이스 리셋
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'
import { pathToFileURL } from 'node:url'

// 환경변수 로드
dotenv.config({ path: '.env.local' })

// Supabase 클라이언트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

// 삭제할 테이블 목록 (의존성 순서 고려)
const tablesToReset = [
  'audit_logs',
  'notifications',
  'bookmarks',
  'comments',
  'votes',
  'answers',
  'questions',
  'users',
  'categories'
]

async function resetDatabase() {
  console.log('🗑️  Starting database reset...')
  console.log('⚠️  This will delete ALL data from the following tables:')
  console.log(`   ${tablesToReset.join(', ')}`)
  console.log('='.repeat(60))

  try {
    for (const table of tablesToReset) {
      console.log(`🧹 Clearing table: ${table}`)

      const { error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // 모든 레코드 삭제

      if (error) {
        console.error(`❌ Error clearing ${table}:`, error)
        throw error
      }

      console.log(`✅ Table ${table} cleared successfully`)
    }

    // 시퀀스 리셋 (PostgreSQL의 SERIAL 타입을 사용하는 테이블용)
    console.log('\n🔄 Resetting sequences...')

    try {
      // categories 테이블의 id 시퀀스 리셋
      await supabase.rpc('reset_category_sequence')
      console.log('✅ Category sequence reset')
    } catch (seqError) {
      console.log('ℹ️  Sequence reset not available (custom function not found)')
    }

    console.log('\n🎉 Database reset completed successfully!')
    console.log('='.repeat(60))
    console.log('✅ All tables have been cleared')
    console.log('✅ Database is ready for fresh data')
    console.log('💡 Run "npm run db:generate" to populate with mock data')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ Error resetting database:', error)
    process.exit(1)
  }
}

// 확인 프롬프트 함수
async function askForConfirmation(): Promise<boolean> {
  const rl = createInterface({ input, output })
  try {
    const answer = await rl.question(
      'Are you sure you want to reset the database? This cannot be undone. (yes/no): '
    )
    return answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y'
  } finally {
    rl.close()
  }
}

const isDirectExecution =
  process.argv[1] !== undefined && pathToFileURL(process.argv[1]).href === import.meta.url

// 스크립트 실행
if (isDirectExecution) {
  ;(async () => {
    console.log('🚨 DATABASE RESET WARNING 🚨')
    console.log('This will permanently delete all data in the database.')
    console.log('')

    // 환경이 production이면 추가 확인
    if (process.env.NODE_ENV === 'production') {
      console.log('❌ Cannot reset database in production environment')
      process.exit(1)
    }

    const confirmed = await askForConfirmation()

    if (!confirmed) {
      console.log('❌ Database reset cancelled')
      process.exit(0)
    }

    await resetDatabase()
    console.log('✅ Reset completed successfully')
    process.exit(0)
  })().catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
}
