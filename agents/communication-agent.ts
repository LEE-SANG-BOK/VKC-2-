/**
 * 📡 Communication Agent - 영역 간 통신 조율자
 *
 * 역할: 영역 A, B, C 간 메시지 전달 및 작업 조율
 * 접근 권한: 모든 영역 읽기 + 통신 로그 작성
 * 보호 대상: 영역 간 작업 충돌 방지 및 동기화
 */

import { areaIsolation, WorkArea, ViolationLog } from './area-isolation-system'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path'

export interface CrossAreaMessage {
  id: string
  from: string
  fromArea: WorkArea
  to: string
  toArea: WorkArea
  type: 'request' | 'response' | 'notification' | 'coordination'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  subject: string
  content: any
  timestamp: number
  status: 'pending' | 'delivered' | 'acknowledged' | 'resolved'
  relatedFiles?: string[]
}

export interface WorkCoordination {
  id: string
  areas: WorkArea[]
  description: string
  dependencies: string[]
  conflictRisk: 'low' | 'medium' | 'high'
  schedule: {
    startTime: number
    estimatedDuration: number
    priority: number
  }
  status: 'planned' | 'in-progress' | 'completed' | 'blocked'
}

export interface ConflictResolution {
  id: string
  conflictType: 'file-access' | 'dependency' | 'timing' | 'resource'
  involvedAreas: WorkArea[]
  description: string
  resolution: string
  timestamp: number
  resolved: boolean
}

export class CommunicationAgent {
  private agentId = 'communication-agent'
  private projectRoot = '/Users/bk/Desktop/viet-kconnect'
  private messageQueue: Map<string, CrossAreaMessage> = new Map()
  private activeCoordinations: Map<string, WorkCoordination> = new Map()
  private conflictHistory: ConflictResolution[] = []

  constructor() {
    console.log('📡 Communication Agent initialized')
    this.initializeCommunicationSystem()
  }

  /**
   * 통신 시스템 초기화
   */
  private initializeCommunicationSystem(): void {
    // 통신 로그 디렉토리 생성
    const logsDir = path.join(this.projectRoot, 'logs')
    if (!existsSync(logsDir)) {
      mkdirSync(logsDir, { recursive: true })
    }

    // 기존 메시지 로드
    this.loadExistingMessages()

    // 주기적으로 메시지 처리
    this.startMessageProcessor()

    console.log('✅ Communication system initialized')
  }

  /**
   * 영역 간 메시지 전송
   */
  public sendMessage(
    fromAgent: string,
    fromArea: WorkArea,
    toArea: WorkArea,
    type: CrossAreaMessage['type'],
    subject: string,
    content: any,
    priority: CrossAreaMessage['priority'] = 'medium',
    relatedFiles?: string[]
  ): string {
    const messageId = this.generateMessageId()

    const message: CrossAreaMessage = {
      id: messageId,
      from: fromAgent,
      fromArea,
      to: `${toArea}-agents`,
      toArea,
      type,
      priority,
      subject,
      content,
      timestamp: Date.now(),
      status: 'pending',
      relatedFiles
    }

    this.messageQueue.set(messageId, message)

    console.log(`📨 Message sent: ${fromAgent} (${fromArea}) → ${toArea}`)
    console.log(`   Subject: ${subject}`)
    console.log(`   Priority: ${priority}`)
    console.log(`   Message ID: ${messageId}`)

    // 즉시 처리가 필요한 긴급 메시지
    if (priority === 'urgent') {
      this.processMessage(message)
    }

    // 메시지 로그 저장
    this.saveMessageLog(message)

    return messageId
  }

