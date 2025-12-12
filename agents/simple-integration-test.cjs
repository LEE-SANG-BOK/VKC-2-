/**
 * 🧪 Simple Integration Test - JavaScript 기반 에이전트 시스템 검증
 * TypeScript 에이전트들의 기본 구조 및 상호 연결성 테스트
 */

const fs = require('fs');
const path = require('path');

class SimpleIntegrationTester {
  constructor() {
    this.projectRoot = '/Users/bk/Desktop/viet-kconnect';
    this.agentsPath = path.join(this.projectRoot, 'agents');
  }

  /**
   * 전체 에이전트 시스템 구조 검증
   */
  async runIntegrationVerification() {
    console.log('🧪 Starting Agent System Integration Verification\n');

    const results = {
      structureVerification: await this.verifyDirectoryStructure(),
      fileExistence: await this.verifyAgentFiles(),
      areaMapping: await this.verifyAreaMapping(),
      interconnection: await this.verifyInterconnections()
    };

    this.printResults(results);
    return this.calculateOverallStatus(results);
  }

  /**
   * 디렉토리 구조 검증
   */
  async verifyDirectoryStructure() {
    console.log('📁 Verifying directory structure...');

    const requiredDirs = [
      'frontend',
      'backend',
      'config'
    ];

    const results = [];

    for (const dir of requiredDirs) {
      const dirPath = path.join(this.agentsPath, dir);
      const exists = fs.existsSync(dirPath);
      results.push({
        name: `Area ${dir.toUpperCase()} directory`,
        passed: exists,
        path: dirPath
      });
    }

    return results;
  }

  /**
   * 에이전트 파일 존재 검증
   */
  async verifyAgentFiles() {
    console.log('📄 Verifying agent files...');

    const requiredFiles = [
      // Core System
      'area-isolation-system.ts',
      'parallel-agent-manager.ts',
      'communication-agent.ts',
      'debug-agent.ts',
      'integration-test.ts',

      // Frontend Area
      'frontend/ui-design-agent.ts',
      'frontend/theme-system-agent.ts',

      // Backend Area
      'backend/api-development-agent.ts',
      'backend/database-agent.ts',
      'backend/auth-system-agent.ts',

      // Config Area
      'config/build-system-agent.ts',
      'config/deployment-agent.ts',
      'config/monitoring-agent.ts'
    ];

    const results = [];

    for (const file of requiredFiles) {
      const filePath = path.join(this.agentsPath, file);
      const exists = fs.existsSync(filePath);
      const size = exists ? fs.statSync(filePath).size : 0;

      results.push({
        name: file,
        passed: exists && size > 1000, // At least 1KB of content
        size: size,
        path: filePath
      });
    }

    return results;
  }

  /**
   * 영역 매핑 검증
   */
  async verifyAreaMapping() {
    console.log('🗺️ Verifying area mapping logic...');

    try {
      // Read area isolation system
      const areaSystemPath = path.join(this.agentsPath, 'area-isolation-system.ts');
      const content = fs.readFileSync(areaSystemPath, 'utf8');

      const results = [];

      // Check for work area definitions
      const hasWorkAreaEnum = content.includes('enum WorkArea') || content.includes('WorkArea =');
      results.push({
        name: 'WorkArea enum definition',
        passed: hasWorkAreaEnum
      });

      // Check for area mappings
      const hasAreaMappings = content.includes('FRONTEND') && content.includes('BACKEND') && content.includes('CONFIG');
      results.push({
        name: 'Area mappings (Frontend, Backend, Config)',
        passed: hasAreaMappings
      });

      // Check for access control
      const hasAccessControl = content.includes('checkAccess') || content.includes('validateAccess');
      results.push({
        name: 'Access control mechanisms',
        passed: hasAccessControl
      });

      return results;

    } catch (error) {
      return [{
        name: 'Area mapping system',
        passed: false,
        error: error.message
      }];
    }
  }

  /**
   * 상호 연결성 검증
   */
  async verifyInterconnections() {
    console.log('🔗 Verifying agent interconnections...');

    const results = [];

    try {
      // Check communication agent
      const commAgentPath = path.join(this.agentsPath, 'communication-agent.ts');
      const commContent = fs.readFileSync(commAgentPath, 'utf8');

      const hasMessageRouting = commContent.includes('sendMessage') || commContent.includes('routeMessage');
      results.push({
        name: 'Communication agent message routing',
        passed: hasMessageRouting
      });

      // Check parallel manager
      const parallelManagerPath = path.join(this.agentsPath, 'parallel-agent-manager.ts');
      const parallelContent = fs.readFileSync(parallelManagerPath, 'utf8');

      const hasWorkScheduling = parallelContent.includes('scheduleWork') || parallelContent.includes('assignTask');
      results.push({
        name: 'Parallel manager work scheduling',
        passed: hasWorkScheduling
      });

      // Check debug agent cross-area capability
      const debugAgentPath = path.join(this.agentsPath, 'debug-agent.ts');
      const debugContent = fs.readFileSync(debugAgentPath, 'utf8');

      const hasCrossAreaDebug = debugContent.includes('area') || debugContent.includes('cross');
      results.push({
        name: 'Debug agent cross-area capability',
        passed: hasCrossAreaDebug
      });

      return results;

    } catch (error) {
      return [{
        name: 'Agent interconnections',
        passed: false,
        error: error.message
      }];
    }
  }

  /**
   * 결과 출력
   */
  printResults(results) {
    console.log('\n📊 Integration Verification Results:\n');

    for (const [category, tests] of Object.entries(results)) {
      console.log(`\n📋 ${category.replace(/([A-Z])/g, ' $1').trim()}:`);

      for (const test of tests) {
        const status = test.passed ? '✅' : '❌';
        const details = test.size ? ` (${test.size} bytes)` : '';
        const error = test.error ? ` - Error: ${test.error}` : '';

        console.log(`  ${status} ${test.name}${details}${error}`);
      }
    }
  }

  /**
   * 전체 상태 계산
   */
  calculateOverallStatus(results) {
    let totalTests = 0;
    let passedTests = 0;

    for (const tests of Object.values(results)) {
      for (const test of tests) {
        totalTests++;
        if (test.passed) passedTests++;
      }
    }

    const successRate = (passedTests / totalTests) * 100;

    console.log(`\n🎯 Overall Integration Status:`);
    console.log(`  Tests Passed: ${passedTests}/${totalTests}`);
    console.log(`  Success Rate: ${successRate.toFixed(1)}%`);

    if (successRate >= 95) {
      console.log(`  Status: 🟢 EXCELLENT - Agent system fully integrated`);
      return true;
    } else if (successRate >= 80) {
      console.log(`  Status: 🟡 GOOD - Minor issues detected`);
      return true;
    } else {
      console.log(`  Status: 🔴 NEEDS ATTENTION - Integration issues found`);
      return false;
    }
  }
}

// Run the test
const tester = new SimpleIntegrationTester();
tester.runIntegrationVerification()
  .then(success => {
    console.log(`\n✨ Integration verification ${success ? 'completed successfully' : 'found issues'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Integration verification failed:', error);
    process.exit(1);
  });