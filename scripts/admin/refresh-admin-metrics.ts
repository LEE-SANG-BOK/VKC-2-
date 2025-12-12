#!/usr/bin/env tsx
/*
  Refresh admin metrics summary/trend using Supabase service role.
  - Env required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
  - Usage: npm run admin:metrics
  - Output: Prints JSON to stdout and writes docs/operations/admin-metrics-latest.json
*/

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'

type SummaryBucket = {
  users: number
  questions: number
  answers: number
  reports: number
}

type TrendPoint = SummaryBucket & { date: string }

const DAYS_HISTORY = 30
const TREND_DAYS = 14

function required(name: string, value?: string) {
  if (!value || !value.trim()) {
    throw new Error(`Missing required env: ${name}`)
  }
  return value
}

function startOfDay(date: Date) {
  const d = new Date(date.getTime())
  d.setHours(0, 0, 0, 0)
  return d
}
function startOfWeek(date: Date) {
  const d = startOfDay(date)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - (day - 1))
  return d
}
function startOfMonth(date: Date) {
  const d = startOfDay(date)
  d.setDate(1)
  return d
}
function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function countSince(rows: Array<string | null>, since: Date) {
  if (!rows.length) return 0
  return rows.reduce((total, createdAt) => {
    if (!createdAt) return total
    const created = new Date(createdAt)
    return created >= since ? total + 1 : total
  }, 0)
}

async function main() {
  const SUPABASE_URL = required('SUPABASE_URL', process.env.SUPABASE_URL)
  const SERVICE_ROLE_KEY = required('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY)

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  const now = new Date()
  const historyStart = new Date(now)
  historyStart.setDate(historyStart.getDate() - (DAYS_HISTORY - 1))
  const sinceISO = historyStart.toISOString()

  const [userRows, questionRows, answerRows, reportRows] = await Promise.all([
    supabase.from('users').select('created_at').gte('created_at', sinceISO).then(({ data, error }) => {
      if (error) throw error
      return data?.map(r => r.created_at ?? null) ?? []
    }),
    supabase.from('questions').select('created_at').gte('created_at', sinceISO).then(({ data, error }) => {
      if (error) throw error
      return data?.map(r => r.created_at ?? null) ?? []
    }),
    supabase.from('answers').select('created_at').gte('created_at', sinceISO).then(({ data, error }) => {
      if (error) throw error
      return data?.map(r => r.created_at ?? null) ?? []
    }),
    supabase.from('content_reports').select('created_at').gte('created_at', sinceISO).then(({ data, error }) => {
      if (error) throw error
      return data?.map(r => r.created_at ?? null) ?? []
    })
  ])

  const todayStart = startOfDay(now)
  const weekStart = startOfWeek(now)
  const monthStart = startOfMonth(now)

  const summary = {
    daily: {
      users: countSince(userRows, todayStart),
      questions: countSince(questionRows, todayStart),
      answers: countSince(answerRows, todayStart),
      reports: countSince(reportRows, todayStart)
    },
    weekly: {
      users: countSince(userRows, weekStart),
      questions: countSince(questionRows, weekStart),
      answers: countSince(answerRows, weekStart),
      reports: countSince(reportRows, weekStart)
    },
    monthly: {
      users: countSince(userRows, monthStart),
      questions: countSince(questionRows, monthStart),
      answers: countSince(answerRows, monthStart),
      reports: countSince(reportRows, monthStart)
    }
  }

  const trendMap = new Map<string, SummaryBucket>()
  for (let i = TREND_DAYS - 1; i >= 0; i -= 1) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    trendMap.set(getDateKey(d), { users: 0, questions: 0, answers: 0, reports: 0 })
  }
  const merge = (rows: Array<string | null>, key: keyof SummaryBucket) => {
    rows.forEach((createdAt) => {
      if (!createdAt) return
      const created = new Date(createdAt)
      const bucket = trendMap.get(getDateKey(created))
      if (bucket) bucket[key] += 1
    })
  }
  merge(userRows, 'users')
  merge(questionRows, 'questions')
  merge(answerRows, 'answers')
  merge(reportRows, 'reports')

  const trends: TrendPoint[] = Array.from(trendMap.entries()).map(([date, metrics]) => ({ date, ...metrics }))

  const result = {
    generatedAt: now.toISOString(),
    summary,
    trends
  }

  const outDir = path.join('docs', 'operations')
  const outPath = path.join(outDir, 'admin-metrics-latest.json')
  try {
    fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2))
  } catch (e) {
    console.warn('⚠️ Failed to write file:', outPath, e)
  }

  console.log(JSON.stringify(result, null, 2))
}

main().catch((err) => {
  const help = [
    'Admin metrics refresh failed.',
    'Required envs:',
    '  - SUPABASE_URL=https://<project>.supabase.co',
    '  - SUPABASE_SERVICE_ROLE_KEY=<service_role_key>',
    'Troubleshooting:',
    '  1) Verify project URL/key and network egress',
    '  2) Check RLS policies allow service role',
    '  3) Tables required: users, questions, answers, content_reports',
  ].join('\n')
  console.error(help)
  console.error(err)
  process.exit(1)
})