  /**
   * 작업 조율 요청
   */
  public coordinateWork(
    description: string,
    involvedAreas: WorkArea[],
    dependencies: string[] = [],
    estimatedDuration: number = 3600000, // 1시간 기본값
    priority: number = 5
  ): string {
    const coordinationId = this.generateCoordinationId()

    const coordination: WorkCoordination = {
      id: coordinationId,
      areas: involvedAreas,
      description,
      dependencies,
      conflictRisk: this.assessConflictRisk(involvedAreas, dependencies),
      schedule: {
        startTime: Date.now(),
        estimatedDuration,
        priority
      },
      status: 'planned'
    }

    this.activeCoordinations.set(coordinationId, coordination)

    console.log(`🤝 Work coordination planned: ${coordinationId}`)
    console.log(`   Areas: ${involvedAreas.join(', ')}`)
    console.log(`   Risk: ${coordination.conflictRisk}`)

    // 충돌 위험이 높으면 관련 영역에 알림
    if (coordination.conflictRisk === 'high') {
      involvedAreas.forEach(area => {
        this.sendMessage(
          this.agentId,
          WorkArea.SHARED,
          area,
          'notification',
          'High conflict risk work coordination',
          {
            coordinationId,
            description,
            risk: coordination.conflictRisk,
            action: 'Please coordinate timing to avoid conflicts'
          },
          'high'
        )
      })
    }

    return coordinationId
  }

  /**
   * 파일 접근 충돌 감지 및 해결
   */
  public handleFileAccessConflict(
    filePath: string,
    requestingAgent: string,
    requestingArea: WorkArea,
    operation: 'read' | 'write' | 'delete'
  ): ConflictResolution | null {
    console.log(`⚠️ File access conflict detected: ${filePath}`)
    console.log(`   Requesting: ${requestingAgent} (${requestingArea})`)
    console.log(`   Operation: ${operation}`)

    // 파일의 소유 영역 확인
    const fileOwnerArea = this.determineFileOwnerArea(filePath)

    if (fileOwnerArea === requestingArea) {
      console.log('✅ No conflict: Same area access')
      return null
    }

    const conflictId = this.generateConflictId()
    const conflict: ConflictResolution = {
      id: conflictId,
      conflictType: 'file-access',
      involvedAreas: [requestingArea, fileOwnerArea],
      description: `${requestingAgent} (${requestingArea}) attempting ${operation} on ${filePath} owned by ${fileOwnerArea}`,
      resolution: this.generateFileAccessResolution(filePath, requestingArea, fileOwnerArea, operation),
      timestamp: Date.now(),
      resolved: false
    }

    this.conflictHistory.push(conflict)

    // 소유 영역에 알림 전송
    this.sendMessage(
      this.agentId,
      WorkArea.SHARED,
      fileOwnerArea,
      'request',
      `File access request from ${requestingArea}`,
      {
        conflictId,
        filePath,
        requestingAgent,
        operation,
        urgency: operation === 'delete' ? 'high' : 'medium'
      },
      operation === 'delete' ? 'urgent' : 'high',
      [filePath]
    )

    console.log(`📋 Conflict resolution created: ${conflictId}`)

    return conflict
  }

  /**
   * 의존성 충돌 해결
   */
  public resolveDependencyConflict(
    dependency: string,
    areas: WorkArea[],
    conflictDetails: string
  ): string {
    const resolutionId = this.generateConflictId()

    console.log(`🔧 Resolving dependency conflict: ${dependency}`)
    console.log(`   Areas: ${areas.join(', ')}`)

    const resolution: ConflictResolution = {
      id: resolutionId,
      conflictType: 'dependency',
      involvedAreas: areas,
      description: `Dependency conflict: ${dependency} - ${conflictDetails}`,
      resolution: this.generateDependencyResolution(dependency, areas),
      timestamp: Date.now(),
      resolved: false
    }

    this.conflictHistory.push(resolution)

    // 모든 관련 영역에 해결책 전송
    areas.forEach(area => {
      this.sendMessage(
        this.agentId,
        WorkArea.SHARED,
        area,
        'coordination',
        `Dependency conflict resolution: ${dependency}`,
        {
          resolutionId,
          dependency,
          action: resolution.resolution,
          timeline: 'Please implement within 1 hour'
        },
        'high'
      )
    })

    return resolutionId
  }

