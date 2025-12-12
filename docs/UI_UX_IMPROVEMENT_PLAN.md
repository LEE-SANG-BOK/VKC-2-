# 종합 UI/UX 개선 플랜 (웹 + 모바일)

> 현재 웹사이트의 UI/UX 디자인 분석 및 통합 개선 방안  
> 작성일: 2025-12-07  
> 범위: 데스크탑/태블릿/모바일 전체

---

## 1. 현재 상태 분석

### 1.1 레이아웃 구조

```
┌─────────────────────────────────────────────────────────────┐
│ Header (고정)                                               │
├────────────────┬────────────────────────────────────────────┤
│ CategorySidebar│ Main Content                               │
│ (280px)       │ ├─ NewsSection (관리자 뉴스)               │
│               │ │   ↓ gap-6 (24px) ← 너무 큼               │
│               │ ├─ PostList (게시글 목록)                   │
│               │ │   ↓ space-y-4                            │
│               │ └─ Footer 없음                             │
└────────────────┴────────────────────────────────────────────┘
```

### 1.2 현재 간격 분석

| 위치 | 현재 값 | 문제점 | 권장 값 |
|-----|--------|-------|--------|
| Header ↔ NewsSection | `py-6` (24px) | 과도한 상단 여백 | `pt-3` (12px) |
| NewsSection ↔ PostList | `space-y-6` (24px) | 섹션 분리감 과함 | `space-y-3` (12px) |
| PostCard 간격 | `space-y-4` (16px) | 적절함 | 유지 |
| 콘텐츠 좌우 패딩 | `px-4` (16px) | 모바일 좁음 | `px-4 md:px-6` |
| Sidebar 간격 | `py-4 pb-20` | 하단 여백 과도 | `py-3 pb-16` |

### 1.3 컴포넌트별 평가

| 컴포넌트 | 웹 평가 | 모바일 평가 | 주요 문제 |
|---------|--------|-----------|----------|
| **Header** | ⭐⭐⭐⭐ | ⭐⭐⭐ | 검색창 모바일 노출 |
| **NewsSection** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 간격만 조정 필요 |
| **CategorySidebar** | ⭐⭐⭐⭐ | ⭐⭐ | 드로어 전환 필요 |
| **PostList** | ⭐⭐⭐⭐ | ⭐⭐⭐ | 무한스크롤 양호 |
| **PostCard** | ⭐⭐⭐ | ⭐⭐⭐ | 썸네일 레이아웃 |
| **전체 간격** | ⭐⭐ | ⭐⭐⭐ | 과도한 수직 간격 |

---

## 2. 간격 개선 (Spacing Fixes)

### 2.1 HomeClient.tsx 수정

```tsx
// 현재
<div className="flex flex-col gap-6 py-6">
  <div className="px-4 space-y-6">

// 개선 (간격 축소)
<div className="flex flex-col gap-3 pt-3 pb-6">
  <div className="px-4 md:px-6 space-y-3">
```

**변경 사항:**
- `gap-6` → `gap-3`: 섹션 간 간격 24px → 12px
- `py-6` → `pt-3 pb-6`: 상단 여백 축소, 하단 유지
- `space-y-6` → `space-y-3`: 뉴스-게시글 간격 축소
- `px-4` → `px-4 md:px-6`: 데스크탑 좌우 여백 확대

### 2.2 NewsSection.tsx 수정

```tsx
// 현재
<div className="w-full bg-transparent border-b border-gray-200/25">
  <div className="px-3 py-2">

// 개선
<div className="w-full bg-transparent">
  <div className="px-0 py-2">
```

**변경 사항:**
- `border-b` 제거: 하단 경계선 불필요 (간격으로 구분)
- `px-3` → `px-0`: 부모의 px-4와 중복 제거

### 2.3 PostList.tsx 수정

```tsx
// 현재
<div className="px-3 py-4">

// 개선
<div className="px-0 pt-0 pb-4">
```

**변경 사항:**
- `px-3` → `px-0`: 부모의 px-4와 중복 제거
- `py-4` → `pt-0 pb-4`: 상단 여백 제거 (NewsSection과 가까이)

---

## 3. 웹(데스크탑) 개선

### 3.1 Header 개선

