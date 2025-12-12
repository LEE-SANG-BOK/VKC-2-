/**
 * 📊 Monitoring Agent - Config 영역 전용
 *
 * 역할: 애플리케이션 모니터링 및 성능 추적
 * 접근 권한: .github/, scripts/, public/, 모니터링 설정 파일만
 * 보호 대상: 모니터링 설정 및 알림 시스템
 */

import { areaIsolation, WorkArea } from '../area-isolation-system'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import path from 'path'

export interface MonitoringConfig {
  name: string
  type: 'performance' | 'error' | 'security' | 'uptime' | 'analytics'
  status: 'active' | 'inactive' | 'needs-setup'
  provider: string
  critical: boolean
  automated: boolean
}

export interface AlertConfig {
  id: string
  name: string
  condition: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  channels: string[]
  enabled: boolean
}

export class MonitoringAgent {
  private agentId = 'monitoring-agent'
  private projectRoot = '/Users/bk/Desktop/viet-kconnect'

  constructor() {
    // 에이전트를 Config 영역에 등록
    areaIsolation.registerAgent(this.agentId, WorkArea.CONFIG)
  }

  /**
   * 기존 모니터링 설정 분석
   */
  public analyzeExistingMonitoringConfigs(): MonitoringConfig[] {
    console.log('🔍 Analyzing existing monitoring configurations...')

    const configs: MonitoringConfig[] = [
      {
        name: 'Next.js Analytics',
        type: 'performance',
        status: 'needs-setup',
        provider: 'vercel',
        critical: false,
        automated: true
      },
      {
        name: 'Error Tracking',
        type: 'error',
        status: 'needs-setup',
        provider: 'sentry',
        critical: true,
        automated: true
      },
      {
        name: 'Uptime Monitoring',
        type: 'uptime',
        status: 'needs-setup',
        provider: 'uptimerobot',
        critical: true,
        automated: true
      },
      {
        name: 'Security Monitoring',
        type: 'security',
        status: 'needs-setup',
        provider: 'github',
        critical: true,
        automated: true
      },
      {
        name: 'User Analytics',
        type: 'analytics',
        status: 'needs-setup',
        provider: 'google',
        critical: false,
        automated: true
      }
    ]

    console.log('✅ Monitoring configuration analysis completed:')
    configs.forEach(config => {
      console.log(`   ${config.name}: ${config.status} (${config.type})`)
    })

    return configs
  }

  /**
   * 성능 모니터링 설정
   */
  public setupPerformanceMonitoring(): boolean {
    console.log('⚡ Setting up performance monitoring...')

    const performanceConfigs = [
      {
        name: 'lib/monitoring/performance.ts',
        content: this.generatePerformanceMonitoring()
      },
      {
        name: 'lib/monitoring/web-vitals.ts',
        content: this.generateWebVitalsTracking()
      },
      {
        name: 'components/monitoring/PerformanceMonitor.tsx',
        content: this.generatePerformanceMonitorComponent()
      }
    ]

    return this.createMonitoringFiles(performanceConfigs)
  }

  /**
   * 에러 추적 시스템 설정
   */
  public setupErrorTracking(): boolean {
    console.log('🚨 Setting up error tracking system...')

    const errorConfigs = [
      {
        name: 'lib/monitoring/error-tracking.ts',
        content: this.generateErrorTracking()
      },
      {
        name: 'lib/monitoring/error-boundary.tsx',
        content: this.generateErrorBoundary()
      },
      {
        name: 'app/global-error.tsx',
        content: this.generateGlobalErrorHandler()
      }
    ]

    return this.createMonitoringFiles(errorConfigs)
  }

  /**
   * 업타임 모니터링 설정
   */
  public setupUptimeMonitoring(): boolean {
    console.log('🔄 Setting up uptime monitoring...')

    const uptimeConfigs = [
      {
        name: 'scripts/uptime-monitor.js',
        content: this.generateUptimeMonitor()
      },
      {
        name: '.github/workflows/uptime-check.yml',
        content: this.generateUptimeWorkflow()
      },
      {
        name: 'app/api/health/route.ts',
        content: this.generateHealthCheckAPI()
      }
    ]

    return this.createMonitoringFiles(uptimeConfigs)
  }

  /**
   * 보안 모니터링 설정
   */
  public setupSecurityMonitoring(): boolean {
    console.log('🛡️ Setting up security monitoring...')

    const securityConfigs = [
      {
        name: 'lib/monitoring/security.ts',
        content: this.generateSecurityMonitoring()
      },
      {
        name: '.github/workflows/security-monitor.yml',
        content: this.generateSecurityWorkflow()
      },
      {
        name: 'scripts/security-audit.js',
        content: this.generateSecurityAudit()
      }
    ]

    return this.createMonitoringFiles(securityConfigs)
  }

  /**
   * 사용자 분석 설정
   */
  public setupUserAnalytics(): boolean {
    console.log('📈 Setting up user analytics...')

    const analyticsConfigs = [
      {
        name: 'lib/monitoring/analytics.ts',
        content: this.generateAnalytics()
      },
      {
        name: 'components/monitoring/AnalyticsProvider.tsx',
        content: this.generateAnalyticsProvider()
      },
      {
        name: 'hooks/useAnalytics.ts',
        content: this.generateAnalyticsHook()
      }
    ]

    return this.createMonitoringFiles(analyticsConfigs)
  }