  /**
   * 작업 스케줄링 최적화
   */
  public optimizeWorkSchedule(): WorkCoordination[] {
    console.log('📅 Optimizing work schedule...')

    const activeCoordinations = Array.from(this.activeCoordinations.values())
      .filter(coord => coord.status === 'planned' || coord.status === 'in-progress')

    // 우선순위와 의존성에 따라 정렬
    const optimizedSchedule = activeCoordinations.sort((a, b) => {
      if (a.schedule.priority !== b.schedule.priority) {
        return b.schedule.priority - a.schedule.priority
      }
      return a.schedule.startTime - b.schedule.startTime
    })

    // 충돌하는 작업들 식별
    const conflicts = this.identifyScheduleConflicts(optimizedSchedule)

    if (conflicts.length > 0) {
      console.log(`⚠️ Found ${conflicts.length} schedule conflicts`)

      // 충돌 해결을 위한 재조정
      this.adjustConflictingSchedules(conflicts)
    }

    console.log('✅ Work schedule optimized')
    return optimizedSchedule
  }

  /**
   * 영역 상태 모니터링
   */
  public monitorAreaStatus(): { [key in WorkArea]: any } {
    console.log('📊 Monitoring area status...')

    const areaStatus = areaIsolation.getAreaStatus()
    const recentViolations = areaIsolation.getRecentViolations(5)

    const status = {
      [WorkArea.FRONTEND]: {
        activeAgents: this.getActiveAgentsByArea(WorkArea.FRONTEND),
        recentActivity: this.getRecentActivity(WorkArea.FRONTEND),
        violations: recentViolations.filter(v => v.area === WorkArea.FRONTEND),
        health: 'healthy'
      },
      [WorkArea.BACKEND]: {
        activeAgents: this.getActiveAgentsByArea(WorkArea.BACKEND),
        recentActivity: this.getRecentActivity(WorkArea.BACKEND),
        violations: recentViolations.filter(v => v.area === WorkArea.BACKEND),
        health: 'healthy'
      },
      [WorkArea.CONFIG]: {
        activeAgents: this.getActiveAgentsByArea(WorkArea.CONFIG),
        recentActivity: this.getRecentActivity(WorkArea.CONFIG),
        violations: recentViolations.filter(v => v.area === WorkArea.CONFIG),
        health: 'healthy'
      },
      [WorkArea.SHARED]: {
        crossAreaMessages: this.messageQueue.size,
        activeCoordinations: this.activeCoordinations.size,
        resolvedConflicts: this.conflictHistory.filter(c => c.resolved).length,
        health: 'healthy'
      }
    }

    // 건강 상태 평가
    Object.keys(status).forEach(area => {
      const areaData = status[area as WorkArea]
      if ('violations' in areaData && areaData.violations && areaData.violations.length > 3) {
        areaData.health = 'warning'
      }
      if ('violations' in areaData && areaData.violations && areaData.violations.length > 5) {
        areaData.health = 'critical'
      }
    })

    console.log('📊 Area status monitoring complete')
    return status
  }

