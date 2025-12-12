import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(url, key, { auth: { persistSession: false } })

async function run() {
  const { data: questions } = await supabase
    .from('questions')
    .select('id, is_approved, is_reported')
    .order('created_at', { ascending: false })
    .limit(5)
  console.log('questions', questions)
}

run().catch(console.error)
