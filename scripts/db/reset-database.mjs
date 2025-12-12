#!/usr/bin/env node

/**
 * Database reset script (plain ESM version)
 * Use when pnpm tsx scripts/db/reset-database.ts fails in restricted environments.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
})

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
  console.log(`   ${tablesToReset.join(', ')}`)
  console.log('='.repeat(60))

  for (const table of tablesToReset) {
    console.log(`🧹 Clearing table: ${table}`)
    const { error } = await supabase
      .from(table)
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) {
      console.error(`❌ Error clearing ${table}:`, error)
      throw error
    }

    console.log(`✅ Table ${table} cleared successfully`)
  }

  console.log('\n🔄 Resetting sequences...')
  try {
    await supabase.rpc('reset_category_sequence')
    console.log('✅ Category sequence reset')
  } catch (error) {
    console.log('ℹ️  Sequence reset not available (custom function not found)')
  }

  console.log('\n🎉 Database reset completed successfully!')
}

async function askForConfirmation() {
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

async function main() {
  console.log('🚨 DATABASE RESET WARNING 🚨')
  console.log('This will permanently delete all data in the database.\n')

  if (process.env.NODE_ENV === 'production') {
    console.log('❌ Cannot reset database in production environment')
    process.exit(1)
  }

  const confirmed = await askForConfirmation()
  if (!confirmed) {
    console.log('❌ Database reset cancelled')
    process.exit(0)
  }

  try {
    await resetDatabase()
    console.log('✅ Reset completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }
}

if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  main()
}