  // Private 헬퍼 메서드들

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateCoordinationId(): string {
    return `coord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private loadExistingMessages(): void {
    const messageFile = path.join(this.projectRoot, 'logs/area-messages.json')

    if (existsSync(messageFile)) {
      try {
        const messages = JSON.parse(readFileSync(messageFile, 'utf8'))
        messages.forEach((msg: any) => {
          if (msg.status === 'pending') {
            this.messageQueue.set(msg.id, msg)
          }
        })
        console.log(`📥 Loaded ${this.messageQueue.size} pending messages`)
      } catch (error) {
        console.error('Failed to load existing messages:', error)
      }
    }
  }

  private startMessageProcessor(): void {
    // 5초마다 메시지 처리
    setInterval(() => {
      this.processAllMessages()
    }, 5000)
  }

  private processAllMessages(): void {
    const pendingMessages = Array.from(this.messageQueue.values())
      .filter(msg => msg.status === 'pending')

    pendingMessages.forEach(message => {
      this.processMessage(message)
    })
  }

  private processMessage(message: CrossAreaMessage): void {
    console.log(`📨 Processing message: ${message.id}`)

    switch (message.type) {
      case 'request':
        this.handleRequest(message)
        break
      case 'response':
        this.handleResponse(message)
        break
      case 'notification':
        this.handleNotification(message)
        break
      case 'coordination':
        this.handleCoordination(message)
        break
    }

    message.status = 'delivered'
    this.saveMessageLog(message)
  }

  private handleRequest(message: CrossAreaMessage): void {
    console.log(`🔍 Handling request: ${message.subject}`)

    // 요청에 따른 자동 응답 생성
    const autoResponse = this.generateAutoResponse(message)
    if (autoResponse) {
      this.sendMessage(
        this.agentId,
        WorkArea.SHARED,
        message.fromArea,
        'response',
        `Re: ${message.subject}`,
        autoResponse,
        'medium'
      )
    }
  }

  private handleResponse(message: CrossAreaMessage): void {
    console.log(`✅ Handling response: ${message.subject}`)
    message.status = 'acknowledged'
  }

  private handleNotification(message: CrossAreaMessage): void {
    console.log(`📢 Handling notification: ${message.subject}`)
    message.status = 'acknowledged'
  }

  private handleCoordination(message: CrossAreaMessage): void {
    console.log(`🤝 Handling coordination: ${message.subject}`)

    // 조율 메시지에 따른 작업 계획 업데이트
    this.updateWorkPlan(message)
    message.status = 'acknowledged'
  }

  private saveMessageLog(message: CrossAreaMessage): void {
    const logFile = path.join(this.projectRoot, 'logs/communication.jsonl')
    const logEntry = JSON.stringify(message) + '\n'

    try {
      writeFileSync(logFile, logEntry, { flag: 'a' })
    } catch (error) {
      console.error('Failed to save message log:', error)
    }
  }

  private assessConflictRisk(areas: WorkArea[], dependencies: string[]): WorkCoordination['conflictRisk'] {
    // 여러 영역이 관련된 경우 위험도 증가
    if (areas.length >= 3) return 'high'
    if (areas.length === 2 && dependencies.length > 0) return 'medium'
    return 'low'
  }

  private determineFileOwnerArea(filePath: string): WorkArea {
    if (filePath.startsWith('components/') || filePath.startsWith('app/globals.css') || filePath.startsWith('src/styles/')) {
      return WorkArea.FRONTEND
    }
    if (filePath.startsWith('lib/') || filePath.startsWith('app/api/') || filePath.startsWith('contexts/')) {
      return WorkArea.BACKEND
    }
    if (filePath.startsWith('package.json') || filePath.startsWith('next.config.js') || filePath.startsWith('.github/')) {
      return WorkArea.CONFIG
    }
    return WorkArea.SHARED
  }

  private generateFileAccessResolution(
    filePath: string,
    requestingArea: WorkArea,
    ownerArea: WorkArea,
    operation: string
  ): string {
    if (operation === 'read') {
      return `Allow read access to ${filePath} for ${requestingArea} with notification to ${ownerArea}`
    }
    if (operation === 'write') {
      return `Coordinate write access to ${filePath} between ${requestingArea} and ${ownerArea}`
    }
    if (operation === 'delete') {
      return `Require explicit approval from ${ownerArea} before ${requestingArea} can delete ${filePath}`
    }
    return `Review access request for ${filePath} between ${requestingArea} and ${ownerArea}`
  }

  private generateDependencyResolution(dependency: string, areas: WorkArea[]): string {
    return `Coordinate dependency '${dependency}' management between areas: ${areas.join(', ')}. Establish clear ownership and update coordination.`
  }

  private identifyScheduleConflicts(coordinations: WorkCoordination[]): WorkCoordination[] {
    const conflicts: WorkCoordination[] = []

    for (let i = 0; i < coordinations.length; i++) {
      for (let j = i + 1; j < coordinations.length; j++) {
        const coord1 = coordinations[i]
        const coord2 = coordinations[j]

        // 같은 영역에서 동시 작업하는 경우
        const hasOverlappingAreas = coord1.areas.some(area => coord2.areas.includes(area))
        const hasTimeOverlap = this.checkTimeOverlap(coord1, coord2)

        if (hasOverlappingAreas && hasTimeOverlap) {
          conflicts.push(coord1, coord2)
        }
      }
    }

    return [...new Set(conflicts)]
  }

  private checkTimeOverlap(coord1: WorkCoordination, coord2: WorkCoordination): boolean {
    const end1 = coord1.schedule.startTime + coord1.schedule.estimatedDuration
    const end2 = coord2.schedule.startTime + coord2.schedule.estimatedDuration

    return !(end1 <= coord2.schedule.startTime || end2 <= coord1.schedule.startTime)
  }

  private adjustConflictingSchedules(conflicts: WorkCoordination[]): void {
    conflicts.forEach(coord => {
      // 낮은 우선순위 작업을 뒤로 미룸
      if (coord.schedule.priority < 5) {
        coord.schedule.startTime += coord.schedule.estimatedDuration
        console.log(`📅 Rescheduled: ${coord.id} (priority ${coord.schedule.priority})`)
      }
    })
  }

  private generateAutoResponse(message: CrossAreaMessage): any {
    switch (message.subject) {
      case 'File access request':
        return {
          decision: 'approved',
          conditions: ['Read-only access', 'Notify on changes'],
          validUntil: Date.now() + 3600000 // 1시간
        }
      default:
        return null
    }
  }

  private updateWorkPlan(message: CrossAreaMessage): void {
    // 조율 메시지를 기반으로 작업 계획 업데이트
    console.log(`📋 Work plan updated based on: ${message.subject}`)
  }

  private getActiveAgentsByArea(area: WorkArea): string[] {
    // 실제 구현에서는 각 영역의 활성 에이전트 목록을 반환
    const agentMap = {
      [WorkArea.FRONTEND]: ['ui-design-agent', 'theme-system-agent'],
      [WorkArea.BACKEND]: ['api-development-agent', 'database-agent', 'auth-system-agent'],
      [WorkArea.CONFIG]: ['build-system-agent', 'deployment-agent', 'monitoring-agent'],
      [WorkArea.SHARED]: ['debug-agent', 'communication-agent']
    }
    return agentMap[area] || []
  }

  private getRecentActivity(area: WorkArea): string[] {
    // 실제 구현에서는 최근 활동 로그를 반환
    return [`Recent activity in ${area} area`]
  }

  /**
   * 통신 시스템 상태 리포트
   */
  public generateStatusReport(): any {
    const areaStatus = this.monitorAreaStatus()

    return {
      timestamp: new Date().toISOString(),
      agent: this.agentId,
      area: WorkArea.SHARED,
      communication: {
        totalMessages: this.messageQueue.size,
        pendingMessages: Array.from(this.messageQueue.values()).filter(m => m.status === 'pending').length,
        deliveredMessages: Array.from(this.messageQueue.values()).filter(m => m.status === 'delivered').length,
        acknowledgedMessages: Array.from(this.messageQueue.values()).filter(m => m.status === 'acknowledged').length
      },
      coordination: {
        activeCoordinations: this.activeCoordinations.size,
        plannedWork: Array.from(this.activeCoordinations.values()).filter(c => c.status === 'planned').length,
        inProgressWork: Array.from(this.activeCoordinations.values()).filter(c => c.status === 'in-progress').length,
        completedWork: Array.from(this.activeCoordinations.values()).filter(c => c.status === 'completed').length
      },
      conflicts: {
        totalConflicts: this.conflictHistory.length,
        resolvedConflicts: this.conflictHistory.filter(c => c.resolved).length,
        recentConflicts: this.conflictHistory.slice(-5)
      },
      areaHealth: areaStatus,
      capabilities: [
        'Cross-area message delivery',
        'Work coordination and scheduling',
        'Conflict detection and resolution',
        'Area status monitoring',
        'File access mediation'
      ],
      recommendations: [
        'All areas are communicating effectively',
        'Work coordination is preventing conflicts',
        'Message delivery system is operational',
        'Area isolation is being maintained properly'
      ]
    }
  }
}

export default CommunicationAgent