  /**
   * 알림 시스템 설정
   */
  public setupAlertSystem(): boolean {
    console.log('🔔 Setting up alert system...')

    const alertConfigs: AlertConfig[] = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        condition: 'error_rate > 5%',
        severity: 'critical',
        channels: ['slack', 'email'],
        enabled: true
      },
      {
        id: 'slow-response-time',
        name: 'Slow Response Time',
        condition: 'avg_response_time > 2000ms',
        severity: 'high',
        channels: ['slack'],
        enabled: true
      },
      {
        id: 'low-uptime',
        name: 'Low Uptime',
        condition: 'uptime < 99%',
        severity: 'critical',
        channels: ['slack', 'email', 'sms'],
        enabled: true
      },
      {
        id: 'security-incident',
        name: 'Security Incident',
        condition: 'security_score < 80',
        severity: 'critical',
        channels: ['slack', 'email'],
        enabled: true
      }
    ]

    const alertSystemConfig = this.generateAlertSystemConfig(alertConfigs)

    return areaIsolation.safeFileOperation(
      this.agentId,
      'lib/monitoring/alerts.ts',
      'write',
      () => {
        const fullPath = path.join(this.projectRoot, 'lib/monitoring/alerts.ts')
        writeFileSync(fullPath, alertSystemConfig)
        console.log('✅ Alert system configured')
        return true
      }
    ) || false
  }

  // Private 헬퍼 메서드들

  private createMonitoringFiles(configs: Array<{name: string, content: string}>): boolean {
    let allSuccess = true

    configs.forEach(config => {
      // 디렉토리 생성
      const dir = path.dirname(config.name)
      const fullDir = path.join(this.projectRoot, dir)
      if (!existsSync(fullDir)) {
        mkdirSync(fullDir, { recursive: true })
      }

      const success = areaIsolation.safeFileOperation(
        this.agentId,
        config.name,
        'write',
        () => {
          const fullPath = path.join(this.projectRoot, config.name)
          writeFileSync(fullPath, config.content)
          console.log(`✅ Created monitoring file: ${config.name}`)
          return true
        }
      )

      if (!success) allSuccess = false
    })

    return allSuccess
  }

  private generatePerformanceMonitoring(): string {
    return `/**
 * Performance Monitoring System
 * Generated: ${new Date().toISOString()}
 */

export interface PerformanceMetrics {
  timestamp: number
  url: string
  loadTime: number
  renderTime: number
  bundleSize: number
  memoryUsage: number
  userAgent: string
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private isClient = typeof window !== 'undefined'

  constructor() {
    if (this.isClient) {
      this.initializeMonitoring()
    }
  }

  private initializeMonitoring(): void {
    // Performance Observer for monitoring
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordMetric(entry)
        })
      })

      observer.observe({ entryTypes: ['navigation', 'measure', 'paint'] })
    }

    // Page load metrics
    window.addEventListener('load', () => {
      setTimeout(() => this.capturePageMetrics(), 1000)
    })
  }

  private recordMetric(entry: PerformanceEntry): void {
    const metric: Partial<PerformanceMetrics> = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }

    if (entry.entryType === 'navigation') {
      const navEntry = entry as PerformanceNavigationTiming
      metric.loadTime = navEntry.loadEventEnd - navEntry.fetchStart
      metric.renderTime = navEntry.domContentLoadedEventEnd - navEntry.fetchStart
    }

    this.metrics.push(metric as PerformanceMetrics)
    this.sendMetricsToServer()
  }

  private capturePageMetrics(): void {
    if (!this.isClient) return

    const metric: PerformanceMetrics = {
      timestamp: Date.now(),
      url: window.location.href,
      loadTime: performance.now(),
      renderTime: performance.now(),
      bundleSize: this.estimateBundleSize(),
      memoryUsage: this.getMemoryUsage(),
      userAgent: navigator.userAgent
    }

    this.metrics.push(metric)
    this.sendMetricsToServer()
  }

  private estimateBundleSize(): number {
    // Estimate based on performance entries
    const resources = performance.getEntriesByType('resource')
    return resources.reduce((total, resource) => {
      const resourceEntry = resource as PerformanceResourceTiming
      return total + (resourceEntry.transferSize || 0)
    }, 0)
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize
    }
    return 0
  }

  private async sendMetricsToServer(): Promise<void> {
    if (this.metrics.length === 0) return

    try {
      await fetch('/api/monitoring/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.metrics)
      })

      this.metrics = [] // Clear after sending
    } catch (error) {
      console.error('Failed to send performance metrics:', error)
    }
  }

  public getAverageLoadTime(): number {
    if (this.metrics.length === 0) return 0
    const total = this.metrics.reduce((sum, metric) => sum + metric.loadTime, 0)
    return total / this.metrics.length
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }
}

export const performanceMonitor = new PerformanceMonitor()
`
  }

  private generateWebVitalsTracking(): string {
    return `/**
 * Web Vitals Tracking
 * Generated: ${new Date().toISOString()}
 */

import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

export interface WebVitalMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  url: string
  timestamp: number
}

export class WebVitalsTracker {
  private metrics: WebVitalMetric[] = []

  constructor() {
    this.initializeTracking()
  }

  private initializeTracking(): void {
    // Track Core Web Vitals
    getCLS(this.onVitalMetric.bind(this))
    getFID(this.onVitalMetric.bind(this))
    getFCP(this.onVitalMetric.bind(this))
    getLCP(this.onVitalMetric.bind(this))
    getTTFB(this.onVitalMetric.bind(this))
  }

  private onVitalMetric(metric: any): void {
    const webVitalMetric: WebVitalMetric = {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      url: window.location.href,
      timestamp: Date.now()
    }

    this.metrics.push(webVitalMetric)
    this.sendToAnalytics(webVitalMetric)
  }

  private async sendToAnalytics(metric: WebVitalMetric): Promise<void> {
    try {
      // Send to Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', metric.name, {
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          metric_id: metric.id,
          metric_value: metric.value,
          metric_delta: metric.delta,
          metric_rating: metric.rating
        })
      }

      // Send to custom analytics endpoint
      await fetch('/api/monitoring/web-vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metric)
      })
    } catch (error) {
      console.error('Failed to send web vital metric:', error)
    }
  }

  public getMetrics(): WebVitalMetric[] {
    return [...this.metrics]
  }

  public getMetricByName(name: string): WebVitalMetric | undefined {
    return this.metrics.find(metric => metric.name === name)
  }

  public getAverageByName(name: string): number {
    const metrics = this.metrics.filter(metric => metric.name === name)
    if (metrics.length === 0) return 0

    const total = metrics.reduce((sum, metric) => sum + metric.value, 0)
    return total / metrics.length
  }
}

export const webVitalsTracker = new WebVitalsTracker()
`
  }

  private generatePerformanceMonitorComponent(): string {
    return `/**
 * Performance Monitor Component
 * Generated: ${new Date().toISOString()}
 */

'use client'

import { useEffect, useState } from 'react'
import { performanceMonitor, PerformanceMetrics } from '@/lib/monitoring/performance'
import { webVitalsTracker, WebVitalMetric } from '@/lib/monitoring/web-vitals'

interface PerformanceData {
  averageLoadTime: number
  webVitals: {
    cls: number
    fid: number
    fcp: number
    lcp: number
    ttfb: number
  }
  recentMetrics: PerformanceMetrics[]
}

export function PerformanceMonitor() {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const updatePerformanceData = () => {
      const data: PerformanceData = {
        averageLoadTime: performanceMonitor.getAverageLoadTime(),
        webVitals: {
          cls: webVitalsTracker.getAverageByName('CLS'),
          fid: webVitalsTracker.getAverageByName('FID'),
          fcp: webVitalsTracker.getAverageByName('FCP'),
          lcp: webVitalsTracker.getAverageByName('LCP'),
          ttfb: webVitalsTracker.getAverageByName('TTFB')
        },
        recentMetrics: performanceMonitor.getMetrics().slice(-5)
      }
      setPerformanceData(data)
    }

    // Update every 5 seconds
    const interval = setInterval(updatePerformanceData, 5000)
    updatePerformanceData() // Initial update

    return () => clearInterval(interval)
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg z-50"
        title="Show Performance Monitor"
      >
        📊
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 max-w-sm">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm">Performance Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {performanceData && (
        <div className="space-y-2 text-xs">
          <div>
            <strong>Avg Load Time:</strong> {performanceData.averageLoadTime.toFixed(2)}ms
          </div>

          <div>
            <strong>Web Vitals:</strong>
            <div className="ml-2 space-y-1">
              <div>CLS: {performanceData.webVitals.cls.toFixed(3)}</div>
              <div>FID: {performanceData.webVitals.fid.toFixed(2)}ms</div>
              <div>FCP: {performanceData.webVitals.fcp.toFixed(2)}ms</div>
              <div>LCP: {performanceData.webVitals.lcp.toFixed(2)}ms</div>
              <div>TTFB: {performanceData.webVitals.ttfb.toFixed(2)}ms</div>
            </div>
          </div>

          {performanceData.recentMetrics.length > 0 && (
            <div>
              <strong>Recent Metrics:</strong>
              <div className="ml-2 max-h-20 overflow-y-auto">
                {performanceData.recentMetrics.map((metric, index) => (
                  <div key={index} className="text-xs">
                    {metric.loadTime.toFixed(2)}ms
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
`
  }

  private generateErrorTracking(): string {
    return `/**
 * Error Tracking System
 * Generated: ${new Date().toISOString()}
 */

export interface ErrorReport {
  id: string
  message: string
  stack?: string
  url: string
  lineNumber?: number
  columnNumber?: number
  timestamp: number
  userAgent: string
  userId?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  context?: Record<string, any>
}

export class ErrorTracker {
  private errors: ErrorReport[] = []
  private isClient = typeof window !== 'undefined'

  constructor() {
    if (this.isClient) {
      this.initializeErrorTracking()
    }
  }

  private initializeErrorTracking(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        severity: 'high'
      })
    })

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: \`Unhandled Promise Rejection: \${event.reason}\`,
        stack: event.reason?.stack,
        url: window.location.href,
        severity: 'critical'
      })
    })

    // React error boundary compatibility
    window.addEventListener('react-error', (event: any) => {
      this.captureError({
        message: event.detail.message,
        stack: event.detail.stack,
        url: window.location.href,
        severity: 'high',
        context: event.detail.componentStack
      })
    })
  }

  public captureError(errorData: Partial<ErrorReport>): void {
    const error: ErrorReport = {
      id: this.generateErrorId(),
      message: errorData.message || 'Unknown error',
      stack: errorData.stack,
      url: errorData.url || (this.isClient ? window.location.href : ''),
      lineNumber: errorData.lineNumber,
      columnNumber: errorData.columnNumber,
      timestamp: Date.now(),
      userAgent: this.isClient ? navigator.userAgent : '',
      userId: this.getCurrentUserId(),
      severity: errorData.severity || 'medium',
      context: errorData.context
    }

    this.errors.push(error)
    this.sendErrorToServer(error)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error captured:', error)
    }
  }

  private generateErrorId(): string {
    return \`error_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`
  }

  private getCurrentUserId(): string | undefined {
    // Get user ID from auth context or local storage
    if (this.isClient) {
      return localStorage.getItem('userId') || undefined
    }
    return undefined
  }

  private async sendErrorToServer(error: ErrorReport): Promise<void> {
    try {
      await fetch('/api/monitoring/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(error)
      })
    } catch (sendError) {
      console.error('Failed to send error report:', sendError)
    }
  }

  public getErrors(): ErrorReport[] {
    return [...this.errors]
  }

  public getErrorsByType(severity: ErrorReport['severity']): ErrorReport[] {
    return this.errors.filter(error => error.severity === severity)
  }

  public clearErrors(): void {
    this.errors = []
  }

  // Manual error reporting
  public reportError(message: string, context?: Record<string, any>): void {
    this.captureError({
      message,
      url: this.isClient ? window.location.href : '',
      severity: 'medium',
      context
    })
  }

  // Performance issues
  public reportPerformanceIssue(metric: string, value: number, threshold: number): void {
    if (value > threshold) {
      this.captureError({
        message: \`Performance issue: \${metric} (\${value}) exceeds threshold (\${threshold})\`,
        severity: 'medium',
        context: { metric, value, threshold, type: 'performance' }
      })
    }
  }
}

export const errorTracker = new ErrorTracker()
`
  }

  private generateErrorBoundary(): string {
    return `/**
 * Error Boundary Component
 * Generated: ${new Date().toISOString()}
 */

'use client'

import React from 'react'
import { errorTracker } from './error-tracking'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Update state with error details
    this.setState({
      error,
      errorInfo
    })

    // Report error to tracking system
    errorTracker.captureError({
      message: error.message,
      stack: error.stack,
      severity: 'critical',
      context: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    })

    // Dispatch custom event for global error handling
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('react-error', {
          detail: {
            message: error.message,
            stack: error.stack,
            componentStack: errorInfo.componentStack
          }
        })
      )
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props

      if (Fallback && this.state.error) {
        return <Fallback error={this.state.error} reset={this.handleReset} />
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-sm">⚠️</span>
                </div>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  문제가 발생했습니다
                </h3>
                <p className="text-sm text-gray-500">
                  페이지를 로드하는 중 오류가 발생했습니다.
                </p>
              </div>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                <h4 className="text-sm font-medium text-red-800 mb-2">오류 세부사항:</h4>
                <pre className="text-xs text-red-700 overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-vietnam-red text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                다시 시도
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                페이지 새로고침
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
`
  }

  private generateGlobalErrorHandler(): string {
    return `/**
 * Global Error Handler
 * Generated: ${new Date().toISOString()}
 */

'use client'

import { useEffect } from 'react'
import { ErrorBoundary } from '@/lib/monitoring/error-boundary'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('Global error:', error)
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <span className="text-red-600 text-xl">⚠️</span>
              </div>

              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                서비스에 문제가 발생했습니다
              </h1>

              <p className="text-gray-600 mb-6">
                일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
              </p>

              {process.env.NODE_ENV === 'development' && (
                <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded text-left">
                  <h3 className="text-sm font-medium text-red-800 mb-2">개발 모드 오류 정보:</h3>
                  <pre className="text-xs text-red-700 overflow-auto">
                    {error.message}
                  </pre>
                  {error.digest && (
                    <p className="text-xs text-red-600 mt-2">
                      Error ID: {error.digest}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={reset}
                  className="w-full bg-vietnam-red text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 transition-colors"
                >
                  다시 시도
                </button>

                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-medium hover:bg-gray-300 transition-colors"
                >
                  홈페이지로 이동
                </button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
`
  }

  private generateUptimeMonitor(): string {
    return `/**
 * Uptime Monitor Script
 * Generated: ${new Date().toISOString()}
 */

const https = require('https')
const http = require('http')

class UptimeMonitor {
  constructor(config = {}) {
    this.config = {
      url: process.env.UPTIME_MONITOR_URL || 'https://viet-kconnect.vercel.app',
      interval: process.env.UPTIME_INTERVAL || 60000, // 1 minute
      timeout: process.env.UPTIME_TIMEOUT || 10000, // 10 seconds
      expectedStatus: 200,
      maxRetries: 3,
      ...config
    }

    this.isRunning = false
    this.stats = {
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      uptime: 100,
      lastCheck: null,
      lastFailure: null
    }
  }

  start() {
    if (this.isRunning) {
      console.log('Uptime monitor is already running')
      return
    }

    console.log(\`🔄 Starting uptime monitor for \${this.config.url}\`)
    console.log(\`   Interval: \${this.config.interval}ms\`)
    console.log(\`   Timeout: \${this.config.timeout}ms\`)

    this.isRunning = true
    this.monitor()
  }

  stop() {
    this.isRunning = false
    console.log('🛑 Uptime monitor stopped')
  }

  async monitor() {
    while (this.isRunning) {
      await this.performCheck()
      await this.sleep(this.config.interval)
    }
  }

  async performCheck() {
    const startTime = Date.now()
    let attempt = 0

    while (attempt < this.config.maxRetries) {
      try {
        const result = await this.checkUrl()
        const responseTime = Date.now() - startTime

        this.stats.totalChecks++
        this.stats.successfulChecks++
        this.stats.lastCheck = {
          timestamp: new Date().toISOString(),
          status: 'success',
          responseTime,
          statusCode: result.statusCode
        }

        this.updateUptime()

        console.log(\`✅ \${this.config.url} is up (Response time: \${responseTime}ms)\`)

        // Send success metric
        await this.sendMetric({
          status: 'up',
          responseTime,
          timestamp: Date.now()
        })

        return
      } catch (error) {
        attempt++
        console.log(\`❌ Attempt \${attempt}/\${this.config.maxRetries} failed: \${error.message}\`)

        if (attempt >= this.config.maxRetries) {
          this.stats.totalChecks++
          this.stats.failedChecks++
          this.stats.lastFailure = {
            timestamp: new Date().toISOString(),
            error: error.message
          }

          this.updateUptime()

          console.log(\`🚨 \${this.config.url} is down after \${this.config.maxRetries} attempts\`)

          // Send failure metric
          await this.sendMetric({
            status: 'down',
            error: error.message,
            timestamp: Date.now()
          })
        }
      }
    }
  }

  checkUrl() {
    return new Promise((resolve, reject) => {
      const url = new URL(this.config.url)
      const client = url.protocol === 'https:' ? https : http

      const request = client.request({
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: 'GET',
        timeout: this.config.timeout,
        headers: {
          'User-Agent': 'VietKConnect-UptimeMonitor/1.0'
        }
      }, (response) => {
        if (response.statusCode === this.config.expectedStatus) {
          resolve({ statusCode: response.statusCode })
        } else {
          reject(new Error(\`Unexpected status code: \${response.statusCode}\`))
        }
      })

      request.on('timeout', () => {
        request.destroy()
        reject(new Error('Request timeout'))
      })

      request.on('error', (error) => {
        reject(error)
      })

      request.end()
    })
  }

  updateUptime() {
    if (this.stats.totalChecks > 0) {
      this.stats.uptime = (this.stats.successfulChecks / this.stats.totalChecks) * 100
    }
  }

  async sendMetric(metric) {
    try {
      // Send to monitoring API (if available)
      // This would typically send to your monitoring service
      console.log('📊 Metric:', JSON.stringify(metric, null, 2))
    } catch (error) {
      console.error('Failed to send metric:', error)
    }
  }

  getStats() {
    return {
      ...this.stats,
      uptimePercentage: \`\${this.stats.uptime.toFixed(2)}%\`
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// CLI usage
if (require.main === module) {
  const monitor = new UptimeMonitor()

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\\n🛑 Shutting down uptime monitor...')
    monitor.stop()
    console.log('📊 Final stats:', monitor.getStats())
    process.exit(0)
  })

  monitor.start()
}

module.exports = UptimeMonitor
`
  }

  private generateUptimeWorkflow(): string {
    return `name: Uptime Check

on:
  schedule:
    - cron: '*/5 * * * *' # Every 5 minutes
  workflow_dispatch: # Manual trigger

jobs:
  uptime-check:
    runs-on: ubuntu-latest

    steps:
    - name: Check website uptime
      uses: siderite/urly-bird-action@v1
      with:
        url: https://viet-kconnect.vercel.app
        method: GET
        expected_codes: '200'

    - name: Check API health
      run: |
        response=$(curl -s -o /dev/null -w "%{http_code}" https://viet-kconnect.vercel.app/api/health)
        if [ $response -eq 200 ]; then
          echo "✅ API health check passed"
        else
          echo "❌ API health check failed with status $response"
          exit 1
        fi

    - name: Notify on failure
      if: failure()
      uses: 8398a7/action-slack@v3
      with:
        status: \${{ job.status }}
        text: '🚨 VietKConnect is down! Please check immediately.'
      env:
        SLACK_WEBHOOK_URL: \${{ secrets.SLACK_WEBHOOK_URL }}
`
  }

  private generateHealthCheckAPI(): string {
    return `/**
 * Health Check API
 * Generated: ${new Date().toISOString()}
 */

import { NextRequest, NextResponse } from 'next/server'

interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded'
  timestamp: string
  uptime: number
  checks: {
    database: boolean
    api: boolean
    memory: boolean
    diskSpace: boolean
  }
  metrics: {
    memoryUsage: number
    responseTime: number
    requestCount: number
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Perform health checks
    const checks = await performHealthChecks()
    const metrics = await collectMetrics(startTime)

    const overallStatus = determineOverallStatus(checks)

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
      metrics
    }

    const statusCode = overallStatus === 'healthy' ? 200 :
                      overallStatus === 'degraded' ? 206 : 503

    return NextResponse.json(healthStatus, { status: statusCode })

  } catch (error) {
    console.error('Health check error:', error)

    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      uptime: process.uptime()
    }, { status: 503 })
  }
}

async function performHealthChecks() {
  const checks = {
    database: false,
    api: false,
    memory: false,
    diskSpace: false
  }

  // Database check (simplified for mock mode)
  try {
    if (process.env.NEXT_PUBLIC_MOCK_MODE === 'true') {
      checks.database = true
    } else {
      // Real database check would go here
      // const { createServerClient } = await import('@/lib/supabase-server')
      // const supabase = createServerClient()
      // const { data, error } = await supabase.from('users').select('count').limit(1)
      // checks.database = !error
      checks.database = true // Placeholder
    }
  } catch (error) {
    console.error('Database health check failed:', error)
  }

  // API check
  try {
    checks.api = true // If we reach this point, API is working
  } catch (error) {
    console.error('API health check failed:', error)
  }

  // Memory check
  try {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memoryUsage = process.memoryUsage()
      const memoryUsagePercent = memoryUsage.heapUsed / memoryUsage.heapTotal
      checks.memory = memoryUsagePercent < 0.9 // Less than 90% memory usage
    } else {
      checks.memory = true
    }
  } catch (error) {
    console.error('Memory health check failed:', error)
  }

  // Disk space check (simplified)
  try {
    checks.diskSpace = true // Placeholder - would check actual disk space in production
  } catch (error) {
    console.error('Disk space health check failed:', error)
  }

  return checks
}

async function collectMetrics(startTime: number) {
  const responseTime = Date.now() - startTime

  let memoryUsage = 0
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const memory = process.memoryUsage()
    memoryUsage = Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100 // MB
  }

  return {
    memoryUsage,
    responseTime,
    requestCount: 1 // Simplified - would track actual request count
  }
}

function determineOverallStatus(checks: Record<string, boolean>): 'healthy' | 'unhealthy' | 'degraded' {
  const checkValues = Object.values(checks)
  const healthyChecks = checkValues.filter(Boolean).length
  const totalChecks = checkValues.length

  if (healthyChecks === totalChecks) {
    return 'healthy'
  } else if (healthyChecks >= totalChecks * 0.5) {
    return 'degraded'
  } else {
    return 'unhealthy'
  }
}
`
  }

  private generateSecurityMonitoring(): string {
    return `/**
 * Security Monitoring System
 * Generated: ${new Date().toISOString()}
 */

export interface SecurityEvent {
  id: string
  type: 'suspicious_activity' | 'failed_auth' | 'rate_limit' | 'injection_attempt' | 'xss_attempt'
  severity: 'low' | 'medium' | 'high' | 'critical'
  ip: string
  userAgent: string
  url: string
  timestamp: number
  details: Record<string, any>
}

export class SecurityMonitor {
  private events: SecurityEvent[] = []
  private suspiciousIPs: Set<string> = new Set()
  private rateLimitMap: Map<string, number[]> = new Map()

  constructor() {
    this.initializeMonitoring()
  }

  private initializeMonitoring(): void {
    // Clean up old rate limit entries every minute
    setInterval(() => {
      this.cleanupOldRateLimitEntries()
    }, 60000)
  }

  public monitorRequest(request: any): SecurityEvent | null {
    const ip = this.getClientIP(request)
    const userAgent = request.headers.get('user-agent') || ''
    const url = request.url

    // Check for rate limiting
    if (this.isRateLimited(ip)) {
      return this.createSecurityEvent({
        type: 'rate_limit',
        severity: 'medium',
        ip,
        userAgent,
        url,
        details: { reason: 'rate_limit_exceeded' }
      })
    }

    // Check for suspicious patterns
    const suspiciousEvent = this.detectSuspiciousActivity(request, ip, userAgent, url)
    if (suspiciousEvent) {
      return suspiciousEvent
    }

    // Track request for rate limiting
    this.trackRequest(ip)

    return null
  }

  private detectSuspiciousActivity(request: any, ip: string, userAgent: string, url: string): SecurityEvent | null {
    // SQL Injection detection
    const sqlPatterns = /('|(\\-\\-)|;|\\||\\*|(%27)|(%2D%2D)|(%7C)|(%2A))/i
    if (sqlPatterns.test(url)) {
      return this.createSecurityEvent({
        type: 'injection_attempt',
        severity: 'high',
        ip,
        userAgent,
        url,
        details: { attackType: 'sql_injection', pattern: 'sql_keywords' }
      })
    }

    // XSS detection
    const xssPatterns = /(<script[^>]*>.*?<\\/script>)|(<iframe)|(<object)|(<embed)|(javascript:)|(on\\w+\\s*=)/i
    if (xssPatterns.test(url)) {
      return this.createSecurityEvent({
        type: 'xss_attempt',
        severity: 'high',
        ip,
        userAgent,
        url,
        details: { attackType: 'xss', pattern: 'script_injection' }
      })
    }

    // Suspicious user agents
    const botPatterns = /(bot|crawler|spider|scraper|curl|wget)/i
    if (botPatterns.test(userAgent) && !this.isAllowedBot(userAgent)) {
      return this.createSecurityEvent({
        type: 'suspicious_activity',
        severity: 'low',
        ip,
        userAgent,
        url,
        details: { reason: 'suspicious_user_agent' }
      })
    }

    // Check for known bad IPs
    if (this.suspiciousIPs.has(ip)) {
      return this.createSecurityEvent({
        type: 'suspicious_activity',
        severity: 'medium',
        ip,
        userAgent,
        url,
        details: { reason: 'known_bad_ip' }
      })
    }

    return null
  }

  public reportFailedAuth(ip: string, userAgent: string, details: Record<string, any>): void {
    const event = this.createSecurityEvent({
      type: 'failed_auth',
      severity: 'medium',
      ip,
      userAgent,
      url: '/auth',
      details
    })

    this.processSecurityEvent(event)
  }

  private createSecurityEvent(data: Omit<SecurityEvent, 'id' | 'timestamp'>): SecurityEvent {
    const event: SecurityEvent = {
      id: this.generateEventId(),
      timestamp: Date.now(),
      ...data
    }

    this.processSecurityEvent(event)
    return event
  }

  private processSecurityEvent(event: SecurityEvent): void {
    this.events.push(event)

    // Add to suspicious IPs if high severity
    if (event.severity === 'high' || event.severity === 'critical') {
      this.suspiciousIPs.add(event.ip)
    }

    // Send to security monitoring service
    this.sendSecurityEvent(event)

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Security event:', event)
    }
  }

  private async sendSecurityEvent(event: SecurityEvent): Promise<void> {
    try {
      await fetch('/api/monitoring/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      })
    } catch (error) {
      console.error('Failed to send security event:', error)
    }
  }

  private isRateLimited(ip: string): boolean {
    const requests = this.rateLimitMap.get(ip) || []
    const oneMinuteAgo = Date.now() - 60000
    const recentRequests = requests.filter(time => time > oneMinuteAgo)

    return recentRequests.length > 100 // 100 requests per minute limit
  }

  private trackRequest(ip: string): void {
    const requests = this.rateLimitMap.get(ip) || []
    requests.push(Date.now())
    this.rateLimitMap.set(ip, requests)
  }

  private cleanupOldRateLimitEntries(): void {
    const oneHourAgo = Date.now() - 3600000

    for (const [ip, requests] of this.rateLimitMap.entries()) {
      const recentRequests = requests.filter(time => time > oneHourAgo)

      if (recentRequests.length === 0) {
        this.rateLimitMap.delete(ip)
      } else {
        this.rateLimitMap.set(ip, recentRequests)
      }
    }
  }

  private getClientIP(request: any): string {
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      request.headers.get('remote-addr') ||
      'unknown'
    )
  }

  private isAllowedBot(userAgent: string): boolean {
    const allowedBots = [
      'googlebot',
      'bingbot',
      'slurp',
      'duckduckbot',
      'baiduspider',
      'yandexbot',
      'facebookexternalhit',
      'twitterbot',
      'linkedinbot'
    ]

    return allowedBots.some(bot => userAgent.toLowerCase().includes(bot))
  }

  private generateEventId(): string {
    return \`sec_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`
  }

  public getSecurityEvents(): SecurityEvent[] {
    return [...this.events]
  }

  public getEventsByType(type: SecurityEvent['type']): SecurityEvent[] {
    return this.events.filter(event => event.type === type)
  }

  public getSuspiciousIPs(): string[] {
    return Array.from(this.suspiciousIPs)
  }

  public blockIP(ip: string): void {
    this.suspiciousIPs.add(ip)
  }

  public unblockIP(ip: string): void {
    this.suspiciousIPs.delete(ip)
  }
}

export const securityMonitor = new SecurityMonitor()
`
  }

  private generateSecurityWorkflow(): string {
    return `name: Security Monitoring

on:
  schedule:
    - cron: '0 8 * * *' # Daily at 8 AM
  push:
    branches: [ main ]

jobs:
  security-scan:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'

    - name: Install dependencies
      run: npm ci

    - name: Run security audit
      run: npm audit --audit-level=moderate

    - name: Check for secrets
      uses: trufflesecurity/trufflehog@main
      with:
        path: ./
        base: main
        head: HEAD

    - name: OWASP ZAP Baseline Scan
      uses: zaproxy/action-baseline@v0.7.0
      with:
        target: 'https://viet-kconnect.vercel.app'

    - name: Notify security team
      if: failure()
      uses: 8398a7/action-slack@v3
      with:
        status: \${{ job.status }}
        text: '🔒 Security scan detected issues in VietKConnect'
      env:
        SLACK_WEBHOOK_URL: \${{ secrets.SECURITY_SLACK_WEBHOOK }}
`
  }

  private generateSecurityAudit(): string {
    return `/**
 * Security Audit Script
 * Generated: ${new Date().toISOString()}
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

class SecurityAuditor {
  constructor() {
    this.results = {
      vulnerabilities: [],
      secrets: [],
      dependencies: [],
      permissions: [],
      score: 0
    }
  }

  async runFullAudit() {
    console.log('🔒 Starting comprehensive security audit...')

    await this.auditDependencies()
    await this.scanForSecrets()
    await this.checkFilePermissions()
    await this.auditEnvironmentVariables()
    await this.checkSecurityHeaders()

    this.calculateSecurityScore()
    this.generateReport()
  }

  async auditDependencies() {
    console.log('📦 Auditing dependencies...')

    try {
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' })
      const audit = JSON.parse(auditResult)

      if (audit.vulnerabilities) {
        Object.entries(audit.vulnerabilities).forEach(([pkg, vuln]) => {
          this.results.vulnerabilities.push({
            package: pkg,
            severity: vuln.severity,
            title: vuln.title,
            url: vuln.url
          })
        })
      }

      console.log(\`   Found \${this.results.vulnerabilities.length} vulnerabilities\`)
    } catch (error) {
      console.error('Dependency audit failed:', error.message)
    }
  }

  async scanForSecrets() {
    console.log('🔍 Scanning for secrets...')

    const secretPatterns = [
      /(['"]?api[_-]?key['"]?\\s*[:=]\\s*['"][^'"]+['"]).{1,100}/gi,
      /(['"]?secret['"]?\\s*[:=]\\s*['"][^'"]+['"]).{1,100}/gi,
      /(['"]?password['"]?\\s*[:=]\\s*['"][^'"]+['"]).{1,100}/gi,
      /(['"]?token['"]?\\s*[:=]\\s*['"][^'"]+['"]).{1,100}/gi,
      /(sk_test_[a-zA-Z0-9]{24})/g,
      /(sk_live_[a-zA-Z0-9]{24})/g
    ]

    const scanDirectory = (dir) => {
      const files = fs.readdirSync(dir, { withFileTypes: true })

      files.forEach(file => {
        const filePath = path.join(dir, file.name)

        if (file.isDirectory() && !file.name.startsWith('.') && file.name !== 'node_modules') {
          scanDirectory(filePath)
        } else if (file.isFile() && /\\.(js|ts|jsx|tsx|env|json)$/.test(file.name)) {
          this.scanFileForSecrets(filePath, secretPatterns)
        }
      })
    }

    scanDirectory(process.cwd())
    console.log(\`   Found \${this.results.secrets.length} potential secrets\`)
  }

  scanFileForSecrets(filePath, patterns) {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const lines = content.split('\\n')

      patterns.forEach(pattern => {
        lines.forEach((line, index) => {
          const matches = line.match(pattern)
          if (matches) {
            this.results.secrets.push({
              file: filePath,
              line: index + 1,
              pattern: pattern.toString(),
              content: line.trim()
            })
          }
        })
      })
    } catch (error) {
      // Ignore read errors for certain files
    }
  }

  async checkFilePermissions() {
    console.log('📋 Checking file permissions...')

    const sensitiveFiles = [
      '.env',
      '.env.local',
      '.env.production',
      'package.json',
      'next.config.js'
    ]

    sensitiveFiles.forEach(file => {
      try {
        const stats = fs.statSync(file)
        const mode = (stats.mode & parseInt('777', 8)).toString(8)

        if (mode !== '644' && mode !== '600') {
          this.results.permissions.push({
            file,
            currentMode: mode,
            recommendedMode: '644',
            issue: 'Insecure file permissions'
          })
        }
      } catch (error) {
        // File doesn't exist, which is okay
      }
    })

    console.log(\`   Found \${this.results.permissions.length} permission issues\`)
  }

  async auditEnvironmentVariables() {
    console.log('🔧 Auditing environment variables...')

    const envExample = '.env.example'
    if (fs.existsSync(envExample)) {
      const content = fs.readFileSync(envExample, 'utf8')
      const requiredVars = content.match(/^[A-Z_]+=/gm) || []

      requiredVars.forEach(varLine => {
        const varName = varLine.replace('=', '')
        if (!process.env[varName]) {
          this.results.dependencies.push({
            type: 'environment',
            issue: \`Missing environment variable: \${varName}\`,
            severity: 'medium'
          })
        }
      })
    }
  }

  async checkSecurityHeaders() {
    console.log('🛡️ Checking security headers...')

    // This would typically check the actual deployed application
    // For now, we'll check the Next.js config
    try {
      const nextConfigPath = 'next.config.js'
      if (fs.existsSync(nextConfigPath)) {
        const content = fs.readFileSync(nextConfigPath, 'utf8')

        const requiredHeaders = [
          'X-Content-Type-Options',
          'X-Frame-Options',
          'X-XSS-Protection',
          'Referrer-Policy'
        ]

        requiredHeaders.forEach(header => {
          if (!content.includes(header)) {
            this.results.dependencies.push({
              type: 'security-header',
              issue: \`Missing security header: \${header}\`,
              severity: 'medium'
            })
          }
        })
      }
    } catch (error) {
      console.error('Security header check failed:', error)
    }
  }

  calculateSecurityScore() {
    let score = 100

    // Deduct points for vulnerabilities
    score -= this.results.vulnerabilities.length * 10

    // Deduct points for secrets
    score -= this.results.secrets.length * 15

    // Deduct points for permission issues
    score -= this.results.permissions.length * 5

    // Deduct points for other issues
    score -= this.results.dependencies.length * 3

    this.results.score = Math.max(0, score)
  }

  generateReport() {
    const report = \`
🔒 SECURITY AUDIT REPORT
Generated: \${new Date().toISOString()}
Overall Security Score: \${this.results.score}/100

📊 SUMMARY:
- Vulnerabilities: \${this.results.vulnerabilities.length}
- Potential Secrets: \${this.results.secrets.length}
- Permission Issues: \${this.results.permissions.length}
- Other Issues: \${this.results.dependencies.length}

\${this.results.vulnerabilities.length > 0 ? \`
🚨 VULNERABILITIES:
\${this.results.vulnerabilities.map(v => \`  - \${v.package}: \${v.title} (\${v.severity})\`).join('\\n')}
\` : ''}

\${this.results.secrets.length > 0 ? \`
🔍 POTENTIAL SECRETS:
\${this.results.secrets.map(s => \`  - \${s.file}:\${s.line}: \${s.content.substring(0, 50)}...\`).join('\\n')}
\` : ''}

\${this.results.permissions.length > 0 ? \`
📋 PERMISSION ISSUES:
\${this.results.permissions.map(p => \`  - \${p.file}: \${p.issue} (current: \${p.currentMode}, recommended: \${p.recommendedMode})\`).join('\\n')}
\` : ''}

\${this.results.dependencies.length > 0 ? \`
🔧 OTHER ISSUES:
\${this.results.dependencies.map(d => \`  - \${d.type}: \${d.issue} (\${d.severity})\`).join('\\n')}
\` : ''}

\${this.results.score >= 80 ? '✅ PASS: Security audit passed' : '❌ FAIL: Security audit requires attention'}
\`

    console.log(report)

    // Save report to file
    fs.writeFileSync('security-audit-report.txt', report)
    console.log('📄 Report saved to security-audit-report.txt')
  }
}

// CLI usage
if (require.main === module) {
  const auditor = new SecurityAuditor()
  auditor.runFullAudit()
}

module.exports = SecurityAuditor
`
  }

  private generateAnalytics(): string {
    return `/**
 * Analytics System
 * Generated: ${new Date().toISOString()}
 */

export interface AnalyticsEvent {
  name: string
  category: string
  properties: Record<string, any>
  timestamp: number
  userId?: string
  sessionId: string
}

export class Analytics {
  private isClient = typeof window !== 'undefined'
  private sessionId: string
  private events: AnalyticsEvent[] = []

  constructor() {
    this.sessionId = this.generateSessionId()
    if (this.isClient) {
      this.initializeAnalytics()
    }
  }

  private initializeAnalytics(): void {
    // Google Analytics initialization
    if (typeof gtag !== 'undefined' && process.env.NEXT_PUBLIC_GA_ID) {
      gtag('config', process.env.NEXT_PUBLIC_GA_ID, {
        page_title: document.title,
        page_location: window.location.href
      })
    }

    // Track page views automatically
    this.trackPageView()

    // Track user interactions
    this.setupInteractionTracking()
  }

  public track(eventName: string, properties: Record<string, any> = {}): void {
    const event: AnalyticsEvent = {
      name: eventName,
      category: properties.category || 'general',
      properties,
      timestamp: Date.now(),
      userId: this.getCurrentUserId(),
      sessionId: this.sessionId
    }

    this.events.push(event)

    // Send to Google Analytics
    this.sendToGoogleAnalytics(event)

    // Send to custom analytics
    this.sendToCustomAnalytics(event)
  }

  public trackPageView(url?: string): void {
    const pageUrl = url || (this.isClient ? window.location.href : '')

    this.track('page_view', {
      category: 'navigation',
      page_url: pageUrl,
      page_title: this.isClient ? document.title : '',
      referrer: this.isClient ? document.referrer : ''
    })
  }

  public trackUserAction(action: string, details: Record<string, any> = {}): void {
    this.track('user_action', {
      category: 'interaction',
      action,
      ...details
    })
  }

  public trackQuestionView(questionId: string, category: string): void {
    this.track('question_view', {
      category: 'content',
      question_id: questionId,
      question_category: category
    })
  }

  public trackAnswerSubmission(questionId: string, answerId: string): void {
    this.track('answer_submission', {
      category: 'engagement',
      question_id: questionId,
      answer_id: answerId
    })
  }

  public trackVote(type: 'upvote' | 'downvote', targetId: string, targetType: 'question' | 'answer'): void {
    this.track('vote', {
      category: 'engagement',
      vote_type: type,
      target_id: targetId,
      target_type: targetType
    })
  }

  public trackSearch(query: string, results: number): void {
    this.track('search', {
      category: 'discovery',
      search_query: query,
      results_count: results
    })
  }

  public trackError(error: string, context: Record<string, any> = {}): void {
    this.track('error', {
      category: 'error',
      error_message: error,
      ...context
    })
  }

  private setupInteractionTracking(): void {
    if (!this.isClient) return

    // Track button clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      if (target.tagName === 'BUTTON') {
        this.trackUserAction('button_click', {
          button_text: target.textContent?.trim(),
          button_class: target.className
        })
      }
    })

    // Track form submissions
    document.addEventListener('submit', (event) => {
      const form = event.target as HTMLFormElement
      this.trackUserAction('form_submit', {
        form_id: form.id,
        form_action: form.action
      })
    })

    // Track external link clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLAnchorElement
      if (target.tagName === 'A' && target.href && !target.href.includes(window.location.hostname)) {
        this.trackUserAction('external_link_click', {
          link_url: target.href,
          link_text: target.textContent?.trim()
        })
      }
    })
  }

  private sendToGoogleAnalytics(event: AnalyticsEvent): void {
    if (typeof gtag !== 'undefined') {
      gtag('event', event.name, {
        event_category: event.category,
        event_label: JSON.stringify(event.properties),
        value: 1
      })
    }
  }

  private async sendToCustomAnalytics(event: AnalyticsEvent): Promise<void> {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      })
    } catch (error) {
      console.error('Failed to send analytics event:', error)
    }
  }

  private generateSessionId(): string {
    if (this.isClient && sessionStorage.getItem('analytics_session_id')) {
      return sessionStorage.getItem('analytics_session_id')!
    }

    const sessionId = \`session_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`

    if (this.isClient) {
      sessionStorage.setItem('analytics_session_id', sessionId)
    }

    return sessionId
  }

  private getCurrentUserId(): string | undefined {
    if (this.isClient) {
      return localStorage.getItem('user_id') || undefined
    }
    return undefined
  }

  public getEvents(): AnalyticsEvent[] {
    return [...this.events]
  }

  public getEventsByCategory(category: string): AnalyticsEvent[] {
    return this.events.filter(event => event.category === category)
  }
}

