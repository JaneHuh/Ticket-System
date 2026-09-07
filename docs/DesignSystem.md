# SmartDesk Enterprise — Design System

> 상담사 콘솔형 헬프데스크 UI 분석 기반 디자인 토큰. `tailwind.config.ts`와 `components/`에 반영되어 있다.

## 레이아웃
- 3-panel 워크스페이스: 좌(큐 리스트) / 중(상세·타임라인) / 우(액션·승인). 이 MVP에서는 `/tickets/[id]`가 중앙+우측 2컬럼으로 단순화되어 있다.
- 페이지 배경 `#F8FAFC`, 카드 배경은 항상 흰색. 카드 사이 경계는 여백으로 구분한다.

## 색상 토큰 (`tailwind.config.ts`에 매핑됨)

| 토큰 | Hex | 용도 |
|---|---|---|
| `nav.bg` | `#0F172B` | 헤더, AI/시스템 영역 전용 |
| `brand.primary` | `#155DFC` | 강조, 링크 |
| `bg.page` | `#F8FAFC` | 페이지 배경 |
| `bg.surface` | `#FFFFFF` | 카드 배경 |
| `bg.surface-selected` | `#F4F9FF` | 선택된 리스트 아이템 |
| `border.subtle` | `#E5E9F0` | 카드 테두리 |
| `status.info` | `#2B7FFF` | 신규/정보 |
| `status.warning` | `#FF8904` | 진행중/보통 |
| `status.success` | `#20B388` | 완료/성공 |
| `status.danger` | `#FB2C36` | 긴급/높음 |
| `status.neutral` | `#96A6BD` | 낮음/중립 |
| `dept.tech` / `dept.billing` / `dept.hr` | `#2B7FFF` / `#25C590` / `#B861FF` | 부서(카테고리) 배지 — 우선순위 팔레트와 분리 |
| `text.primary` / `text.secondary` / `text.inverse` | `#0F172B` / `#64748B` / `#FFFFFF` | 본문 / 보조 / 다크 배경 위 텍스트 |

## 타이포그래피
- 사람이 읽는 텍스트: sans-serif (Inter/Pretendard 계열)
- 시스템이 생성한 식별자(티켓 ID, 이메일): monospace (`font-mono`) — 예: `TCK-0001`
- 카드/폼 라벨: 대문자 + wide tracking (`uppercase tracking-wide`), 값은 일반 대소문자

## 컴포넌트 패턴 → 구현 위치

| 패턴 | 구현 |
|---|---|
| Top Navigation (다크 네이비) | `components/layout/TopNav.tsx` |
| Stat Card (KPI) | `components/dashboard/StatCard.tsx` |
| 티켓 큐 아이템 (좌측 우선순위 컬러 바) | `components/tickets/TicketCard.tsx`, `PriorityBar.tsx` |
| 상태 dot + 라벨 | `components/tickets/StatusBadge.tsx` |
| 검색/필터 바 | `components/search/SearchFilters.tsx` |

## 디자인 원칙 요약 (재사용 시 체크리스트)
1. Semantic 컬러는 전역에서 재사용한다 — 빨강=높음/긴급, 주황=진행중/보통, 초록=완료/성공, 파랑=신규/정보, 회색=낮음/중립.
2. 부서(카테고리) 컬러와 우선순위 컬러는 별도 팔레트다. 혼동해서 매핑하지 않는다.
3. 식별자는 monospace, 설명은 sans-serif.
4. 라벨은 대문자 + wide tracking, 값은 일반 대소문자.
5. 카드 배경은 항상 흰색, 페이지 배경은 연회청색(`#F8FAFC`). 진한 테두리를 남발하지 않는다.
6. 강조는 배경색보다 아이콘·텍스트·좌측 바 색상으로 한다.
7. 다크 네이비(`#0F172B`)는 헤더/AI 배너 전용. 일반 콘텐츠 영역에는 사용하지 않는다.

> 스크린샷 픽셀 샘플링 기반 추정치가 일부 포함되어 있다. 실제 Figma/CSS 소스가 생기면 대조해 오차를 보정한다.
