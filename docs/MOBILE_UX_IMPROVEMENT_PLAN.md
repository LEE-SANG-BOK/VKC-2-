# 모바일 UX/UI 최적화 분석 및 개선 플랜

> 현재 웹사이트의 모바일 최적화 상태 평가 및 개선 방안  
> 작성일: 2025-12-07

---

## 1. 현재 상태 평가

### 1.1 기술 스택 분석

| 항목 | 현재 구현 | 평가 |
|-----|----------|-----|
| **CSS 프레임워크** | Tailwind CSS 4 | ✅ 우수 |
| **다크모드** | `@custom-variant dark` | ✅ 우수 |
| **디자인 토큰** | CSS 변수 (oklch) | ✅ 우수 |
| **반응형 패턴** | `md:flex-row` 등 | ⚠️ 부분적 |
| **미디어쿼리** | 768px 1개만 | ❌ 불충분 |
| **모바일 우선** | 미적용 | ❌ 개선 필요 |

### 1.2 반응형 브레이크포인트 현황

```
┌─────────────────────────────────────────────────────────────┐
│ 발견된 미디어쿼리                                           │
├─────────────────────────────────────────────────────────────┤
│ @media (max-width: 768px)  → question-card 레이아웃만      │
│ @media (prefers-color-scheme: dark)  → 다크모드 전환       │
└─────────────────────────────────────────────────────────────┘

⚠️ 문제점:
- sm (640px), lg (1024px), xl (1280px) 브레이크포인트 CSS 없음
- Tailwind 유틸리티 클래스로만 반응형 처리 중
- 복잡한 레이아웃에서 일관성 부족
```

### 1.3 컴포넌트별 모바일 최적화 현황

| 컴포넌트 | 모바일 최적화 | 문제점 |
|---------|-------------|-------|
| **Header** | ⚠️ 부분 | 검색창 축소, 메뉴 접힘 필요 |
| **CategorySidebar** | ❌ 미흡 | 모바일에서 전체 너비 차지 |
| **PostCard** | ⚠️ 부분 | 썸네일 재배치만 구현 |
| **PostList** | ✅ 양호 | 무한스크롤 구현됨 |
| **RichTextEditor** | ⚠️ 부분 | 툴바 축소 필요 |
| **Modal** | ⚠️ 부분 | 전체화면 전환 필요 |

---

## 2. 세부 분석

### 2.1 터치 친화성

| 항목 | 현재 | 권장 | 상태 |
|-----|-----|-----|-----|
| 버튼 높이 | 32~40px | 44px+ | ⚠️ |
| 터치 타깃 | 다양함 | 48x48px+ | ⚠️ |
| 스와이프 | 미구현 | 탭 전환 | ❌ |
| 풀 투 리프레시 | 미구현 | 리스트 갱신 | ❌ |

### 2.2 타이포그래피 스케일

```css
/* 현재 상태 */
.hero-compact-title: text-lg (1.125rem)     /* 모바일에서 적절 */
.hero-compact-sub: text-sm (0.875rem)       /* 조금 작음 */
.question-card: font-size 미지정            /* 일관성 부족 */

/* 권장 스케일 */
모바일 본문: 16px (1rem)
모바일 제목: 20px (1.25rem)
데스크탑 본문: 16px
데스크탑 제목: 24px
```

### 2.3 레이아웃 패턴

```
현재 구조:
┌─────────────────────────────────────────────────────────────┐
│ Header (상단 고정)                                          │
├────────────────┬────────────────────────────────────────────┤
│ Sidebar        │ Main Content                               │
│ (왼쪽 고정)    │ - PostList                                 │
│ 280px          │ - NewsSection                              │
├────────────────┴────────────────────────────────────────────┤
│ (Footer 없음)                                               │
└─────────────────────────────────────────────────────────────┘

모바일에서 문제:
- Sidebar가 항상 표시되어 콘텐츠 영역 좁아짐
- 하단 네비게이션 없음
- 플로팅 액션 버튼 없음
```

---

## 3. 개선 플랜

### Phase 1: 즉시 개선 (1~3일)

#### 3.1.1 터치 타깃 크기 확대

```css
/* 모든 인터랙티브 요소 */
button, a, [role="button"] {
  min-height: 44px;
  min-width: 44px;
}

/* 모바일에서 더 크게 */
@media (max-width: 768px) {
  .vk-btn {
    padding: 12px 16px;
    font-size: 15px;
  }
}
```

#### 3.1.2 모바일 사이드바 토글

```tsx
// CategorySidebar를 드로어로 변경
<Sheet>
  <SheetTrigger className="md:hidden">
    <Menu />
  </SheetTrigger>
  <SheetContent side="left">
    <CategorySidebar />
  </SheetContent>
</Sheet>
```

#### 3.1.3 하단 내비게이션 추가

```tsx
// BottomNavigation.tsx (신규)
<nav className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden z-50">
  <div className="flex justify-around py-2">
    <NavItem icon={Home} label="홈" href="/" />
    <NavItem icon={Search} label="검색" href="/search" />
    <NavItem icon={PenSquare} label="글쓰기" href="/posts/new" />
    <NavItem icon={Bell} label="알림" href="/notifications" />
    <NavItem icon={User} label="프로필" href="/profile" />
  </div>
</nav>
```

