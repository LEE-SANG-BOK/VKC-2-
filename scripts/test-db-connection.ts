#!/usr/bin/env tsx

/**
 * Supabase 데이터베이스 연결 테스트
 * 실제 DB 연결 및 기본 CRUD 테스트
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from '../lib/supabase'

// 환경변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Supabase 연결 테스트 시작...')
console.log(`📍 URL: ${supabaseUrl}`)
console.log(`🔑 Key: ${supabaseAnonKey?.substring(0, 20)}...`)

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 환경변수 누락:')
  console.error('   - NEXT_PUBLIC_SUPABASE_URL')
  console.error('   - NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.error('\n💡 .env.local 파일에 실제 Supabase 정보를 입력해주세요.')
  process.exit(1)
}

// URL 형식 검증
if (!supabaseUrl.includes('supabase.co')) {
  console.error('❌ Supabase URL이 올바르지 않습니다.')
  console.error('   예시: https://your-project-ref.supabase.co')
  process.exit(1)
}

// 클라이언트 생성
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('\n🔗 1. 기본 연결 테스트...')

    // 기본 연결 테스트
    const { data, error } = await supabase
      .from('categories')
      .select('count')
      .limit(1)

    if (error) {
      console.error('❌ 연결 실패:', error.message)

      if (error.message.includes('JWT')) {
        console.error('🔑 인증 오류: SUPABASE_ANON_KEY를 확인해주세요.')
      } else if (error.message.includes('not found')) {
        console.error('📊 테이블 오류: categories 테이블이 존재하지 않습니다.')
      } else {
        console.error('🌐 네트워크 오류: URL이나 네트워크 연결을 확인해주세요.')
      }

      return false
    }

    console.log('✅ 기본 연결 성공')

    // 테이블 구조 확인
    console.log('\n📋 2. 테이블 구조 확인...')

    const tables = ['categories', 'users', 'questions', 'answers']
    const tableStatus = {}

    for (const table of tables) {
      try {
        const { count, error: tableError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (tableError) {
          console.log(`❌ ${table}: ${tableError.message}`)
          tableStatus[table] = 'error'
        } else {
          console.log(`✅ ${table}: ${count || 0}개 레코드`)
          tableStatus[table] = count || 0
        }
      } catch (e) {
        console.log(`❌ ${table}: ${e.message}`)
        tableStatus[table] = 'error'
      }
    }

    // RLS 정책 테스트
    console.log('\n🛡️  3. RLS 정책 테스트...')

    try {
      const { data: testInsert, error: insertError } = await supabase
        .from('categories')
        .insert({
          name: 'Test Category',
          slug: 'test-category-' + Date.now(),
          color: '#000000',
          sort_order: 999,
          is_active: false
        })
        .select()

      if (insertError) {
        if (insertError.message.includes('RLS')) {
          console.log('🔒 RLS 정책 활성화됨 (정상)')
        } else {
          console.log(`⚠️ 삽입 테스트 실패: ${insertError.message}`)
        }
      } else {
        console.log('✅ 테스트 데이터 삽입 성공')

        // 테스트 데이터 삭제
        await supabase
          .from('categories')
          .delete()
          .eq('id', testInsert[0].id)

        console.log('🗑️ 테스트 데이터 삭제 완료')
      }
    } catch (e) {
      console.log(`⚠️ RLS 테스트 중 오류: ${e.message}`)
    }

    // 결과 요약
    console.log('\n📊 연결 테스트 결과:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`🔗 기본 연결: ✅ 성공`)
    console.log(`📋 테이블 상태:`)

    Object.entries(tableStatus).forEach(([table, status]) => {
      const icon = status === 'error' ? '❌' : '✅'
      const info = status === 'error' ? '오류' : `${status}개`
      console.log(`   ${icon} ${table}: ${info}`)
    })

    const hasErrors = Object.values(tableStatus).some(status => status === 'error')

    if (hasErrors) {
      console.log('\n⚠️ 일부 테이블에 문제가 있습니다.')
      console.log('🛠️ 해결 방법:')
      console.log('   1. Supabase 대시보드에서 마이그레이션 실행')
      console.log('   2. RLS 정책 설정 확인')
      console.log('   3. 테이블 생성 상태 확인')
      return false
    } else {
      console.log('\n🎉 모든 테스트 통과!')
      console.log('🚀 실제 데이터베이스 연결 준비 완료')
      return true
    }

  } catch (error) {
    console.error('❌ 테스트 중 예상치 못한 오류:', error)
    return false
  }
}

async function main() {
  const success = await testConnection()

  if (success) {
    console.log('\n✅ 다음 단계:')
    console.log('   npm run db:seed     # 시드 데이터 삽입')
    console.log('   npm run dev         # 개발 서버 시작')
    process.exit(0)
  } else {
    console.log('\n❌ 연결 실패:')
    console.log('   환경변수 및 Supabase 설정을 확인해주세요.')
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}