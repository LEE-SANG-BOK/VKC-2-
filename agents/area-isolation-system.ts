/**
 * 🚧 Area Isolation System - 영역별 작업 분리 및 충돌 방지
 *
 * 역할:
 * - 영역 A (Frontend): components/, app/globals.css, src/styles/
 * - 영역 B (Backend): lib/, app/api/, supabase/
 * - 영역 C (Config): package.json, next.config.js, .github/, 설정 파일
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import path from 'path'

export enum WorkArea {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  CONFIG = 'config',
  SHARED = 'shared'
}

export interface AreaRule {
  area: WorkArea
  allowedPaths: string[]
  deniedPaths: string[]
  permissions: ('read' | 'write' | 'delete')[]
}

export interface ViolationLog {
  timestamp: string
  area: WorkArea
  agentId: string
  attemptedPath: string
  action: string
  violation: string
}

export class AreaIsolationSystem {
  private static instance: AreaIsolationSystem
  private rules: Map<WorkArea, AreaRule> = new Map()
  private violations: ViolationLog[] = []
  private activeAgents: Map<string, WorkArea> = new Map()

  private constructor() {
    this.initializeRules()
  }

  public static getInstance(): AreaIsolationSystem {
    if (!AreaIsolationSystem.instance) {
      AreaIsolationSystem.instance = new AreaIsolationSystem()
    }
    return AreaIsolationSystem.instance
  }

  /**
   * 영역별 접근 규칙 초기화
   */
  private initializeRules(): void {
    // 영역 A: Frontend
    this.rules.set(WorkArea.FRONTEND, {
      area: WorkArea.FRONTEND,
      allowedPaths: [
        'components/',
        'app/globals.css',
        'src/styles/',
        'public/images/',
        'app/layout.tsx', // Layout 파일은 Frontend 영역
        'app/page.tsx'    // Page 파일은 Frontend 영역
      ],
      deniedPaths: [
        'lib/',
        'app/api/',
        'supabase/',
        'package.json',
        'next.config.js',
        '.env*'
      ],
      permissions: ['read', 'write']
    })

    // 영역 B: Backend
    this.rules.set(WorkArea.BACKEND, {
      area: WorkArea.BACKEND,
      allowedPaths: [
        'lib/',
        'app/api/',
        'supabase/',
        'scripts/db/',
        'contexts/', // Auth Context는 Backend 영역
        'types/'     // Database types는 Backend 영역
      ],
      deniedPaths: [
        'components/',
        'app/globals.css',
        'src/styles/',
        'package.json',
        'next.config.js'
      ],
      permissions: ['read', 'write']
    })

    // 영역 C: Config/Build
    this.rules.set(WorkArea.CONFIG, {
      area: WorkArea.CONFIG,
      allowedPaths: [
        'package.json',
        'next.config.js',
        'tsconfig.json',
        'tailwind.config.js',
        '.github/',
        '.env*',
        'scripts/',
        'public/', // 정적 파일은 Config 영역
        '*.md'     // 문서 파일은 Config 영역
      ],
      deniedPaths: [
        'components/',
        'lib/',
        'app/api/',
        'supabase/'
      ],
      permissions: ['read', 'write']
    })

    // 공유 영역: 모든 영역에서 읽기만 가능
    this.rules.set(WorkArea.SHARED, {
      area: WorkArea.SHARED,
      allowedPaths: ['*'],
      deniedPaths: [],
      permissions: ['read']
    })
  }

  /**
   * 에이전트 영역 등록
   */
  public registerAgent(agentId: string, area: WorkArea): void {
    this.activeAgents.set(agentId, area)
    console.log(`🤖 Agent ${agentId} registered in ${area} area`)
  }

  /**
   * 파일 접근 권한 검증
   */
  public validateAccess(agentId: string, filePath: string, action: 'read' | 'write' | 'delete'): boolean {
    const agentArea = this.activeAgents.get(agentId)
    if (!agentArea) {
      this.logViolation(agentId, filePath, action, 'Agent not registered')
      return false
    }

    const rule = this.rules.get(agentArea)
    if (!rule) {
      this.logViolation(agentId, filePath, action, 'No rules found for area')
      return false
    }

    // 권한 확인
    if (!rule.permissions.includes(action)) {
      this.logViolation(agentId, filePath, action, `Action ${action} not permitted`)
      return false
    }

    // 경로 확인
    const isAllowed = this.isPathAllowed(filePath, rule)
    const isDenied = this.isPathDenied(filePath, rule)

    if (isDenied || !isAllowed) {
      this.logViolation(agentId, filePath, action, 'Path access denied')
      return false
    }

    console.log(`✅ Access granted: ${agentId} → ${filePath} (${action})`)
    return true
  }

  /**
   * 경로 허용 여부 확인
   */
  private isPathAllowed(filePath: string, rule: AreaRule): boolean {
    return rule.allowedPaths.some(pattern => {
      if (pattern === '*') return true
      if (pattern.endsWith('/')) {
        return filePath.startsWith(pattern)
      }
      if (pattern.startsWith('*')) {
        return filePath.endsWith(pattern.slice(1))
      }
      return filePath.includes(pattern)
    })
  }

  /**
   * 경로 거부 여부 확인
   */
  private isPathDenied(filePath: string, rule: AreaRule): boolean {
    return rule.deniedPaths.some(pattern => {
      if (pattern.endsWith('/')) {
        return filePath.startsWith(pattern)
      }
      if (pattern.startsWith('*')) {
        return filePath.endsWith(pattern.slice(1))
      }
      return filePath.includes(pattern)
    })
  }

  /**
   * 위반 사항 로깅
   */
  private logViolation(agentId: string, filePath: string, action: string, violation: string): void {
    const agentArea = this.activeAgents.get(agentId) || WorkArea.SHARED

    const log: ViolationLog = {
      timestamp: new Date().toISOString(),
      area: agentArea,
      agentId,
      attemptedPath: filePath,
      action,
      violation
    }

    this.violations.push(log)

    console.error(`🚨 AREA VIOLATION: ${agentId} (${agentArea}) attempted ${action} on ${filePath}`)
    console.error(`   Reason: ${violation}`)

    // 위반 사항을 파일로 저장
    this.saveViolationLog(log)
  }

  /**
   * 위반 로그 파일 저장
   */
  private saveViolationLog(log: ViolationLog): void {
    const logPath = '/Users/bk/Desktop/viet-kconnect/logs/area-violations.jsonl'

    try {
      const logLine = JSON.stringify(log) + '\n'
      writeFileSync(logPath, logLine, { flag: 'a' })
    } catch (error) {
      console.error('Failed to save violation log:', error)
    }
  }

  /**
   * 영역 상태 확인
   */
  public getAreaStatus(): { areas: WorkArea[], agents: Map<string, WorkArea>, violations: number } {
    return {
      areas: Array.from(this.rules.keys()),
      agents: this.activeAgents,
      violations: this.violations.length
    }
  }

  /**
   * 최근 위반 사항 조회
   */
  public getRecentViolations(limit: number = 10): ViolationLog[] {
    return this.violations.slice(-limit)
  }

  /**
   * 안전한 파일 작업 래퍼
   */
  public safeFileOperation<T>(
    agentId: string,
    filePath: string,
    operation: 'read' | 'write' | 'delete',
    callback: () => T
  ): T | null {
    if (!this.validateAccess(agentId, filePath, operation)) {
      throw new Error(`Access denied: ${agentId} cannot ${operation} ${filePath}`)
    }

    try {
      return callback()
    } catch (error) {
      this.logViolation(agentId, filePath, operation, `Operation failed: ${error}`)
      throw error
    }
  }

  /**
   * 영역간 통신 채널
   */
  public sendMessage(fromAgent: string, toArea: WorkArea, message: any): boolean {
    const fromArea = this.activeAgents.get(fromAgent)
    if (!fromArea) {
      console.error(`❌ Message rejected: ${fromAgent} not registered`)
      return false
    }

    console.log(`📨 Message: ${fromAgent} (${fromArea}) → ${toArea}`)
    console.log(`   Content:`, message)

    // 메시지는 JSON 파일로 저장하여 영역간 공유
    const messageFile = `/Users/bk/Desktop/viet-kconnect/logs/area-messages.json`

    try {
      let messages: any[] = []
      if (existsSync(messageFile)) {
        messages = JSON.parse(readFileSync(messageFile, 'utf8'))
      }

      messages.push({
        timestamp: new Date().toISOString(),
        from: fromAgent,
        fromArea,
        toArea,
        message
      })

      writeFileSync(messageFile, JSON.stringify(messages, null, 2))
      return true
    } catch (error) {
      console.error('Failed to send message:', error)
      return false
    }
  }

  /**
   * 충돌 감지 시스템
   */
  public detectConflicts(): Array<{ file: string, areas: WorkArea[] }> {
    const conflicts: Array<{ file: string, areas: WorkArea[] }> = []

    // 현재 활성 에이전트들이 동시에 접근 시도하는 파일 감지
    const accessMap = new Map<string, WorkArea[]>()

    // 이는 실제 구현에서는 파일 시스템 모니터링으로 대체
    // 현재는 규칙 기반으로 잠재적 충돌 영역 식별
    const potentialConflicts = [
      'app/layout.tsx',    // Frontend vs Config
      'app/page.tsx',      // Frontend vs Backend (데이터 연결)
      'types/',            // Backend vs Frontend (타입 공유)
      'lib/utils.ts'       // Backend vs Frontend (유틸리티 공유)
    ]

    potentialConflicts.forEach(file => {
      const accessingAreas: WorkArea[] = []

      this.rules.forEach((rule, area) => {
        if (this.isPathAllowed(file, rule)) {
          accessingAreas.push(area)
        }
      })

      if (accessingAreas.length > 1) {
        conflicts.push({ file, areas: accessingAreas })
      }
    })

    return conflicts
  }
}

// 싱글톤 인스턴스 내보내기
export const areaIsolation = AreaIsolationSystem.getInstance()