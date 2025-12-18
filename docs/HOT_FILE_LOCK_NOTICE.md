# Hot File 잠금 공지 (Ultrawide 배치 핫픽스)

- 본 공지는 **LEAD 직접 소유/수행 작업**(ultrawide 배치 핫픽스)로 인해, 병렬 작업 중 “왜 깨졌는지 모른 채” 재발하는 충돌을 예방하기 위한 잠금 안내입니다.

## 배경

- LEAD 작업: ultrawide 배치 핫픽스
  - `Header` 컨테이너를 `MainLayout`과 동일한 grid/max-width 기준으로 정렬
  - 홈 화면은 canvas 전환 반영
- 이번 배치 기준으로 코드 수정 + `npm run lint` / `npm run build`까지는 ✅ 완료
- 운영상 “완료” 기준은 **로컬 환경에서 커밋/푸시로 스냅샷 고정되는 시점**
  - Codex CLI 환경에서는 `git add/commit`이 `.git/index.lock` 이슈로 실패할 수 있어, 해당 단계는 로컬 터미널에서만 처리

## Hot File 잠금 범위

- 아래 파일들은 LEAD가 스냅샷(커밋/푸시) 고정 전까지 **병렬 수정 금지**
  - `src/components/organisms/Header.tsx`
  - `src/components/templates/MainLayout.tsx`
  - `src/app/[lang]/(main)/home/HomeClient.tsx`

## 에이전트 운영 규칙

- Hot File이 필요한 작업은 LEAD 스냅샷 고정 이후 진행
- 불가피하게 변경이 필요한 경우: LEAD와 선합의 후 진행(작업 이유/변경 범위/검증 결과 공유)

