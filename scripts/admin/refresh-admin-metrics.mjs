#!/usr/bin/env node
// Load env from .env or .env.local
import fs from 'node:fs'
import path from 'node:path'
try {
  const dotenv = await import('dotenv')
  const envPath = fs.existsSync(path.join(process.cwd(), '.env'))
    ? path.join(process.cwd(), '.env')
    : (fs.existsSync(path.join(process.cwd(), '.env.local')) ? path.join(process.cwd(), '.env.local') : null)
  if (envPath) {
    dotenv.config({ path: envPath })
  } else {
    dotenv.config() // fallback
  }
} catch {}
import { createClient } from '@supabase/supabase-js'

function required(name, value) {
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required env: ${name}`)
  }
  return value
}

function startOfDay(date) { const d = new Date(date.getTime()); d.setHours(0,0,0,0); return d }
function startOfWeek(date) { const d = startOfDay(date); const day = d.getDay() || 7; d.setDate(d.getDate() - (day - 1)); return d }
function startOfMonth(date) { const d = startOfDay(date); d.setDate(1); return d }
function getDateKey(date) { return date.toISOString().slice(0,10) }
function countSince(rows, since) { return rows.reduce((t, c) => (c && new Date(c) >= since ? t + 1 : t), 0) }

async function main() {
  const SUPABASE_URL = required('SUPABASE_URL', process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL)
  const SERVICE_ROLE_KEY = required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY)

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })

  const now = new Date()
  const historyStart = new Date(now); historyStart.setDate(historyStart.getDate() - 29)
  const sinceISO = historyStart.toISOString()

  const q = t => supabase.from(t).select('created_at').gte('created_at', sinceISO).then(({ data, error }) => { if (error) throw error; return (data ?? []).map(r => r.created_at ?? null) })
  const [userRows, questionRows, answerRows, reportRows] = await Promise.all([
    q('users'), q('questions'), q('answers'), q('content_reports')
  ])

  const today = startOfDay(now), week = startOfWeek(now), month = startOfMonth(now)
  const summary = {
    daily:   { users: countSince(userRows, today),   questions: countSince(questionRows, today),   answers: countSince(answerRows, today),   reports: countSince(reportRows, today) },
    weekly:  { users: countSince(userRows, week),    questions: countSince(questionRows, week),    answers: countSince(answerRows, week),    reports: countSince(reportRows, week) },
    monthly: { users: countSince(userRows, month),   questions: countSince(questionRows, month),   answers: countSince(answerRows, month),   reports: countSince(reportRows, month) },
  }

  const trendMap = new Map()
  for (let i = 13; i >= 0; i -= 1) { const d = new Date(now); d.setDate(d.getDate() - i); trendMap.set(getDateKey(d), { users: 0, questions: 0, answers: 0, reports: 0 }) }
  const merge = (rows, key) => rows.forEach(c => { if (!c) return; const b = trendMap.get(getDateKey(new Date(c))); if (b) b[key] += 1 })
  merge(userRows, 'users'); merge(questionRows, 'questions'); merge(answerRows, 'answers'); merge(reportRows, 'reports')

  const trends = Array.from(trendMap.entries()).map(([date, metrics]) => ({ date, ...metrics }))
  const result = { generatedAt: now.toISOString(), summary, trends }

  const outDir = path.join('docs', 'operations')
  const outPath = path.join(outDir, 'admin-metrics-latest.json')
  try { fs.mkdirSync(outDir, { recursive: true }); fs.writeFileSync(outPath, JSON.stringify(result, null, 2)) } catch (e) { console.warn('⚠️ Failed to write file:', outPath, e) }
  console.log(JSON.stringify(result, null, 2))
}

main().catch((err) => {
  console.error('Admin metrics refresh failed.')
  console.error('Required envs: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  console.error(err)
  process.exit(1)
})
