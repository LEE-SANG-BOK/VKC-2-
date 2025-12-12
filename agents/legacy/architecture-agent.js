/**
 * 아키텍처 레이어별 분석 전용 커스텀 서브에이전트
 *
 * ⚠️ 중요 제약사항:
 * - 데이터베이스 스키마 변경 금지
 * - 마이그레이션 파일 직접 생성 금지
 * - 기존 아키텍처 구조 분석만 수행
 */

const ArchitectureAgent = {
  name: "architecture-agent",
  description: "Vanilla JS 프로젝트의 아키텍처 레이어별 분석 및 구조 최적화 제안 전용 에이전트",

  capabilities: [
    "layer-analysis",
    "dependency-mapping",
    "architecture-pattern-detection",
    "code-organization-review",
    "performance-bottleneck-identification"
  ],

  restrictions: [
    "NO_DATABASE_SCHEMA_CHANGES",
    "NO_MIGRATION_FILE_CREATION",
    "NO_ARCHITECTURE_BREAKING_CHANGES",
    "ANALYSIS_ONLY_MODE"
  ],

  layers: {
    /**
     * 프레젠테이션 레이어 (UI Components)
     */
    presentation: {
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
      responsibilities: ["DOM 조작", "이벤트 핸들링", "UI 상태 관리"]
    },

    /**
     * 비즈니스 로직 레이어
     */
    business: {
      location: "src/main.js",
      patterns: ["라우팅", "상태 관리", "이벤트 디스패처"],
      responsibilities: ["앱 상태 관리", "라우팅 로직", "컴포넌트 조합"]
    },

    /**
     * 데이터 액세스 레이어
     */
    data: {
      apis: ["src/api/firebase.js"],
      responsibilities: ["외부 API 통신", "데이터 변환", "에러 핸들링"],
      restrictions: ["스키마 변경 금지", "API 구조 유지"]
    },

    /**
     * 인프라스트럭처 레이어
     */
    infrastructure: {
      i18n: ["src/i18n/i18n.js"],
      config: ["vite.config.js", "package.json"],
      responsibilities: ["다국어 지원", "빌드 설정", "의존성 관리"]
    }
  },

  methods: {
    /**
     * 전체 아키텍처 분석
     */
    analyzeArchitecture() {
      return {
        action: "full-architecture-analysis",
        scope: "all-layers",
        output: ["dependency-graph", "coupling-analysis", "cohesion-metrics"],
        restrictions: ["read-only", "no-schema-changes"]
      };
    },

    /**
     * 특정 레이어 분석
     */
    analyzeLayer(layerName) {
      return {
        action: "layer-specific-analysis",
        layer: layerName,
        metrics: ["complexity", "responsibilities", "dependencies"],
        restrictions: ["no-modifications", "analysis-only"]
      };
    },

    /**
     * 컴포넌트 간 의존성 분석
     */
    analyzeDependencies() {
      return {
        action: "dependency-analysis",
        scope: "component-interactions",
        output: ["dependency-tree", "circular-dependency-check"],
        restrictions: ["no-restructuring", "mapping-only"]
      };
    },

    /**
     * 성능 병목 지점 식별
     */
    identifyBottlenecks() {
      return {
        action: "performance-analysis",
        focus: ["DOM-operations", "state-updates", "event-handlers"],
        restrictions: ["identification-only", "no-optimizations"]
      };
    },

    /**
     * 아키텍처 패턴 감지
     */
    detectPatterns() {
      return {
        action: "pattern-detection",
        patterns: ["MVC", "Observer", "Module", "Singleton"],
        restrictions: ["detection-only", "no-pattern-enforcement"]
      };
    }
  },

  analysisAreas: {
    codeOrganization: "파일 구조 및 모듈 분리도 분석",
    componentCoupling: "컴포넌트 간 결합도 측정",
    stateManagement: "전역 상태 관리 패턴 분석",
    eventFlow: "이벤트 흐름 및 데이터 플로우 분석",
    performanceMetrics: "렌더링 및 상호작용 성능 분석"
  },

  // 실행 예시
  example: {
    usage: "ArchitectureAgent.analyzeLayer('presentation')",
    fullAnalysis: "ArchitectureAgent.analyzeArchitecture()",
    warning: "⚠️ 분석만 수행하며, 데이터베이스 스키마나 마이그레이션 파일을 변경하지 않습니다"
  }
};

module.exports = ArchitectureAgent;