import type { PostgrestResponse } from '@supabase/supabase-js'
import { createSupabaseServiceClient } from '@/lib/supabase-server'
import { generateUniqueNickname, type NicknameContext } from '@/lib/utils/nickname-generator'
import type { Database } from '@/lib/supabase'

type UserRow = Pick<
  Database['public']['Tables']['users']['Row'],
  'id' | 'name' | 'specialty_areas' | 'region' | 'preferred_language'
>
type UserUpdate = Database['public']['Tables']['users']['Update']

async function main() {
  const targetIds = process.argv
    .slice(2)
    .map((value) => value.trim())
    .filter((value): value is string => value.length > 0)
  const supabase = createSupabaseServiceClient()

  const baseQuery = supabase
    .from('users')
    .select('id, name, specialty_areas, region, preferred_language')
    .neq('role', 'guest')

  const response: PostgrestResponse<UserRow> =
    targetIds.length > 0 ? await baseQuery.in('id', targetIds) : await baseQuery
  const { data: users, error } = response

  if (error) {
    console.error('[backfill-nicknames] 사용자 조회 실패:', error.message)
    process.exit(1)
  }

  if (!users || users.length === 0) {
    console.log('[backfill-nicknames] 갱신할 사용자가 없습니다.')
    return
  }

  const report: Array<{ id: string; previous: string | null; next: string }> = []

  for (const user of users) {
    const topics = Array.isArray(user.specialty_areas)
      ? user.specialty_areas.filter((topic): topic is string => typeof topic === 'string')
      : undefined

    const context: NicknameContext = {
      residence: user.region ?? undefined,
      gender: undefined,
      age: undefined,
      category: undefined,
      topics,
      interests: undefined
    }

    const nickname = generateUniqueNickname(context)

    const updatePayload: UserUpdate = {
      name: nickname,
      updated_at: new Date().toISOString()
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('id', user.id)

    if (updateError) {
      console.error(`[backfill-nicknames] ${user.id} 닉네임 업데이트 실패:`, updateError.message)
      continue
    }

    report.push({ id: user.id, previous: user.name ?? null, next: nickname })
  }

  if (report.length > 0) {
    console.log('닉네임 갱신 완료:')
    for (const item of report) {
      console.log(` - ${item.id}: ${item.previous ?? '(기존 없음)'} → ${item.next}`)
    }
  }
}

main().catch((error) => {
  console.error('[backfill-nicknames] 예기치 않은 오류:', error)
  process.exit(1)
})
