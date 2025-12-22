# STEP3 Source of Truth (SoT) — Visa Rules / Official Sources / PDF Templates

STEP3(비자 확률 추천 + 행정서류 PDF 자동화 + 공식정보 동기화 + 리드 파이프라인)에서 **“무조건 믿고 따라야 하는 입력(SoT)”**을 한 파일에 고정한다.

---

## 1) Official PDF Templates (HiKorea “민원서식”)

- Board (민원서식): `https://www.hikorea.go.kr/board/BoardListR.pt?BBS_GB_CD=BS10&BBS_SEQ=41`
- Download mechanism
  - UI의 `fnNewFileDownLoad(...)`는 `https://www.hikorea.go.kr/fileNewExistsChkAjax.pt`로 다운로드를 트리거한다.
  - **주의:** `Referer`가 없으면 “비정상적인 경로”로 차단될 수 있음 → 아래 `curl -e` 예시처럼 referer 포함.

### 1.1 통합신청서(신고서)

- PDF fileId: `down-1-1-2.pdf`
- Original filename: `통합신청서(신고서).pdf`
- Download (example):
  - `curl -L -e 'https://www.hikorea.go.kr/board/BoardListR.pt?BBS_GB_CD=BS10&BBS_SEQ=41' -G 'https://www.hikorea.go.kr/fileNewExistsChkAjax.pt' --data-urlencode 'spec=pt' --data-urlencode 'dir=info' --data-urlencode 'apndFileNm=down-1-1-2.pdf' --data-urlencode 'oriFileNm=통합신청서(신고서).pdf' --data-urlencode 'BBS_GB_CD=BS10' --data-urlencode 'BBS_SEQ=41' -o '통합신청서(신고서).pdf'`

### 1.2 외국인유학생 시간제취업 확인서 (시간제취업확인서)

- PDF fileId: `down-1-8-3.pdf`
- Original filename: `시간제취업확인서.pdf`
- Download (example):
  - `curl -L -e 'https://www.hikorea.go.kr/board/BoardListR.pt?BBS_GB_CD=BS10&BBS_SEQ=41' -G 'https://www.hikorea.go.kr/fileNewExistsChkAjax.pt' --data-urlencode 'spec=pt' --data-urlencode 'dir=info' --data-urlencode 'apndFileNm=down-1-8-3.pdf' --data-urlencode 'oriFileNm=시간제취업확인서.pdf' --data-urlencode 'BBS_GB_CD=BS10' --data-urlencode 'BBS_SEQ=41' -o '시간제취업확인서.pdf'`

### 1.3 유학생 시간제취업 요건 준수 확인서(제조업_국문)

- PDF fileId: `down-1-18-2.pdf`
- Original filename: `유학생 시간제취업 요건 준수 확인서(제조업_국문).pdf`
- Download (example):
  - `curl -L -e 'https://www.hikorea.go.kr/board/BoardListR.pt?BBS_GB_CD=BS10&BBS_SEQ=41' -G 'https://www.hikorea.go.kr/fileNewExistsChkAjax.pt' --data-urlencode 'spec=pt' --data-urlencode 'dir=info' --data-urlencode 'apndFileNm=down-1-18-2.pdf' --data-urlencode 'oriFileNm=유학생 시간제취업 요건 준수 확인서(제조업_국문).pdf' --data-urlencode 'BBS_GB_CD=BS10' --data-urlencode 'BBS_SEQ=41' -o '유학생 시간제취업 요건 준수 확인서(제조업_국문).pdf'`

### 1.4 Fillable 여부(중요)

- 위 3개 공식 PDF는 **AcroForm(fillable) 기반이 아니라 “정적 양식”**인 것으로 전제한다.
- 따라서 DocGen v1은 **(A) 배경 템플릿 + 좌표(renderSpec) 오버레이** 방식이 기본이며, 추후 fillable 버전 발견 시만 채우기 방식으로 전환한다.

---

## 2) Official Information Sources to Monitor (A/B/C)

### A) HiKorea 공지사항 (공지/절차/서식 업데이트 신호)

- `https://www.hikorea.go.kr/board/BoardNtcListR.pt`
- 권장 점검: 주 1회(성수기에는 더 자주)

### B) 출입국·외국인정책본부 “새소식” (프로그램/정책/집행 변화 신호)

- `https://www.immigration.go.kr/bbs/immigration/47/artclList.do`
- 권장 점검: 주 1회

### C) 출입국·외국인정책본부 “보도자료” (고임팩트 정책 발표 신호)

- `https://www.immigration.go.kr/bbs/immigration/214/artclList.do`
- 권장 점검: 주 1회

### D) data.go.kr (출입국/체류 통계 OpenAPI, 정형 데이터)

- SoT 링크/서비스키/데이터셋은 “확정 후” 여기에 추가한다(서비스키 발급 필요).
- 활용 목적(권장)
  - 월별/분기별 “체류 외국인/출입국” 같은 **정형 통계**를 가져와 리포트/콘텐츠/대시보드의 신뢰 시그널로 사용
  - STEP3 룰셋의 “설명/근거”에 직접 박기보다는, 별도의 `official_stats_snapshots`로 저장해 재사용(캐시/버전)

---

## 3) Visa “전체 커버” 목록 (v1 Registry)

STEP3의 “전체 커버”는 **비자 코드(체류자격 코드) 전부를 registry로 포함**한다는 의미다. (각 비자별 “룰셋 v1”은 순차 구축)

### 유학(Study)

- `D-2` 유학
- `D-4` 일반연수

### 취업/활동(Employment + Work-like)

- `E-1` 교수
- `E-2` 회화지도
- `E-3` 연구
- `E-4` 기술지도
- `E-5` 전문직업
- `E-6` 예술흥행
- `E-7` 특정활동
- `E-8` 계절근로
- `E-9` 비전문취업
- `E-10` 선원취업
- `D-7` 주재
- `D-8` 기업투자
- `D-9` 무역경영
- `H-2` 방문취업

### 거주/정주(Residence)

- `F-2` 거주
- `F-4` 재외동포
- `F-5` 영주
- `F-6` 결혼이민

### 동반/가족(Dependent)

- `F-1` 방문동거(일부 세부유형)
- `F-3` 동반

### 기타(Other)

- `A-1` 외교
- `A-2` 공무
- `A-3` 협정
- `B-1` 무사증
- `B-2` 관광통과
- `C-1` 단기취재
- `C-3` 단기방문
- `C-4` 단기취업
- `D-1` 문화예술
- `D-3` 산업연수
- `D-5` 취재
- `D-6` 종교
- `D-10` 구직
- `G-1` 기타(치료/인도적 등 세부유형)
- `H-1` 관광취업(워킹홀리데이)

---

## 4) Hot Lead 정의(관리자 영업 파이프라인)

### 4.1 Hot Lead 기준

- Hot Lead = **리드 스코어/전환확률 ≥ 80**

### 4.2 득점 이벤트(핵심)

- 비자 평가 실행(assessment run)
- 서류 생성(docgen)
- 상담 문의 CTA 클릭/제출(consult)

### 4.3 Admin 대시보드 기본 컬럼/필터(최소)

- 상태(status): `new | active | hot | converted | follow_up`
- 지역/국적(region/nationality)
- 목표 비자(target visa)
- 리드 점수/확률(score/probability)
- 마지막 활동(last activity)
- (운영용) 최근 생성 문서(docgen history), 최근 평가 결과(assessment)