| 항목 | 현재 | 개선 |
|-----|-----|-----|
| 높이 | 약 64px | 유지 |
| 검색창 너비 | `max-w-md` | `max-w-lg` |
| 로고-검색 간격 | 자동 | `gap-8` |
| 알림 아이콘 | 기본 | 뱃지 강조 |

### 3.2 Sidebar 개선

| 항목 | 현재 | 개선 |
|-----|-----|-----|
| 너비 | 280px | 260px (약간 좁게) |
| 카테고리 간격 | 기본 | 그룹핑 + 접기/펼치기 |
| 액션 버튼 | 하단 | 고정 위치 `sticky` |
| 스크롤 | 전체 | 독립 스크롤 |

### 3.3 콘텐츠 영역 개선

| 항목 | 현재 | 개선 |
|-----|-----|-----|
| 최대 너비 | 제한 없음 | `max-w-4xl` 권장 |
| 좌우 패딩 | `px-4` | `px-6` (데스크탑) |
| 뉴스 카드 | 가로 스크롤 | 2열 그리드 옵션 |

---

## 4. 모바일 개선

### 4.1 터치 타깃 최적화

```css
/* 모든 버튼/링크 최소 크기 */
button, a, [role="button"] {
  min-height: 44px;
  min-width: 44px;
}
```

### 4.2 하단 네비게이션 추가

```tsx
// src/components/organisms/BottomNavigation.tsx (신규)
<nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t md:hidden z-50 safe-area-pb">
  <div className="flex justify-around py-2">
    <NavItem icon={Home} label="홈" />
    <NavItem icon={Search} label="검색" />
    <NavItem icon={PenSquare} label="글쓰기" />
    <NavItem icon={Bell} label="알림" badge={unreadCount} />
    <NavItem icon={User} label="프로필" />
  </div>
</nav>
```

### 4.3 Sidebar 드로어 전환

```tsx
// 모바일에서 Sheet/Drawer로 변경
<Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
  <SheetContent side="left" className="w-[280px] p-0">
    <CategorySidebar />
  </SheetContent>
</Sheet>
```

### 4.4 PostCard 모바일 레이아웃

```
데스크탑:
┌──────────────────────────────────┬────────┐
│ 제목 / 내용 / 태그 / 액션        │ 썸네일 │
└──────────────────────────────────┴────────┘

모바일:
┌──────────────────────────────────────────┐
│ 썸네일 (16:9, 풀너비)                     │
├──────────────────────────────────────────┤
│ 제목 / 내용 / 태그 / 액션                 │
└──────────────────────────────────────────┘
```

---

## 5. 타이포그래피 시스템

### 5.1 현재 vs 권장 스케일

| 용도 | 현재 (불일치) | 권장 (일관성) |
|-----|-------------|--------------|
| 페이지 제목 | 혼재 | `text-2xl font-bold` |
| 섹션 제목 | `text-sm font-bold` | `text-lg font-semibold` |
| 카드 제목 | `text-xs` ~ `text-base` | `text-base font-medium` |
| 본문 | 혼재 | `text-sm` (모바일 `text-base`) |
| 메타/캡션 | 혼재 | `text-xs text-gray-500` |

### 5.2 폰트 사이즈 반응형

```css
/* 모바일 가독성 향상 */
@media (max-width: 640px) {
  body {
    font-size: 16px; /* 기본값 유지 */
  }
  
  .post-title {
    font-size: 1.125rem; /* 18px */
  }
  
  .post-content {
    font-size: 1rem; /* 16px */
    line-height: 1.6;
  }
}
```

---

## 6. 색상 및 다크모드

### 6.1 현재 상태

- ✅ 다크모드 CSS 변수 정의됨
- ✅ `dark:` Tailwind 클래스 사용
- ⚠️ 일부 하드코딩된 색상 존재

### 6.2 개선 포인트

| 요소 | 현재 | 개선 |
|-----|-----|-----|
| 카드 배경 | `bg-white dark:bg-gray-900` | ✅ 양호 |
| 테두리 | 혼재 | `border-gray-200 dark:border-gray-700` 통일 |
| 텍스트 | 혼재 | `text-gray-900 dark:text-white` 통일 |
| 호버 상태 | 일부 누락 | 모든 인터랙티브 요소에 추가 |