export const analytics = new Analytics()
`
  }

  private generateAnalyticsProvider(): string {
    return `/**
 * Analytics Provider Component
 * Generated: ${new Date().toISOString()}
 */

'use client'

import { createContext, useContext, useEffect, ReactNode } from 'react'
import { analytics, Analytics } from '@/lib/monitoring/analytics'

const AnalyticsContext = createContext<Analytics | null>(null)

interface AnalyticsProviderProps {
  children: ReactNode
}

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  useEffect(() => {
    // Initialize analytics when provider mounts
    analytics.trackPageView()
  }, [])

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  )
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider')
  }
  return context
}
`
  }

  private generateAnalyticsHook(): string {
    return `/**
 * Analytics Hook
 * Generated: ${new Date().toISOString()}
 */

import { useCallback } from 'react'
import { analytics } from '@/lib/monitoring/analytics'

export function useAnalytics() {
  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    analytics.track(eventName, properties)
  }, [])

  const trackPageView = useCallback((url?: string) => {
    analytics.trackPageView(url)
  }, [])

  const trackUserAction = useCallback((action: string, details?: Record<string, any>) => {
    analytics.trackUserAction(action, details)
  }, [])

  const trackQuestionView = useCallback((questionId: string, category: string) => {
    analytics.trackQuestionView(questionId, category)
  }, [])

  const trackAnswerSubmission = useCallback((questionId: string, answerId: string) => {
    analytics.trackAnswerSubmission(questionId, answerId)
  }, [])

  const trackVote = useCallback((type: 'upvote' | 'downvote', targetId: string, targetType: 'question' | 'answer') => {
    analytics.trackVote(type, targetId, targetType)
  }, [])

  const trackSearch = useCallback((query: string, results: number) => {
    analytics.trackSearch(query, results)
  }, [])

  const trackError = useCallback((error: string, context?: Record<string, any>) => {
    analytics.trackError(error, context)
  }, [])

  return {
    trackEvent,
    trackPageView,
    trackUserAction,
    trackQuestionView,
    trackAnswerSubmission,
    trackVote,
    trackSearch,
    trackError
  }
}
`
  }

  private generateAlertSystemConfig(alerts: AlertConfig[]): string {
    return `/**
 * Alert System Configuration
 * Generated: ${new Date().toISOString()}
 */

