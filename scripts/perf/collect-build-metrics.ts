#!/usr/bin/env tsx
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

type RouteReport = { firstLoadJS: string; size?: string }
type Report = {
  measuredAt: string
  nextVersion?: string
  sharedFirstLoadJS?: string
  routes: Record<string, RouteReport>
  sharedChunks?: Array<{ file: string; size: string }>
}

function parseBuildOutput(stdout: string): Report {
  const lines = stdout.split(/\r?\n/)
  const report: Report = { measuredAt: new Date().toISOString(), routes: {} }

  // Try to detect Next version line
  const verLine = lines.find(l => l.includes('Next.js'))
  if (verLine) {
    const m = verLine.match(/Next\.js\s+([\d.]+)/)
    if (m) report.nextVersion = m[1]
  }

  let inRoutes = false
  let inShared = false

  for (const raw of lines) {
    const line = raw.replace(/\u001b\[[0-9;]*m/g, '') // strip ANSI

    if (line.includes('Route (app)') || line.includes('Route (pages)')) {
      inRoutes = true
      inShared = false
      continue
    }
    if (inRoutes && line.startsWith('+ First Load JS shared by all')) {
      const m = line.match(/([0-9.]+\s*[kM]?B)\s*$/)
      if (m) report.sharedFirstLoadJS = m[1].replace(/\s+/g, ' ')
      inShared = true
      continue
    }
    if (inRoutes && (line.startsWith('ƒ Middleware') || line.startsWith('○') || line.startsWith('ƒ') || line.startsWith('└') || line.startsWith('—'))) {
      // ignore footer/separators
    }

    if (inRoutes && !inShared) {
      // route rows e.g. "┌ ƒ /      11.4 kB        122 kB" or "├ ○ /following 8.1 kB 171 kB"
      const routeRow = line.trim()
      if (!routeRow) continue
      // Find path by matching symbol + optional marker then space then path until two spaces
      const routeMatch = routeRow.match(/[┌├└]\s+[ƒ○]\s+([^\s]+)\s+(.*)$/)
      if (routeMatch) {
        const route = routeMatch[1]
        const tail = routeMatch[2]
        const sizeMatch = tail.match(/([0-9.]+\s*[kM]?B)/)
        const firstMatch = tail.match(/([0-9.]+\s*[kM]?B)\s*$/)
        if (firstMatch) {
          report.routes[route] = {
            firstLoadJS: firstMatch[1].replace(/\s+/g, ' '),
            size: sizeMatch ? sizeMatch[1].replace(/\s+/g, ' ') : undefined,
          }
        }
      }
    }

    if (inRoutes && inShared) {
      // shared chunk lines e.g. "  ├ chunks/xxxx.js   45.6 kB"
      const sharedMatch = line.match(/chunks\/[\w.-]+\.js/)
      if (sharedMatch) {
        const file = sharedMatch[0]
        const sizeMatch = line.match(/([0-9.]+\s*[kM]?B)\s*$/)
        const size = sizeMatch ? sizeMatch[1].replace(/\s+/g, ' ') : 'n/a'
        report.sharedChunks = report.sharedChunks ?? []
        report.sharedChunks.push({ file, size })
      }
    }
  }

  return report
}

function main() {
  const shouldBuild = !process.argv.includes('--skip-build')
  let stdout = ''
  if (shouldBuild) {
    const res = spawnSync('npm', ['run', 'build'], { encoding: 'utf8' })
    stdout = (res.stdout || '') + '\n' + (res.stderr || '')
    if (res.status !== 0) {
      console.error('Build failed. Cannot collect metrics.')
      process.exit(res.status ?? 1)
    }
  } else {
    console.error('[warn] --skip-build: parsing previous build output is not implemented in this repo')
    process.exit(1)
  }

  const report = parseBuildOutput(stdout)
  const outDir = path.join('docs', 'perf')
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'latest-bundle-report.json')
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2))
  console.log(`[perf] wrote ${outPath}`)
}

main()

