/**
 * 🐛 Debug Agent - 크로스 영역 전용
 *
 * 역할: 모든 영역(A, B, C)에서 버그 추적 및 디버깅 (임시 코드만)
 * 접근 권한: 모든 영역 읽기 전용 + 임시 디버깅 코드 추가만 허용
 * 보호 대상: 프로덕션 코드 변경 금지, 디버깅 목적만
 */

import { areaIsolation, WorkArea } from './area-isolation-system'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import path from 'path'

export interface DebugSession {
  id: string
  target: string
  issue: string
  area: WorkArea | 'cross-area'
  startTime: number
  status: 'active' | 'resolved' | 'investigating'
  debugCode: string[]
  findings: string[]
}

export interface DebugIssue {
  category: 'frontend' | 'backend' | 'config' | 'integration'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  location: string
  reproductionSteps: string[]
  temporaryFix?: string
}

export class DebugAgent {
  private agentId = 'debug-agent'
  private projectRoot = '/Users/bk/Desktop/viet-kconnect'
  private activeSessions: Map<string, DebugSession> = new Map()

  constructor() {
    // Debug Agent는 모든 영역에 크로스 액세스 권한을 가짐
    // 하지만 읽기 전용 + 임시 디버깅 코드만 허용
    console.log('🐛 Debug Agent initialized with cross-area access')
  }

  /**
   * 특별한 영역 검증 - Debug Agent만의 크로스 액세스
   */
  private validateDebugAccess(filePath: string, operation: 'read' | 'debug-write'): boolean {
    // Debug Agent는 모든 파일을 읽을 수 있음
    if (operation === 'read') {
      return true
    }

    // 디버깅 코드 작성은 임시 파일이나 디버그 마커가 있는 경우만
    if (operation === 'debug-write') {
      return (
        filePath.includes('.debug.') ||
        filePath.includes('/temp/') ||
        filePath.includes('/debug/') ||
        filePath.endsWith('.debug.js') ||
        filePath.endsWith('.debug.ts')
      )
    }

    return false
  }

  /**
   * 새로운 디버깅 세션 시작
   */
  public startDebugSession(target: string, issue: string, area: WorkArea | 'cross-area' = 'cross-area'): string {
    const sessionId = this.generateSessionId()

    const session: DebugSession = {
      id: sessionId,
      target,
      issue,
      area,
      startTime: Date.now(),
      status: 'investigating',
      debugCode: [],
      findings: []
    }

    this.activeSessions.set(sessionId, session)

    console.log(`🔍 Debug session started: ${sessionId}`)
    console.log(`   Target: ${target}`)
    console.log(`   Issue: ${issue}`)
    console.log(`   Area: ${area}`)

    return sessionId
  }

  /**
   * 종합 오류 진단
   */
  public diagnoseIssue(sessionId: string, errorDescription: string): DebugIssue {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw new Error(`Debug session not found: ${sessionId}`)
    }

    console.log(`🔍 Diagnosing issue: ${errorDescription}`)

    // 오류 분류
    const category = this.categorizeError(errorDescription)
    const severity = this.assessSeverity(errorDescription)

    // 관련 파일 스캔
    const relatedFiles = this.scanForRelatedFiles(session.target)

    // 재현 단계 생성
    const reproductionSteps = this.generateReproductionSteps(errorDescription, session.target)

    const issue: DebugIssue = {
      category,
      severity,
      description: errorDescription,
      location: session.target,
      reproductionSteps
    }

    session.findings.push(`Diagnosed: ${category} issue with ${severity} severity`)

    console.log(`📋 Issue diagnosed:`)
    console.log(`   Category: ${category}`)
    console.log(`   Severity: ${severity}`)
    console.log(`   Related files: ${relatedFiles.length}`)