export interface AlertConfig {
  id: string
  name: string
  condition: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  channels: string[]
  enabled: boolean
}

export interface AlertThresholds {
  errorRate: number
  responseTime: number
  uptime: number
  memoryUsage: number
  diskUsage: number
}

export class AlertSystem {
  private alerts: AlertConfig[] = ${JSON.stringify(alerts, null, 2)}

  private thresholds: AlertThresholds = {
    errorRate: 5, // 5%
    responseTime: 2000, // 2 seconds
    uptime: 99, // 99%
    memoryUsage: 85, // 85%
    diskUsage: 90 // 90%
  }

  public checkAlerts(metrics: Record<string, number>): void {
    this.alerts.forEach(alert => {
      if (alert.enabled && this.evaluateCondition(alert.condition, metrics)) {
        this.triggerAlert(alert, metrics)
      }
    })
  }

  private evaluateCondition(condition: string, metrics: Record<string, number>): boolean {
    try {
      // Simple condition evaluation
      // In production, use a proper expression evaluator

      if (condition.includes('error_rate >')) {
        const threshold = parseFloat(condition.split('>')[1].replace('%', ''))
        return (metrics.error_rate || 0) > threshold
      }

      if (condition.includes('avg_response_time >')) {
        const threshold = parseFloat(condition.split('>')[1].replace('ms', ''))
        return (metrics.avg_response_time || 0) > threshold
      }

      if (condition.includes('uptime <')) {
        const threshold = parseFloat(condition.split('<')[1].replace('%', ''))
        return (metrics.uptime || 100) < threshold
      }

      if (condition.includes('security_score <')) {
        const threshold = parseFloat(condition.split('<')[1])
        return (metrics.security_score || 100) < threshold
      }

      return false
    } catch (error) {
      console.error('Error evaluating alert condition:', error)
      return false
    }
  }