---

## 7. 애니메이션 및 전환

### 7.1 현재 구현

- ✅ `hover:-translate-y-1` 카드 호버
- ✅ `transition-all duration-300` 기본 전환
- ❌ 페이지 전환 애니메이션 없음
- ❌ 스켈레톤 로딩 미흡

### 7.2 개선 포인트

```css
/* 공통 전환 */
.vk-transition {
  transition: transform 0.2s ease, opacity 0.2s ease, box-shadow 0.2s ease;
}

/* 카드 호버 */
.vk-card-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

/* 터치 피드백 */
.vk-touch-feedback:active {
  transform: scale(0.98);
}
```

---

## 8. 즉시 적용 권장 CSS

```css
/* globals.css에 추가 */

/* 섹션 간격 통일 */
.section-gap {
  margin-bottom: 12px;
}

/* 터치 최적화 */
@media (max-width: 768px) {
  button, a[href], [role="button"] {
    min-height: 44px;
  }
  
  /* 하단 네비 공간 확보 */
  .main-content {
    padding-bottom: 80px;
  }
}

/* 콘텐츠 최대 너비 */
.content-container {
  max-width: 896px; /* 56rem */
  margin: 0 auto;
}

/* 카드 간격 최적화 */
.card-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

@media (min-width: 768px) {
  .card-list {
    gap: 16px;
  }
}
```

---

## 9. 우선순위 및 로드맵

### Phase 1: Quick Wins (1~2일)

| 작업 | 파일 | 난이도 |
|-----|-----|-------|
| HomeClient 간격 조정 | `HomeClient.tsx` | ⭐ |
| NewsSection 여백 정리 | `NewsSection.tsx` | ⭐ |
| PostList 패딩 조정 | `PostList.tsx` | ⭐ |
| 터치 타깃 크기 확대 | `globals.css` | ⭐ |

### Phase 2: 모바일 강화 (1주)

| 작업 | 파일 | 난이도 |
|-----|-----|-------|
| 하단 네비게이션 추가 | 신규 컴포넌트 | ⭐⭐ |
| Sidebar 드로어 전환 | `MainLayout.tsx` | ⭐⭐ |
| PostCard 모바일 레이아웃 | `PostCard.tsx` | ⭐⭐ |

### Phase 3: 웹 개선 (1주)

| 작업 | 파일 | 난이도 |
|-----|-----|-------|
| 콘텐츠 최대 너비 설정 | `MainLayout.tsx` | ⭐ |
| 타이포그래피 통일 | `globals.css` | ⭐⭐ |
| 색상 변수 통일 | `globals.css` | ⭐⭐ |

### Phase 4: 폴리싱 (1주)

| 작업 | 파일 | 난이도 |
|-----|-----|-------|
| 애니메이션 개선 | `globals.css` | ⭐⭐ |
| 스켈레톤 로딩 | 각 컴포넌트 | ⭐⭐⭐ |
| 접근성 개선 | 전체 | ⭐⭐⭐ |

---

## 10. 예상 효과

| 지표 | 현재 | 예상 개선 |
|-----|-----|----------|
| **콘텐츠 밀도** | 낮음 | +30% (간격 축소) |
| **모바일 사용성** | 65점 | 90점+ |
| **시각적 일관성** | 혼재 | 통일됨 |
| **로딩 인지** | 보통 | 스켈레톤으로 개선 |
| **터치 성공률** | 75% | 95%+ |

---

## 11. 체크리스트

### 간격
- [ ] HomeClient `gap-6 py-6` → `gap-3 pt-3 pb-6`
- [ ] HomeClient `space-y-6` → `space-y-3`
- [ ] NewsSection 경계선 제거
- [ ] PostList 상단 여백 제거

### 모바일
- [ ] 하단 네비게이션 추가
- [ ] Sidebar 드로어 전환
- [ ] 터치 타깃 44px+
- [ ] FAB 글쓰기 버튼

### 웹
- [ ] 콘텐츠 최대 너비
- [ ] 타이포그래피 통일
- [ ] 호버 상태 일관성

### 공통
- [ ] 다크모드 색상 통일
- [ ] 전환 애니메이션
- [ ] 스켈레톤 로딩