    return issue
  }

  /**
   * 임시 디버깅 코드 삽입
   */
  public injectDebugCode(sessionId: string, filePath: string, debugCode: string): boolean {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw new Error(`Debug session not found: ${sessionId}`)
    }

    console.log(`💉 Injecting debug code into ${filePath}`)

    if (!this.validateDebugAccess(filePath, 'read')) {
      console.error(`❌ Cannot read file: ${filePath}`)
      return false
    }

    try {
      const fullPath = path.join(this.projectRoot, filePath)
      const originalContent = readFileSync(fullPath, 'utf8')

      // 디버그 코드를 안전하게 삽입
      const modifiedContent = this.insertDebugCode(originalContent, debugCode, sessionId)

      // 임시 디버그 파일로 저장
      const debugFilePath = filePath.replace(/\.(ts|js|tsx|jsx)$/, `.debug.$1`)
      const debugFullPath = path.join(this.projectRoot, debugFilePath)

      writeFileSync(debugFullPath, modifiedContent)

      session.debugCode.push(`${debugFilePath}: ${debugCode}`)
      session.findings.push(`Debug code injected into ${debugFilePath}`)

      console.log(`✅ Debug code injected into ${debugFilePath}`)
      console.log(`   Original preserved: ${filePath}`)

      return true
    } catch (error) {
      console.error(`❌ Failed to inject debug code:`, error)
      return false
    }
  }

  /**
   * 콘솔 디버깅 설정
   */
  public setupConsoleDebugging(sessionId: string, component: string): boolean {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw new Error(`Debug session not found: ${sessionId}`)
    }

    console.log(`🖥️ Setting up console debugging for ${component}`)

    const debugCode = this.generateConsoleDebugCode(component, sessionId)

    // 컴포넌트 파일 찾기
    const componentFiles = this.findComponentFiles(component)

    let success = false
    componentFiles.forEach(filePath => {
      if (this.injectDebugCode(sessionId, filePath, debugCode)) {
        success = true
      }
    })

    if (success) {
      session.findings.push(`Console debugging enabled for ${component}`)
    }

    return success
  }

  /**
   * 이벤트 플로우 추적
   */
  public traceEventFlow(sessionId: string, eventType: string, target?: string): boolean {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw new Error(`Debug session not found: ${sessionId}`)
    }

    console.log(`🔄 Tracing event flow: ${eventType}`)

    const traceCode = this.generateEventTraceCode(eventType, sessionId)

    // 이벤트 관련 파일들 찾기
    const eventFiles = this.findEventRelatedFiles(eventType, target)

    let tracesAdded = 0
    eventFiles.forEach(filePath => {
      if (this.injectDebugCode(sessionId, filePath, traceCode)) {
        tracesAdded++
      }
    })

    if (tracesAdded > 0) {
      session.findings.push(`Event flow tracing enabled for ${eventType} (${tracesAdded} files)`)
      console.log(`✅ Event tracing added to ${tracesAdded} files`)
      return true
    }

    return false
  }

  /**
   * 성능 디버깅 설정
   */
  public debugPerformance(sessionId: string, targetFunction: string): boolean {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw new Error(`Debug session not found: ${sessionId}`)
    }

    console.log(`⚡ Setting up performance debugging for ${targetFunction}`)

    const perfCode = this.generatePerformanceDebugCode(targetFunction, sessionId)

    // 함수가 있는 파일들 찾기
    const functionFiles = this.findFunctionFiles(targetFunction)

    let instrumentedFiles = 0
    functionFiles.forEach(filePath => {
      if (this.injectDebugCode(sessionId, filePath, perfCode)) {
        instrumentedFiles++
      }
    })

    if (instrumentedFiles > 0) {
      session.findings.push(`Performance debugging enabled for ${targetFunction} (${instrumentedFiles} files)`)
      console.log(`✅ Performance instrumentation added to ${instrumentedFiles} files`)
      return true
    }

    return false
  }

  /**
   * 메모리 누수 탐지
   */
  public detectMemoryLeaks(sessionId: string): string[] {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw new Error(`Debug session not found: ${sessionId}`)
    }

    console.log(`🧠 Setting up memory leak detection`)

    const memoryCode = this.generateMemoryLeakDetectionCode(sessionId)

    // React 컴포넌트와 이벤트 리스너 파일들 찾기
    const memoryRiskFiles = this.findMemoryRiskFiles()

    const leakDetectors: string[] = []
    memoryRiskFiles.forEach(filePath => {
      if (this.injectDebugCode(sessionId, filePath, memoryCode)) {
        leakDetectors.push(filePath)
      }
    })

    if (leakDetectors.length > 0) {
      session.findings.push(`Memory leak detection enabled (${leakDetectors.length} files)`)
      console.log(`✅ Memory leak detection added to ${leakDetectors.length} files`)
    }

    return leakDetectors
  }

  /**
   * 디버깅 세션 정리
   */
  public cleanupDebugSession(sessionId: string): boolean {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      console.warn(`Debug session not found: ${sessionId}`)
      return false
    }

    console.log(`🧹 Cleaning up debug session: ${sessionId}`)

    // 생성된 디버그 파일들 삭제
    let filesRemoved = 0
    session.debugCode.forEach(entry => {
      const [filePath] = entry.split(': ')
      try {
        const fullPath = path.join(this.projectRoot, filePath)
        if (existsSync(fullPath)) {
          // 실제로는 파일을 삭제하는 대신 백업으로 이동
          const backupPath = fullPath + '.backup'
          writeFileSync(backupPath, readFileSync(fullPath, 'utf8'))
          console.log(`📁 Debug file backed up: ${filePath}`)
          filesRemoved++
        }
      } catch (error) {
        console.warn(`Failed to cleanup debug file: ${filePath}`)
      }
    })

    session.status = 'resolved'
    this.activeSessions.delete(sessionId)

    console.log(`✅ Debug session cleaned up: ${sessionId}`)
    console.log(`   Files processed: ${filesRemoved}`)
    console.log(`   Findings: ${session.findings.length}`)

    return true
  }

  // Private 헬퍼 메서드들

  private generateSessionId(): string {
    return `debug_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private categorizeError(errorDescription: string): DebugIssue['category'] {
    const lower = errorDescription.toLowerCase()

    if (lower.includes('component') || lower.includes('render') || lower.includes('ui')) {
      return 'frontend'
    }
    if (lower.includes('api') || lower.includes('database') || lower.includes('server')) {
      return 'backend'
    }
    if (lower.includes('build') || lower.includes('config') || lower.includes('deploy')) {
      return 'config'
    }
    return 'integration'
  }

  private assessSeverity(errorDescription: string): DebugIssue['severity'] {
    const lower = errorDescription.toLowerCase()

    if (lower.includes('crash') || lower.includes('broken') || lower.includes('error')) {
      return 'high'
    }
    if (lower.includes('slow') || lower.includes('warning') || lower.includes('issue')) {
      return 'medium'
    }
    return 'low'
  }

  private scanForRelatedFiles(target: string): string[] {
    // 실제 구현에서는 파일 시스템을 스캔
    return [target]
  }

  private generateReproductionSteps(errorDescription: string, target: string): string[] {
    return [
      `1. Navigate to ${target}`,
      `2. Attempt to reproduce: ${errorDescription}`,
      '3. Check console for errors',
      '4. Inspect network requests',
      '5. Verify component state'
    ]
  }

  private insertDebugCode(originalContent: string, debugCode: string, sessionId: string): string {
    const debugMarker = `// DEBUG_START_${sessionId}`
    const debugEndMarker = `// DEBUG_END_${sessionId}`

    // 파일의 시작 부분에 디버그 코드 삽입
    const lines = originalContent.split('\n')
    const imports = lines.filter(line => line.trim().startsWith('import') || line.trim().startsWith('const'))
    const importsEnd = imports.length

    const modifiedLines = [
      ...lines.slice(0, importsEnd),
      '',
      debugMarker,
      debugCode,
      debugEndMarker,
      '',
      ...lines.slice(importsEnd)
    ]

    return modifiedLines.join('\n')
  }

  private generateConsoleDebugCode(component: string, sessionId: string): string {
    return `
// Console debugging for ${component} (Session: ${sessionId})
console.group('🐛 DEBUG: ${component}');
console.log('Component loaded at:', new Date().toISOString());
console.log('Props:', arguments[0]);
console.log('State:', this?.state || 'No state');

// Override console methods for this session
const originalLog = console.log;
window.debugLog_${sessionId} = (...args) => {
  originalLog('[${component}]', ...args);
};

console.groupEnd();
`
  }

  private generateEventTraceCode(eventType: string, sessionId: string): string {
    return `
// Event flow tracing for ${eventType} (Session: ${sessionId})
if (typeof window !== 'undefined') {
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, listener, options) {
    if (type === '${eventType}') {
      console.log('🔄 Event listener added:', {
        type: type,
        target: this,
        timestamp: new Date().toISOString(),
        session: '${sessionId}'
      });

      const wrappedListener = function(event) {
        console.log('🎯 Event triggered:', {
          type: event.type,
          target: event.target,
          currentTarget: event.currentTarget,
          timestamp: new Date().toISOString(),
          session: '${sessionId}'
        });
        return listener.call(this, event);
      };

      return originalAddEventListener.call(this, type, wrappedListener, options);
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
}
`
  }

  private generatePerformanceDebugCode(targetFunction: string, sessionId: string): string {
    return `
// Performance debugging for ${targetFunction} (Session: ${sessionId})
if (typeof window !== 'undefined' && window.performance) {
  const originalFunction = window.${targetFunction} || this.${targetFunction};
  if (originalFunction) {
    const instrumentedFunction = function(...args) {
      const startTime = performance.now();
      const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

      console.log('⚡ Function start:', {
        function: '${targetFunction}',
        timestamp: new Date().toISOString(),
        memory: startMemory,
        session: '${sessionId}'
      });

      const result = originalFunction.apply(this, args);

      const endTime = performance.now();
      const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;

      console.log('⚡ Function end:', {
        function: '${targetFunction}',
        duration: endTime - startTime,
        memoryDelta: endMemory - startMemory,
        session: '${sessionId}'
      });

      return result;
    };

    if (window.${targetFunction}) window.${targetFunction} = instrumentedFunction;
    if (this.${targetFunction}) this.${targetFunction} = instrumentedFunction;
  }
}
`
  }

  private generateMemoryLeakDetectionCode(sessionId: string): string {
    return `
// Memory leak detection (Session: ${sessionId})
if (typeof window !== 'undefined') {
  window.debugMemoryTracker_${sessionId} = {
    eventListeners: new Set(),
    timers: new Set(),
    observers: new Set(),

    trackEventListener: function(element, event, handler) {
      this.eventListeners.add({ element, event, handler, timestamp: Date.now() });
    },

    trackTimer: function(timerId, type) {
      this.timers.add({ timerId, type, timestamp: Date.now() });
    },

    checkForLeaks: function() {
      console.group('🧠 Memory Leak Check (${sessionId})');
      console.log('Event listeners:', this.eventListeners.size);
      console.log('Active timers:', this.timers.size);
      console.log('Observers:', this.observers.size);

      if (performance.memory) {
        console.log('Memory usage:', {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
        });
      }
      console.groupEnd();
    }
  };

  // Check for leaks every 30 seconds
  setInterval(() => {
    window.debugMemoryTracker_${sessionId}.checkForLeaks();
  }, 30000);
}
`
  }

  private findComponentFiles(component: string): string[] {
    // 실제 구현에서는 파일 시스템 검색
    return [
      `components/${component}.tsx`,
      `components/${component}/${component}.tsx`,
      `app/${component}/page.tsx`
    ].filter(filePath => existsSync(path.join(this.projectRoot, filePath)))
  }

  private findEventRelatedFiles(eventType: string, target?: string): string[] {
    // 실제 구현에서는 이벤트 관련 파일들을 찾음
    return [
      'components/layout/Header.tsx',
      'components/questions/QuestionCard.tsx',
      'app/page.tsx'
    ]
  }

  private findFunctionFiles(functionName: string): string[] {
    // 실제 구현에서는 함수가 정의된 파일들을 찾음
    return [
      'lib/utils.ts',
      'components/**/*.tsx',
      'app/**/*.tsx'
    ]
  }

  private findMemoryRiskFiles(): string[] {
    // React 컴포넌트와 이벤트 리스너가 있는 파일들
    return [
      'components/**/*.tsx',
      'app/**/*.tsx',
      'contexts/**/*.tsx'
    ]
  }

  /**
   * 활성 디버깅 세션 상태 리포트
   */
  public generateStatusReport(): any {
    const activeSessions = Array.from(this.activeSessions.values())

    return {
      timestamp: new Date().toISOString(),
      agent: this.agentId,
      area: 'cross-area',
      sessions: {
        total: activeSessions.length,
        investigating: activeSessions.filter(s => s.status === 'investigating').length,
        active: activeSessions.filter(s => s.status === 'active').length,
        resolved: activeSessions.filter(s => s.status === 'resolved').length
      },
      categories: {
        frontend: activeSessions.filter(s => s.issue.includes('component') || s.issue.includes('ui')).length,
        backend: activeSessions.filter(s => s.issue.includes('api') || s.issue.includes('server')).length,
        config: activeSessions.filter(s => s.issue.includes('build') || s.issue.includes('config')).length
      },
      capabilities: [
        'Cross-area debugging access',
        'Temporary debug code injection',
        'Console debugging setup',
        'Event flow tracing',
        'Performance instrumentation',
        'Memory leak detection'
      ],
      restrictions: [
        'No production code changes',
        'No database schema changes',
        'Debug code only',
        'Temporary files only'
      ]
    }
  }
}

export default DebugAgent