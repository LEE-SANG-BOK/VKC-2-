/**
 * 🧪 Modern Test Agent for Next.js 14 + TypeScript
 * 
 * 현재 프로젝트 환경:
 * - Next.js 14 (App Router)
 * - TypeScript + React
 * - Vitest (+ Playwright 선택)
 * - Supabase + PostgreSQL
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import path from 'path'

interface TestConfig {
  component?: string
  props?: string[]
  interactions?: string[]
  accessibility?: boolean
  performance?: boolean
}

interface APITestConfig {
  endpoint: string
  methods: string[]
  auth?: boolean
  validation?: boolean
  supabase?: boolean
}

interface E2ETestConfig {
  name: string
  steps: string[]
  devices?: string[]
  browsers?: string[]
}

export class ModernTestAgent {
  private static projectRoot = process.cwd()
  
  /**
   * React 컴포넌트 테스트 자동 생성
   */
  static async createComponentTest(componentPath: string, config: TestConfig = {}) {
    console.log(`🧪 Creating tests for ${componentPath}...`)
    
    const componentName = path.basename(componentPath, path.extname(componentPath))
    const testPath = `tests/${componentPath.replace(/\.(tsx?|jsx?)$/, '.test.$1')}`
    
    const testTemplate = this.generateComponentTestTemplate(componentName, config)
    
    // 테스트 디렉토리 생성
    const testDir = path.dirname(testPath)
    execSync(`mkdir -p ${testDir}`, { cwd: this.projectRoot })
    
    // 테스트 파일 생성
    writeFileSync(path.join(this.projectRoot, testPath), testTemplate)
    
    console.log(`✅ Component test created: ${testPath}`)
    
    return {
      testPath,
      componentName,
      runCommand: `npm test -- ${testPath}`,
      coverage: `npm test -- --coverage ${componentPath}`
    }
  }

  /**
   * Next.js API Routes 테스트 생성
   */
  static async createAPITest(routePath: string, config: APITestConfig) {
    console.log(`🔗 Creating API tests for ${routePath}...`)
    
    const routeName = path.basename(routePath, '.ts')
    const testPath = `tests/api/${routePath.replace('app/api/', '').replace('.ts', '.test.ts')}`
    
    const testTemplate = this.generateAPITestTemplate(routeName, config)
    
    // 테스트 디렉토리 생성
    const testDir = path.dirname(testPath)
    execSync(`mkdir -p ${testDir}`, { cwd: this.projectRoot })
    
    // 테스트 파일 생성
    writeFileSync(path.join(this.projectRoot, testPath), testTemplate)
    
    console.log(`✅ API test created: ${testPath}`)
    
    return {
      testPath,
      routeName,
      runCommand: `npm test -- ${testPath}`,
      integration: `npm run test:integration -- ${testPath}`
    }
  }

  /**
   * Playwright E2E 테스트 생성
   */
  static async createE2ETest(config: E2ETestConfig) {
    console.log(`🎭 Creating E2E tests for: ${config.name}...`)
    
    const testPath = `e2e/${config.name.toLowerCase().replace(/\s+/g, '-')}.spec.ts`
    
    const testTemplate = this.generateE2ETestTemplate(config)
    
    // E2E 테스트 디렉토리 생성
    execSync(`mkdir -p e2e`, { cwd: this.projectRoot })
    
    // 테스트 파일 생성
    writeFileSync(path.join(this.projectRoot, testPath), testTemplate)
    
    console.log(`✅ E2E test created: ${testPath}`)
    
    return {
      testPath,
      runCommand: `npx playwright test ${testPath}`,
      debug: `npx playwright test ${testPath} --debug`
    }
  }

  /**
   * 전체 테스트 스위트 실행
   */
  static async runTestSuite(type: 'unit' | 'integration' | 'e2e' | 'all' = 'all') {
    console.log(`🚀 Running ${type} tests...`)
    
    const commands = {
      unit: 'npm test',
      integration: 'npm run test:integration',
      e2e: 'npx playwright test',
      all: 'npm test && npm run test:integration && npx playwright test'
    }
    
    try {
      const output = execSync(commands[type], { 
        cwd: this.projectRoot,
        encoding: 'utf8',
        stdio: 'pipe'
      })
      
      console.log(`✅ ${type} tests completed successfully`)
      return {
        success: true,
        output,
        type
      }
    } catch (error: any) {
      console.error(`❌ ${type} tests failed:`, error.stdout)
      return {
        success: false,
        error: error.stdout,
        type
      }
    }
  }

  /**
   * 테스트 커버리지 분석
   */
  static async analyzeCoverage() {
    console.log('📊 Analyzing test coverage...')
    
    try {
      const output = execSync('npm test -- --coverage --reporter=json', {
        cwd: this.projectRoot,
        encoding: 'utf8'
      })
      
      const coverage = JSON.parse(output)
      
      const analysis = {
        totalCoverage: coverage.total.lines.pct,
        uncoveredFiles: Object.entries(coverage)
          .filter(([_, data]: [string, any]) => data.lines?.pct < 80)
          .map(([file]) => file),
        recommendations: this.generateCoverageRecommendations(coverage)
      }
      
      console.log('✅ Coverage analysis completed')
      return analysis
    } catch (error) {
      console.error('❌ Coverage analysis failed:', error)
      return null
    }
  }

  /**
   * Supabase 목킹 설정
   */
  static async setupSupabaseMocking() {
    console.log('🗄️ Setting up Supabase mocking...')
    
    const mockSetupPath = 'tests/setup/supabase-mock.ts'
    
    const mockTemplate = `
import { createClient } from '@supabase/supabase-js'
import { vi } from 'vitest'

// Supabase 클라이언트 목킹
export const createMockSupabase = () => {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      then: vi.fn()
    })),
    auth: {
      signUp: vi.fn(),
      signIn: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(),
      getUser: vi.fn()
    }
  }
}

// 전역 목킹 설정
vi.mock('@/lib/supabase', () => ({
  supabase: createMockSupabase()
}))
`
    
    execSync(`mkdir -p tests/setup`, { cwd: this.projectRoot })
    writeFileSync(path.join(this.projectRoot, mockSetupPath), mockTemplate)
    
    console.log('✅ Supabase mocking setup completed')
    return mockSetupPath
  }

  // Private 헬퍼 메서드들
  
  private static generateComponentTestTemplate(componentName: string, config: TestConfig): string {
    return `
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { ${componentName} } from '@/components/${componentName}'

describe('${componentName}', () => {
  it('renders correctly', () => {
    render(<${componentName} />)
    expect(screen.getByRole('main')).toBeInTheDocument()
  })

  ${config.props?.map(prop => `
  it('handles ${prop} prop correctly', () => {
    const mock${prop.charAt(0).toUpperCase() + prop.slice(1)} = vi.fn()
    render(<${componentName} ${prop}={mock${prop.charAt(0).toUpperCase() + prop.slice(1)}} />)
    // Test ${prop} functionality
  })
  `).join('') || ''}

  ${config.interactions?.map(interaction => `
  it('handles ${interaction} interaction', async () => {
    const handleInteraction = vi.fn()
    render(<${componentName} on${interaction.charAt(0).toUpperCase() + interaction.slice(1)}={handleInteraction} />)
    
    const element = screen.getByRole('button') // Adjust selector as needed
    fireEvent.${interaction}(element)
    
    await waitFor(() => {
      expect(handleInteraction).toHaveBeenCalled()
    })
  })
  `).join('') || ''}

  ${config.accessibility ? `
  it('meets accessibility standards', () => {
    const { container } = render(<${componentName} />)
    // Add accessibility tests using @testing-library/jest-dom
  })
  ` : ''}

  ${config.performance ? `
  it('performs efficiently', () => {
    const start = performance.now()
    render(<${componentName} />)
    const end = performance.now()
    
    expect(end - start).toBeLessThan(100) // Should render in <100ms
  })
  ` : ''}
})
`.trim()
  }

  private static generateAPITestTemplate(routeName: string, config: APITestConfig): string {
    return `
import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '@/app/api/${config.endpoint}/route'

describe('/api/${config.endpoint}', () => {
  ${config.methods.includes('GET') ? `
  describe('GET', () => {
    it('returns data successfully', async () => {
      const request = new NextRequest('http://localhost:3000/api/${config.endpoint}')
      const response = await GET(request)
      
      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toBeDefined()
    })

    ${config.auth ? `
    it('requires authentication', async () => {
      const request = new NextRequest('http://localhost:3000/api/${config.endpoint}')
      // Test without auth header
      const response = await GET(request)
      expect(response.status).toBe(401)
    })
    ` : ''}
  })
  ` : ''}

  ${config.methods.includes('POST') ? `
  describe('POST', () => {
    it('creates resource successfully', async () => {
      const testData = { /* test data */ }
      const request = new NextRequest('http://localhost:3000/api/${config.endpoint}', {
        method: 'POST',
        body: JSON.stringify(testData)
      })
      
      const response = await POST(request)
      expect(response.status).toBe(201)
    })

    ${config.validation ? `
    it('validates input data', async () => {
      const invalidData = { /* invalid data */ }
      const request = new NextRequest('http://localhost:3000/api/${config.endpoint}', {
        method: 'POST',
        body: JSON.stringify(invalidData)
      })
      
      const response = await POST(request)
      expect(response.status).toBe(400)
    })
    ` : ''}
  })
  ` : ''}

  ${config.supabase ? `
  describe('Supabase Integration', () => {
    it('handles database operations correctly', async () => {
      // Test Supabase operations
      // Mock Supabase client for testing
    })

    it('handles database errors gracefully', async () => {
      // Test error handling
    })
  })
  ` : ''}
})
`.trim()
  }

  private static generateE2ETestTemplate(config: E2ETestConfig): string {
    return `
import { test, expect } from '@playwright/test'

test.describe('${config.name}', () => {
  test('completes full user flow', async ({ page }) => {
    // 테스트 시작
    await page.goto('/')

    ${config.steps.map((step, index) => `
    // Step ${index + 1}: ${step}
    // TODO: Implement ${step.toLowerCase()} interactions
    `).join('')}

    // 최종 검증
    await expect(page).toHaveTitle(/Viet K-Connect/)
  })

  ${config.devices?.map(device => `
  test('works on ${device}', async ({ page }) => {
    await page.setViewportSize(
      ${device === 'mobile' ? '{ width: 375, height: 667 }' : '{ width: 1280, height: 720 }'}
    )
    await page.goto('/')
    // Device-specific tests
  })
  `).join('') || ''}

  ${config.browsers?.map(browser => `
  test('works in ${browser}', async ({ page }) => {
    // Browser-specific tests
    await page.goto('/')
    // Add browser compatibility tests
  })
  `).join('') || ''}
})
`.trim()
  }

  private static generateCoverageRecommendations(coverage: any): string[] {
    const recommendations: string[] = []
    
    if (coverage.total.lines.pct < 80) {
      recommendations.push('Overall test coverage is below 80%. Consider adding more unit tests.')
    }
    
    if (coverage.total.functions.pct < 90) {
      recommendations.push('Function coverage is low. Focus on testing all exported functions.')
    }
    
    if (coverage.total.branches.pct < 75) {
      recommendations.push('Branch coverage needs improvement. Add tests for edge cases and error conditions.')
    }
    
    return recommendations
  }
}

export default ModernTestAgent
