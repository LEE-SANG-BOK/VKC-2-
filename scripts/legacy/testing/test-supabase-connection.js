#!/usr/bin/env node

/**
 * Supabase 연결 테스트 스크립트
 * Agent 3 작업: Supabase 초기 설정 검증
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// .env.local 파일 직접 파싱
function loadEnvLocal() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');

    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value && !key.startsWith('#')) {
        process.env[key.trim()] = value.trim();
      }
    });
  } catch (error) {
    console.log('⚠️ .env.local 파일을 읽을 수 없습니다:', error.message);
  }
}

loadEnvLocal();

async function testSupabaseConnection() {
  console.log('🔍 Supabase 연결 테스트 시작...\n');

  // 환경변수 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('📋 환경변수 확인:');
  console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅ 설정됨' : '❌ 누락'}`);
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? '✅ 설정됨' : '❌ 누락'}\n`);

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ 필수 환경변수가 누락되었습니다.');
    process.exit(1);
  }

  try {
    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔗 Supabase 클라이언트 생성 완료');

    // 간단한 헬스체크 (실제 프로젝트에서는 성공할 것)
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      // Mock 환경에서는 에러가 예상됨
      if (supabaseUrl.includes('mock-project')) {
        console.log('🟡 Mock 환경 감지 - 실제 연결은 실제 Supabase 프로젝트가 필요합니다');
        console.log('📝 Agent 4 DB 스키마 작업을 위해 실제 프로젝트 설정이 필요합니다');
      } else {
        console.log('❌ 연결 테스트 실패:', error.message);
      }
    } else {
      console.log('✅ Supabase 연결 성공!');
      console.log('📊 데이터:', data);
    }

  } catch (err) {
    console.log('❌ 연결 중 오류 발생:', err.message);
  }

  console.log('\n📋 다음 단계:');
  console.log('   1. 실제 Supabase 프로젝트 생성 (Seoul 리전)');
  console.log('   2. .env.local에 실제 프로젝트 URL 및 키 업데이트');
  console.log('   3. Agent 4 DB 스키마 작업 시작 가능');
  console.log('   4. Agent 5 인증 시스템 작업 시작 가능');
}

testSupabaseConnection().catch(console.error);