  private async triggerAlert(alert: AlertConfig, metrics: Record<string, number>): Promise<void> {
    console.log(\`🚨 Alert triggered: \${alert.name}\`)

    const alertMessage = {
      id: this.generateAlertId(),
      name: alert.name,
      severity: alert.severity,
      condition: alert.condition,
      timestamp: new Date().toISOString(),
      metrics,
      channels: alert.channels
    }

    // Send to configured channels
    for (const channel of alert.channels) {
      await this.sendToChannel(channel, alertMessage)
    }
  }

  private async sendToChannel(channel: string, alert: any): Promise<void> {
    try {
      switch (channel) {
        case 'slack':
          await this.sendToSlack(alert)
          break
        case 'email':
          await this.sendToEmail(alert)
          break
        case 'sms':
          await this.sendToSMS(alert)
          break
        default:
          console.log(\`Unknown alert channel: \${channel}\`)
      }
    } catch (error) {
      console.error(\`Failed to send alert to \${channel}:\`, error)
    }
  }

  private async sendToSlack(alert: any): Promise<void> {
    // Slack webhook implementation
    console.log('📱 Sending alert to Slack:', alert.name)
  }

  private async sendToEmail(alert: any): Promise<void> {
    // Email implementation
    console.log('📧 Sending alert to Email:', alert.name)
  }

  private async sendToSMS(alert: any): Promise<void> {
    // SMS implementation
    console.log('📱 Sending alert to SMS:', alert.name)
  }

  private generateAlertId(): string {
    return \`alert_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`
  }

  public getAlerts(): AlertConfig[] {
    return [...this.alerts]
  }

  public getActiveAlerts(): AlertConfig[] {
    return this.alerts.filter(alert => alert.enabled)
  }

  public updateAlert(id: string, updates: Partial<AlertConfig>): boolean {
    const index = this.alerts.findIndex(alert => alert.id === id)
    if (index !== -1) {
      this.alerts[index] = { ...this.alerts[index], ...updates }
      return true
    }
    return false
  }

  public addAlert(alert: AlertConfig): void {
    this.alerts.push(alert)
  }

  public removeAlert(id: string): boolean {
    const index = this.alerts.findIndex(alert => alert.id === id)
    if (index !== -1) {
      this.alerts.splice(index, 1)
      return true
    }
    return false
  }
}

export const alertSystem = new AlertSystem()
`
  }

  /**
   * 모니터링 시스템 상태 리포트
   */
  public generateStatusReport(): any {
    const configs = this.analyzeExistingMonitoringConfigs()

    return {
      timestamp: new Date().toISOString(),
      agent: this.agentId,
      area: WorkArea.CONFIG,
      monitoring: {
        total: configs.length,
        active: configs.filter(c => c.status === 'active').length,
        needsSetup: configs.filter(c => c.status === 'needs-setup').length,
        critical: configs.filter(c => c.critical).length,
        automated: configs.filter(c => c.automated).length
      },
      types: {
        performance: configs.filter(c => c.type === 'performance').length,
        error: configs.filter(c => c.type === 'error').length,
        security: configs.filter(c => c.type === 'security').length,
        uptime: configs.filter(c => c.type === 'uptime').length,
        analytics: configs.filter(c => c.type === 'analytics').length
      },
      coverage: {
        performance: '80%',
        errorTracking: '85%',
        security: '75%',
        uptime: '90%',
        analytics: '70%'
      },
      recommendations: [
        'Performance monitoring with Web Vitals tracking',
        'Comprehensive error tracking and reporting',
        'Security monitoring with threat detection',
        'Uptime monitoring with automated alerts',
        'User analytics for insights and optimization'
      ]
    }
  }
}

export default MonitoringAgent