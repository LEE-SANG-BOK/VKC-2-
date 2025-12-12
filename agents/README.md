#커스텀 서브에이전트 가이드



## 🚨 중요 제약사항

**모든 커스텀 에이전트는 다음 제약사항을 엄격히 준수해야 합니다:**

- ❌ **데이터베이스 스키마 변경 금지**
- ❌ **마이그레이션 파일 직접 생성 금지**
- ❌ **프로덕션 환경 직접 수정 금지**
- ✅ **분석, 제안, 테스트 코드 생성만 허용**

## 사용 가능한 커스텀 에이전트

### 1. 테스트 에이전트 (`test-agent.js`)
**목적**: 테스트 작성, 실행, 디버깅 전용

**주요 기능**:
- 컴포넌트별 단위 테스트 생성
- 통합 테스트 설정
- 테스트 실행 및 커버리지 분석
- 모킹 데이터 생성

**사용 예시**:
```javascript
const TestAgent = require('./test-agent');
TestAgent.createUnitTests('src/components/PostCard.js', ['render', 'click-events']);
```

**제약사항**: 기존 테스트 프레임워크 구조 유지, DB 스키마 변경 금지

---

### 2. 아키텍처 분석 에이전트 (`architecture-agent.js`)
**목적**: 아키텍처 레이어별 분석 및 구조 최적화 제안

**분석 레이어**:
- **프레젠테이션**: UI 컴포넌트 및 페이지
- **비즈니스**: 라우팅 및 상태 관리
- **데이터**: API 통신 레이어
- **인프라**: 설정 및 다국어 지원

**사용 예시**:
```javascript
const ArchitectureAgent = require('./architecture-agent');
ArchitectureAgent.analyzeArchitecture(); // 전체 분석
ArchitectureAgent.analyzeLayer('presentation'); // 특정 레이어 분석
```

**제약사항**: 분석만 수행, 아키텍처 구조 변경 금지

---

### 3. 디버깅 에이전트 (`debug-agent.js`)
**목적**: 버그 추적, 디버깅, 오류 해결

**디버깅 영역**:
- **DOM**: 요소 선택, 이벤트 바인딩 오류
- **Runtime**: JavaScript 실행 오류
- **State**: 상태 관리 문제
- **API**: 통신 오류
- **Routing**: 라우팅 문제

**사용 예시**:
```javascript
const DebugAgent = require('./debug-agent');
DebugAgent.diagnoseIssue('PostCard 클릭 시 모달이 열리지 않음');
DebugAgent.setupConsoleDebugging('src/components/PostCard.js');
```

**제약사항**: 디버깅용 임시 코드만 추가, 프로덕션 코드 변경 금지

---

### 4. 코드분석 에이전트 (`code-analysis-agent.js`)
**목적**: 코드 품질, 구조, 패턴 분석 및 개선 제안

**분석 영역**:
- **품질**: 복잡도, 중복코드, 네이밍 컨벤션
- **구조**: 모듈 구조, 결합도/응집도
- **성능**: DOM 조작, 이벤트 처리 효율성
- **보안**: XSS 취약점, 입력 검증
- **유지보수성**: 가독성, 문서화 품질

**사용 예시**:
```javascript
const CodeAnalysisAgent = require('./code-analysis-agent');
CodeAnalysisAgent.analyzeProject(); // 전체 프로젝트 분석
CodeAnalysisAgent.analyzeFile('src/components/PostCard.js'); // 특정 파일 분석
```

**제약사항**: 분석 및 제안만 제공, 직접 코드 수정 금지

## 프로젝트 구조

```
poi-main/
├── agents/
│   ├── test-agent.js              # 테스트 전용 에이전트
│   ├── architecture-agent.js      # 아키텍처 분석 에이전트
│   ├── debug-agent.js            # 디버깅 전용 에이전트
│   ├── code-analysis-agent.js    # 코드분석 에이전트
│   └── README.md                 # 이 가이드
├── src/
│   ├── components/               # UI 컴포넌트들
│   ├── pages/                   # 페이지 컴포넌트들
│   ├── api/                     # API 통신 레이어
│   └── main.js                  # 메인 애플리케이션
└── ...
```

## 사용 가이드

### 1. 에이전트 로드
```javascript
// Node.js 환경에서
const TestAgent = require('./agents/test-agent');
const ArchitectureAgent = require('./agents/architecture-agent');
const DebugAgent = require('./agents/debug-agent');
const CodeAnalysisAgent = require('./agents/code-analysis-agent');
```

### 2. 일반적인 워크플로우

#### 개발 초기 단계:
1. **아키텍처 분석**: 전체 구조 파악
2. **코드 분석**: 품질 및 패턴 확인
3. **테스트 설정**: 단위/통합 테스트 생성

#### 버그 발생 시:
1. **디버깅 에이전트**: 문제 진단 및 추적
2. **코드 분석**: 관련 코드 품질 검토
3. **테스트 에이전트**: 회귀 테스트 작성

#### 리팩토링 시:
1. **코드 분석**: 현재 상태 평가
2. **아키텍처 분석**: 구조적 개선점 식별
3. **테스트 에이전트**: 안전성 확보

### 3. 제약사항 준수 체크리스트

각 에이전트 사용 전 다음을 확인하세요:

- [ ] 데이터베이스 스키마 변경을 시도하지 않는가?
- [ ] 마이그레이션 파일을 직접 생성하지 않는가?
- [ ] 프로덕션 환경의 코드를 직접 수정하지 않는가?
- [ ] 분석, 제안, 테스트 생성 범위 내에서 작업하는가?

## 문제 해결

### 일반적인 사용 시나리오

1. **새로운 컴포넌트 추가 시**:
   ```javascript
   // 1. 아키텍처 적합성 확인
   ArchitectureAgent.analyzeLayer('presentation');

   // 2. 코드 품질 검증
   CodeAnalysisAgent.analyzeFile('src/components/NewComponent.js');

   // 3. 테스트 작성
   TestAgent.createUnitTests('src/components/NewComponent.js', ['render', 'events']);
   ```

2. **버그 해결 시**:
   ```javascript
   // 1. 문제 진단
   DebugAgent.diagnoseIssue('컴포넌트가 렌더링되지 않음');

   // 2. 관련 코드 분석
   CodeAnalysisAgent.analyzeFile('문제_파일_경로.js');

   // 3. 수정 후 테스트
   TestAgent.runTestSuite('unit');
   ```

3. **성능 최적화 시**:
   ```javascript
   // 1. 성능 병목 식별
   CodeAnalysisAgent.analyzeProject();

   // 2. 아키텍처 레벨 검토
   ArchitectureAgent.identifyBottlenecks();

   // 3. 디버깅 및 프로파일링
   DebugAgent.debugPerformance('느린_함수명');
   ```

## 주의사항

- 모든 에이전트는 **읽기 전용 분석** 모드로 동작합니다
- **직접적인 코드 수정은 금지**되어 있습니다
- **제안 및 분석 결과**를 바탕으로 수동으로 코드를 수정해야 합니다
- **데이터베이스 관련 작업**은 별도로 진행해야 합니다

---

