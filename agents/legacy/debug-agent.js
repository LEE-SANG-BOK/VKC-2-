/**
 * 디버깅 전용 커스텀 서브에이전트
 *
 * ⚠️ 중요 제약사항:
 * - 데이터베이스 스키마 변경 금지
 * - 마이그레이션 파일 직접 생성 금지
 * - 디버깅 및 문제 해결에만 집중
 */

const DebugAgent = {
  name: "debug-agent",
  description: "Vanilla JS 프로젝트의 버그 추적, 디버깅, 오류 해결 전용 에이전트",

  capabilities: [
    "error-tracking",
    "console-debugging",
    "dom-inspection",
    "event-debugging",
    "performance-profiling",
    "memory-leak-detection"
  ],

  restrictions: [
    "NO_DATABASE_SCHEMA_CHANGES",
    "NO_MIGRATION_FILE_CREATION",
    "NO_PRODUCTION_CODE_CHANGES",
    "DEBUG_MODE_ONLY"
  ],

  debugCategories: {
    /**
     * DOM 관련 디버깅
     */
    dom: {
      issues: ["요소 선택 실패", "이벤트 바인딩 오류", "CSS 클래스 조작 문제"],
      tools: ["DOM Inspector", "Event Listener Tracking"],
      methods: ["inspectElement", "traceEventFlow", "validateSelectors"]
    },

    /**
     * JavaScript 런타임 오류
     */
    runtime: {
      issues: ["undefined 변수", "타입 오류", "함수 호출 실패", "비동기 처리 오류"],
      tools: ["Console Debugging", "Stack Trace Analysis"],
      methods: ["catchExceptions", "traceStackTrace", "validateTypes"]
    },

    /**
     * 상태 관리 디버깅
     */
    state: {
      issues: ["상태 업데이트 실패", "상태 동기화 문제", "메모리 누수"],
      tools: ["State Inspector", "Change Tracking"],
      methods: ["monitorStateChanges", "detectMemoryLeaks", "validateStateFlow"]
    },

    /**
     * API 통신 디버깅
     */
    api: {
      issues: ["요청 실패", "응답 파싱 오류", "네트워크 타임아웃"],
      tools: ["Network Inspector", "Request/Response Logger"],
      methods: ["logApiCalls", "validateResponses", "trackNetworkErrors"],
      restrictions: ["no-api-modification", "logging-only"]
    },

    /**
     * 라우팅 디버깅
     */
    routing: {
      issues: ["경로 매칭 실패", "해시 변경 감지 오류", "페이지 전환 문제"],
      tools: ["Route Tracer", "Hash Change Monitor"],
      methods: ["traceRouteChanges", "validateRouteMatching", "debugPageTransitions"]
    }
  },

  methods: {
    /**
     * 종합 오류 진단
     */
    diagnoseIssue(errorDescription) {
      return {
        action: "comprehensive-diagnosis",
        target: errorDescription,
        steps: ["error-reproduction", "stack-trace-analysis", "root-cause-identification"],
        restrictions: ["no-data-changes", "debugging-only"]
      };
    },

    /**
     * 콘솔 디버깅 설정
     */
    setupConsoleDebugging(component) {
      return {
        action: "setup-console-debug",
        target: component,
        features: ["error-logging", "state-monitoring", "event-tracking"],
        restrictions: ["temporary-debug-code", "no-permanent-changes"]
      };
    },

    /**
     * 이벤트 플로우 추적
     */
    traceEventFlow(eventType) {
      return {
        action: "trace-event-flow",
        eventType: eventType,
        tracking: ["event-source", "handler-execution", "side-effects"],
        restrictions: ["read-only-tracing", "no-event-modification"]
      };
    },

    /**
     * 성능 병목 지점 디버깅
     */
    debugPerformance(targetFunction) {
      return {
        action: "performance-debugging",
        target: targetFunction,
        metrics: ["execution-time", "memory-usage", "dom-operations"],
        restrictions: ["profiling-only", "no-optimization-implementation"]
      };
    },

    /**
     * 메모리 누수 탐지
     */
    detectMemoryLeaks() {
      return {
        action: "memory-leak-detection",
        scope: ["event-listeners", "dom-references", "closure-variables"],
        tools: ["heap-snapshots", "reference-tracking"],
        restrictions: ["detection-only", "no-memory-cleanup"]
      };
    }
  },

  debuggingTools: {
    console: "console.log, console.error, console.trace 활용",
    breakpoints: "브라우저 개발자 도구 중단점 설정",
    performance: "Performance API를 통한 성능 측정",
    memory: "Memory 탭을 통한 메모리 사용량 추적",
    network: "Network 탭을 통한 API 호출 모니터링"
  },

  commonIssues: {
    "DOM 요소가 null": "요소 선택 타이밍 또는 선택자 문제",
    "이벤트가 발생하지 않음": "이벤트 리스너 바인딩 실패",
    "상태가 업데이트되지 않음": "상태 관리 로직 또는 렌더링 문제",
    "API 호출 실패": "네트워크 또는 인증 문제",
    "페이지 전환 안됨": "라우팅 로직 또는 해시 처리 문제"
  },

  // 실행 예시
  example: {
    usage: "DebugAgent.diagnoseIssue('PostCard 클릭 시 모달이 열리지 않음')",
    setupDebug: "DebugAgent.setupConsoleDebugging('src/components/PostCard.js')",
    warning: "⚠️ 디버깅용 코드만 추가하며, 데이터베이스나 프로덕션 코드를 변경하지 않습니다"
  }
};

module.exports = DebugAgent;