#!/usr/bin/env tsx
/**
 * Supabase 연결 테스트 스크립트
 *
 * 실행: npm run db:test
 * 또는: tsx scripts/test-supabase-connection.ts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// 환경 변수 로드
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Supabase 연결 테스트 시작...\n')

// 환경 변수 확인
console.log('📋 환경 변수 확인:')
console.log(`  NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ 설정됨' : '❌ 없음'}`)
console.log(`  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? '✅ 설정됨' : '❌ 없음'}`)
// Mock mode flag removed

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.')
  console.error('   .env.local 파일을 확인하세요.\n')
  process.exit(1)
}

// Mock mode removed: real Supabase integration is required

// Supabase 클라이언트 생성
const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('🔌 Supabase 연결 테스트 중...')

    // 1. 카테고리 테이블 조회
    console.log('\n1️⃣ 카테고리 데이터 조회:')
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order')

    if (categoriesError) {
      console.error('   ❌ 카테고리 조회 실패:', categoriesError.message)
      return false
    }

    console.log(`   ✅ ${categories?.length || 0}개 카테고리 발견`)
    if (categories && categories.length > 0) {
      categories.forEach((cat: any) => {
        console.log(`      ${cat.icon} ${cat.name} (${cat.slug})`)
      })
    }

    // 2. 사용자 테이블 확인
    console.log('\n2️⃣ 사용자 테이블 확인:')
    const { count: userCount, error: userError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (userError) {
      console.error('   ❌ 사용자 테이블 확인 실패:', userError.message)
      return false
    }

    console.log(`   ✅ ${userCount || 0}명의 사용자`)

    // 3. 질문 테이블 확인
    console.log('\n3️⃣ 질문 테이블 확인:')
    const { count: questionCount, error: questionError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })

    if (questionError) {
      console.error('   ❌ 질문 테이블 확인 실패:', questionError.message)
      return false
    }

    console.log(`   ✅ ${questionCount || 0}개의 질문`)

    // 4. 전체 테이블 목록 확인
    console.log('\n4️⃣ 데이터베이스 테이블 목록:')
    const tables = ['categories', 'users', 'questions', 'answers', 'votes', 'comments', 'notifications']

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`   ❌ ${table}: 접근 불가 (${error.message})`)
      } else {
        console.log(`   ✅ ${table}: ${count || 0}개 레코드`)
      }
    }

    console.log('\n✅ 모든 연결 테스트 통과!')
    console.log('\n📊 데이터베이스 상태:')
    console.log(`   URL: ${supabaseUrl}`)
    console.log(`   연결: 정상`)
    // Mock mode removed

    return true
  } catch (error) {
    console.error('\n❌ 연결 테스트 실패:', error)
    return false
  }
}

// 실행
testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Supabase 연결이 성공적으로 설정되었습니다!')
    console.log('   이제 npm run dev로 개발 서버를 시작할 수 있습니다.\n')
    process.exit(0)
  } else {
    console.error('\n💥 연결 테스트에 실패했습니다.')
    console.error('   위의 오류 메시지를 확인하고 수정해주세요.\n')
    process.exit(1)
  }
})