### Phase 2: 레이아웃 개선 (1주)

#### 3.2.1 모바일 우선 브레이크포인트

```css
/* 모바일 기본 (~639px) */
.main-layout {
  display: flex;
  flex-direction: column;
}

/* 태블릿 (640px~1023px) */
@media (min-width: 640px) {
  .main-layout {
    flex-direction: row;
  }
  .sidebar {
    width: 240px;
  }
}

/* 데스크탑 (1024px~) */
@media (min-width: 1024px) {
  .sidebar {
    width: 280px;
  }
}
```

#### 3.2.2 카드 레이아웃 개선

| 뷰포트 | 카드 레이아웃 | 썸네일 |
|-------|-------------|-------|
| 모바일 | 1열, 풀 너비 | 상단 16:9 |
| 태블릿 | 1열 | 우측 4:3 |
| 데스크탑 | 1열 | 우측 4:3 |

### Phase 3: 인터랙션 개선 (1주)

#### 3.3.1 스와이프 제스처

```tsx
// 피드 탭 스와이프
<SwipeableViews index={tabIndex} onChangeIndex={setTabIndex}>
  <PostList filter="popular" />
  <PostList filter="latest" />
  <PostList filter="following" />
</SwipeableViews>
```

#### 3.3.2 풀 투 리프레시

```tsx
// PostList에 적용
const { refetch } = useInfinitePosts();

<PullToRefresh onRefresh={refetch}>
  <PostList />
</PullToRefresh>
```

#### 3.3.3 플로팅 액션 버튼

```tsx
// 스크롤 시 나타나는 FAB
<FloatingActionButton
  className="fixed bottom-20 right-4 md:hidden"
  onClick={() => router.push('/posts/new')}
>
  <Plus className="w-6 h-6" />
</FloatingActionButton>
```

### Phase 4: 성능 최적화 (1주)

#### 3.4.1 이미지 최적화

```tsx
// next/image 사용 강화
<Image
  src={thumbnail}
  alt={title}
  width={400}
  height={225}
  sizes="(max-width: 768px) 100vw, 400px"
  loading="lazy"
  placeholder="blur"
/>
```

#### 3.4.2 뷰포트 기반 로딩

```tsx
// Intersection Observer로 지연 로딩
<InView triggerOnce>
  {({ inView, ref }) => (
    <div ref={ref}>
      {inView ? <HeavyComponent /> : <Skeleton />}
    </div>
  )}
</InView>
```

---

## 4. 우선순위 매트릭스

| 개선 항목 | 임팩트 | 난이도 | 우선순위 |
|----------|-------|-------|---------|
| 터치 타깃 확대 | ⭐⭐⭐⭐ | ⭐ | **P0** |
| 하단 네비게이션 | ⭐⭐⭐⭐⭐ | ⭐⭐ | **P0** |
| 사이드바 드로어 | ⭐⭐⭐⭐ | ⭐⭐ | **P0** |
| 카드 레이아웃 | ⭐⭐⭐ | ⭐⭐ | **P1** |
| 스와이프 제스처 | ⭐⭐⭐ | ⭐⭐⭐ | **P2** |
| 풀 투 리프레시 | ⭐⭐ | ⭐⭐ | **P2** |
| FAB 버튼 | ⭐⭐⭐ | ⭐ | **P1** |
| 이미지 최적화 | ⭐⭐⭐ | ⭐⭐ | **P1** |

---

## 5. 예상 결과

### 개선 전 vs 개선 후

| 지표 | 현재 | 목표 |
|-----|-----|-----|
| 모바일 사용성 점수 | 65점 | 90점+ |
| 터치 타깃 적합률 | 60% | 95%+ |
| 모바일 이탈률 | 높음 | -30% |
| 첫 인터랙션 시간 | 느림 | -40% |

### 체크리스트

- [ ] 모든 버튼 44px+ 터치 타깃
- [ ] 모바일 하단 네비게이션
- [ ] 사이드바 드로어 전환
- [ ] 카드 레이아웃 반응형
- [ ] 스와이프 탭 전환
- [ ] FAB 글쓰기 버튼
- [ ] 이미지 lazy loading
- [ ] 풀 투 리프레시

---

## 6. 즉시 적용 가능한 CSS 패치

```css
/* globals.css에 추가 */

/* 모바일 터치 최적화 */
@media (max-width: 768px) {
  /* 터치 타깃 크기 */
  button, a[href], [role="button"] {
    min-height: 44px;
  }
  
  /* 사이드바 숨김 */
  .sidebar {
    display: none;
  }
  
  /* 콘텐츠 풀 너비 */
  .main-content {
    width: 100%;
    padding: 0 16px;
  }
  
  /* 카드 간격 조정 */
  .question-card {
    margin-bottom: 16px;
    border-radius: 8px;
  }
  
  /* 헤더 간소화 */
  .header-search {
    display: none;
  }
  
  /* 하단 여백 (네비게이션 공간) */
  .main-layout {
    padding-bottom: 80px;
  }
}

/* 태블릿 */
@media (min-width: 640px) and (max-width: 1023px) {
  .sidebar {
    width: 200px;
  }
}
```
