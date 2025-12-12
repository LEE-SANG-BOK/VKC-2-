import { createSupabaseServerClient } from '@/lib/supabase-server'

async function main() {
  const client = await createSupabaseServerClient()
  const { data, error } = await client
    .from('questions')
    .select('id, is_approved, is_reported')
    .order('created_at', { ascending: false })
    .limit(5)

  console.log('error', error)
  console.log('data', data)
}

main().catch(console.error)
