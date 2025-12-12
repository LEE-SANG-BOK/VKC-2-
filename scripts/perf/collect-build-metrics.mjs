#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

function parseBuildOutput(stdout) {
  const lines = stdout.split(/\r?\n/)
  const report = { measuredAt: new Date().toISOString(), routes: {} }

  const verLine = lines.find(l => l.includes('Next.js'))
  if (verLine) {
    const m = verLine.match(/Next\.js\s+([\d.]+)/)
    if (m) report.nextVersion = m[1]
  }

  let inRoutes = false
  let inShared = false

  for (const raw of lines) {
    const line = raw.replace(/\u001b\[[0-9;]*m/g, '')

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

    if (inRoutes && !inShared) {
      const routeRow = line.trim()
      if (!routeRow) continue
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
  const res = spawnSync('npm', ['run', 'build'], { encoding: 'utf8' })
  const stdout = (res.stdout || '') + '\n' + (res.stderr || '')
  if (res.status !== 0) {
    console.error('Build failed. Cannot collect metrics.')
    process.exit(res.status ?? 1)
  }
  const report = parseBuildOutput(stdout)
  const outDir = path.join('docs', 'perf')
  fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, 'latest-bundle-report.json')
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2))
  console.log(`[perf] wrote ${outPath}`)
}

main()

