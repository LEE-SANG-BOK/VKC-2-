// Modern Agents for Next.js 14 + TypeScript
// 레거시 에이전트 시스템을 현대화한 TypeScript 기반 에이전트 모음

export { default as ModernTestAgent } from './modern-test-agent'
export { default as ModernArchitectureAgent } from './modern-architecture-agent'
export { default as ModernDebugAgent } from './modern-debug-agent'
export { default as ModernCodeAnalysisAgent } from './modern-code-analysis-agent'
export { default as ModernAutomationAgent } from './modern-automation-agent'

// 통합 사용 예시
export const ModernAgentSuite = {
  // 새 기능 개발 전체 자동화
  async createNewFeature(featureName: string, config: any) {
    const { ModernArchitectureAgent, ModernTestAgent, ModernDebugAgent } = await import('.')
    
    console.log(`🏗️ Creating ${featureName} feature...`)
    
    // 1. 아키텍처 생성
    const architecture = await ModernArchitectureAgent.createFeatureArchitecture({
      name: featureName,
      components: config.components || [],
      apis: config.apis || [],
      hooks: config.hooks || [],
      services: config.services || []
    })
    
    // 2. 테스트 생성
    if (config.generateTests && config.components) {
      for (const component of config.components) {
        await ModernTestAgent.createComponentTest(`${architecture.featurePath}/components/${component.name}.tsx`, {
          props: component.props || [],
          interactions: ['click', 'submit'],
          accessibility: true
        })
      }
    }
    
    // 3. 에러 체크 및 자동 수정
    if (config.autoFix) {
      const errors = await ModernDebugAgent.scanProjectErrors()
      if (errors && errors.errors.length > 0) {
        await ModernDebugAgent.autoFixErrors()
      }
    }
    
    console.log(`✅ ${featureName} feature created successfully!`)
    return architecture
  },
  
  // 프로젝트 전체 분석
  async analyzeProject() {
    const { ModernCodeAnalysisAgent, ModernDebugAgent } = await import('.')
    
    console.log('📊 Starting comprehensive project analysis...')
    
    const results = {
      codeAnalysis: await ModernCodeAnalysisAgent.analyzeProject(),
      errorScan: await ModernDebugAgent.scanProjectErrors(),
      performance: await ModernDebugAgent.debugPerformance()
    }
    
    console.log('✅ Project analysis completed')
    return results
  },
  
  // 개발 환경 자동 설정
  async setupDevelopmentEnvironment() {
    const { ModernAutomationAgent } = await import('.')
    
    console.log('⚙️ Setting up development environment...')
    
    const setup = {
      workflow: await ModernAutomationAgent.setupDevelopmentWorkflow(),
      cicd: await ModernAutomationAgent.createCICDPipeline(),
      monitoring: await ModernAutomationAgent.setupPerformanceMonitoring()
    }
    
    console.log('✅ Development environment setup completed')
    return setup
  }
}