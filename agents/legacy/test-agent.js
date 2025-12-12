/**
 * 테스트 전용 커스텀 서브에이전트
 *
 * ⚠️ 중요 제약사항:
 * - 데이터베이스 스키마 변경 금지
 * - 마이그레이션 파일 직접 생성 금지
 * - 기존 테스트 구조 및 설정 준수 필수
 */

const TestAgent = {
  name: "test-agent",
  description: "Vanilla JS 프로젝트의 테스트 작성, 실행, 디버깅 전용 에이전트",

  capabilities: [
    "unit-test-creation",
    "integration-test-setup",
    "test-debugging",
    "test-coverage-analysis",
    "mock-data-generation"
  ],

  restrictions: [
    "NO_DATABASE_SCHEMA_CHANGES",
    "NO_MIGRATION_FILE_CREATION",
    "NO_TEST_FRAMEWORK_CHANGES"
  ],

  methods: {
    /**
     * 컴포넌트별 단위 테스트 생성
     */
    createUnitTests(componentPath, testSpecs) {
      return {
        action: "create-unit-test",
        target: componentPath,
        framework: "vanilla-js-testing",
        specs: testSpecs,
        restrictions: ["no-db-changes", "follow-existing-patterns"]
      };
    },

    /**
     * 통합 테스트 설정 및 생성
     */
    setupIntegrationTests(modules) {
      return {
        action: "setup-integration-test",
        modules: modules,
        testType: "dom-manipulation",
        restrictions: ["no-schema-changes", "use-existing-api"]
      };
    },

    /**
     * 테스트 실행 및 결과 분석
     */
    runTestSuite(testType = "all") {
      return {
        action: "run-tests",
        type: testType,
        coverage: true,
        restrictions: ["read-only-operations"]
      };
    },

    /**
     * 모킹 데이터 생성 (DB 스키마 변경 없이)
     */
    generateMockData(dataType) {
      return {
        action: "generate-mock",
        type: dataType,
        restrictions: ["no-schema-dependency", "use-existing-models"]
      };
    }
  },

  // 테스트 가능한 컴포넌트 목록
  testableComponents: [
    "src/components/Header.js",
    "src/components/PostCard.js",
    "src/components/AnswerCard.js",
    "src/components/LoginModal.js",
    "src/components/CertificationModal.js",
    "src/components/AdminDashboardModal.js",
    "src/components/Spinner.js"
  ],

  // 테스트 가능한 페이지 목록
  testablePages: [
    "src/pages/HomePage.js",
    "src/pages/AllPostsPage.js",
    "src/pages/PostDetailPage.js"
  ],

  // API 테스트 대상
  testableAPIs: [
    "src/api/firebase.js"
  ],

  // 실행 예시
  example: {
    usage: "TestAgent.createUnitTests('src/components/PostCard.js', ['render', 'click-events', 'data-binding'])",
    warning: "⚠️ 데이터베이스 스키마 변경이나 마이그레이션 파일 생성을 시도하지 마세요"
  }
};

module.exports = TestAgent;