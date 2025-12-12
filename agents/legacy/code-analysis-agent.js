/**
 * 코드분석 전용 커스텀 서브에이전트
 *
 * ⚠️ 중요 제약사항:
 * - 데이터베이스 스키마 변경 금지
 * - 마이그레이션 파일 직접 생성 금지
 * - 코드 품질 분석 및 리팩토링 제안에만 집중
 */

const CodeAnalysisAgent = {
  name: "code-analysis-agent",
  description: "Vanilla JS 프로젝트의 코드 품질, 구조, 패턴 분석 및 개선 제안 전용 에이전트",

  capabilities: [
    "code-quality-analysis",
    "complexity-measurement",
    "pattern-recognition",
    "refactoring-suggestions",
    "best-practices-validation",
    "security-analysis"
  ],

  restrictions: [
    "NO_DATABASE_SCHEMA_CHANGES",
    "NO_MIGRATION_FILE_CREATION",
    "NO_DIRECT_CODE_MODIFICATION",
    "ANALYSIS_AND_SUGGESTIONS_ONLY"
  ],

  analysisTypes: {
    /**
     * 코드 품질 분석
     */
    quality: {
      metrics: [
        "cyclomatic-complexity",
        "code-duplication",
        "naming-conventions",
        "function-length",
        "parameter-count"
      ],
      standards: "JavaScript Best Practices, Clean Code",
      output: ["quality-score", "improvement-suggestions", "refactoring-priorities"]
    },

    /**
     * 구조적 분석
     */
    structure: {
      aspects: [
        "module-organization",
        "separation-of-concerns",
        "coupling-cohesion",
        "dependency-analysis",
        "design-patterns"
      ],
      focus: "코드 구조의 유지보수성 및 확장성",
      restrictions: ["no-structural-changes", "analysis-only"]
    },

    /**
     * 성능 분석
     */
    performance: {
      areas: [
        "dom-manipulation-efficiency",
        "event-handling-optimization",
        "memory-usage-patterns",
        "async-operation-handling",
        "rendering-performance"
      ],
      tools: ["static-analysis", "complexity-calculation"],
      restrictions: ["identification-only", "no-performance-fixes"]
    },

    /**
     * 보안 분석
     */
    security: {
      checks: [
        "xss-vulnerabilities",
        "input-validation",
        "data-sanitization",
        "authentication-patterns",
        "sensitive-data-exposure"
      ],
      scope: "클라이언트 사이드 보안 검증",
      restrictions: ["vulnerability-identification", "no-security-fixes"]
    },

    /**
     * 유지보수성 분석
     */
    maintainability: {
      factors: [
        "code-readability",
        "documentation-quality",
        "error-handling-consistency",
        "testing-coverage",
        "configuration-management"
      ],
      assessment: "장기적 유지보수 용이성 평가"
    }
  },

  methods: {
    /**
     * 전체 프로젝트 코드 분석
     */
    analyzeProject() {
      return {
        action: "full-project-analysis",
        scope: "all-source-files",
        analysis: ["quality", "structure", "performance", "security", "maintainability"],
        output: ["comprehensive-report", "priority-matrix", "action-plan"],
        restrictions: ["read-only", "no-modifications"]
      };
    },

    /**
     * 특정 파일/컴포넌트 분석
     */
    analyzeFile(filePath) {
      return {
        action: "file-specific-analysis",
        target: filePath,
        checks: ["complexity", "patterns", "best-practices", "potential-issues"],
        restrictions: ["analysis-only", "no-file-changes"]
      };
    },

    /**
     * 코드 복잡도 측정
     */
    measureComplexity(functionOrClass) {
      return {
        action: "complexity-measurement",
        target: functionOrClass,
        metrics: ["cyclomatic", "cognitive", "halstead"],
        recommendations: "복잡도 감소 방안 제안",
        restrictions: ["measurement-only", "no-refactoring"]
      };
    },

    /**
     * 중복 코드 탐지
     */
    detectDuplication() {
      return {
        action: "duplication-detection",
        scope: "all-source-files",
        threshold: "3-lines-minimum",
        output: ["duplicate-blocks", "refactoring-opportunities"],
        restrictions: ["detection-only", "no-extraction"]
      };
    },

    /**
     * 디자인 패턴 분석
     */
    analyzePatterns() {
      return {
        action: "pattern-analysis",
        patterns: ["Module", "Observer", "Singleton", "Factory", "MVC"],
        assessment: ["pattern-usage", "implementation-quality", "appropriateness"],
        restrictions: ["identification-only", "no-pattern-refactoring"]
      };
    },

    /**
     * 베스트 프랙티스 검증
     */
    validateBestPractices() {
      return {
        action: "best-practices-validation",
        categories: ["naming", "error-handling", "async-patterns", "dom-manipulation"],
        standards: "JavaScript/ES6+ Best Practices",
        restrictions: ["validation-only", "no-automatic-fixes"]
      };
    }
  },

  analysisTargets: {
    components: [
      "src/components/Header.js",
      "src/components/PostCard.js",
      "src/components/AnswerCard.js",
      "src/components/LoginModal.js",
      "src/components/CertificationModal.js",
      "src/components/AdminDashboardModal.js",
      "src/components/Spinner.js"
    ],
    pages: [
      "src/pages/HomePage.js",
      "src/pages/AllPostsPage.js",
      "src/pages/PostDetailPage.js"
    ],
    core: [
      "src/main.js",
      "src/api/firebase.js",
      "src/i18n/i18n.js"
    ]
  },

  reportFormats: {
    summary: "프로젝트 전체 요약 리포트",
    detailed: "파일별 상세 분석 리포트",
    prioritized: "우선순위별 개선 제안 리포트",
    metrics: "정량적 메트릭 리포트"
  },

  qualityMetrics: {
    complexity: "함수/클래스별 복잡도 점수",
    duplication: "중복 코드 비율",
    maintainability: "유지보수성 지수",
    readability: "가독성 점수",
    testability: "테스트 용이성 점수"
  },

  // 실행 예시
  example: {
    fullAnalysis: "CodeAnalysisAgent.analyzeProject()",
    fileAnalysis: "CodeAnalysisAgent.analyzeFile('src/components/PostCard.js')",
    complexityCheck: "CodeAnalysisAgent.measureComplexity('renderPostCard')",
    warning: "⚠️ 코드 분석 및 개선 제안만 제공하며, 데이터베이스 스키마나 마이그레이션을 변경하지 않습니다"
  }
};

module.exports = CodeAnalysisAgent;