# ToDo — Vibe Coding 티켓 시스템

> `docs/Concept.md` 기준. 이 파일은 원본 계획표이며, 완료 표시는 이번 MVP 스캐폴딩 기준이다.
> 아직 사람이 직접 해야 할 항목(Supabase 프로젝트 생성, 실제 배포, RLS 수동 테스트 등)은 미체크로 남겨둔다.

## Phase 0 — 준비
- [x] Next.js + TypeScript + Tailwind + Supabase 클라이언트 스캐폴딩
- [ ] GitHub 레포 브랜치 전략 확정 (`main` / `develop` / `feature/*`) — 저장소 운영자가 결정
- [ ] Supabase 프로젝트 2개 생성: staging, production (클라우드 콘솔 작업 필요)
- [ ] `.env.local` 값 채우기 (`.env.example` 참고)
- [x] `.gitignore`에 `.env*` 포함
- [x] `CLAUDE.md` 규칙 파일 작성
- [x] ESLint + TypeScript strict 모드 확정

## Phase 1 — 요구사항 · 화면 정의
- [x] 화면 목록 확정 (`docs/requirements.md`)
- [x] 역할 접근표 작성 (requester / agent / admin)
- [x] 이메일 템플릿 5종 문안 확정

## Phase 2 — 데이터 모델 & 보안
- [x] 마이그레이션 작성: profiles, teams, tickets, ticket_comments, ticket_attachments, ticket_history, notifications, email_logs
- [x] 상태 전이 DB 트리거로 강제
- [x] 테이블마다 RLS 활성화 + 정책 작성
- [x] `profiles.role` 자기 수정 방지 트리거
- [ ] 로컬 `supabase db reset`으로 재현성 확인 (Supabase CLI + Docker 필요 — 이 환경에서 미실행)
- [ ] RLS 테스트: requester/agent/admin 3계정으로 CRUD 직접 시도 (사람이 로컬/스테이징에서 수행, `tests/rls-manual-checklist.md` 참고)
- [ ] (사람이 직접) 마이그레이션·정책 SQL 한 줄씩 리뷰

## Phase 3 — 인증
- [x] Supabase Auth 이메일 로그인/회원가입 연동
- [x] `proxy.ts`(Next.js 16의 middleware 대체 컨벤션) 세션 검증, 미인증 시 `/login` 리다이렉트
- [x] 회원가입 시 `profiles` 자동 생성 트리거, 기본 role `requester`

## Phase 4 — 핵심 기능
- [x] 목록 조회 (상태/우선순위 필터, 페이지네이션, `created_at desc`)
- [x] 상세 조회
- [x] 등록 (Server Action + Zod)
- [x] 상태 변경 → `ticket_history` 자동 기록(트리거)
- [x] 담당자 배정
- [x] 댓글 (내부 메모 플래그 포함)

## Phase 5 — 검색 (R2)
- [x] `pg_trgm` + `search_vector` + GIN 인덱스
- [x] `search_tickets` 함수 (`security invoker` 확인됨)
- [x] 검색 UI: 쿼리스트링 + 디바운스
- [ ] 더미 데이터 2,000건으로 응답 속도 확인 (로컬 Supabase 필요, `supabase/seed.sql` 참고)

## Phase 6 — 이메일 발송 (R3)
- [ ] Resend 계정 생성, SPF/DKIM 인증 (외부 서비스 설정 필요)
- [x] `email_logs` 테이블 + RLS(관리자 전용)
- [x] 템플릿 5종 구현 (링크만 포함)
- [x] 스테이징 발송 차단 로직
- [x] 실패 기록 + 관리자 조회 화면 (`/admin/email-logs`)

## Phase 7 — 부가 기능
- [x] Storage 첨부파일 메타 테이블 + RLS (Storage 버킷 정책은 Supabase 콘솔에서 별도 설정 필요)
- [x] 인앱 알림 테이블 + RLS
- [x] 상태별 집계 대시보드
- [x] ~~실시간 채팅~~ — R4에 따라 구현하지 않음

## Phase 8 — 테스트
- [x] 단위 테스트: 상태 전이 로직, 유효성 검증 (Vitest)
- [ ] 통합 테스트: 서버 액션 + 테스트 DB (로컬 Supabase 필요)
- [ ] 권한 테스트: RLS 정책 + 검색 함수 우회 여부 (사람이 케이스 설계 + 로컬/스테이징 실행)
- [ ] 검색 테스트: 한글 키워드·부분 일치 (로컬 Supabase 필요)
- [ ] 이메일 테스트: Resend 테스트 모드
- [ ] E2E: 등록 → 배정 → 완료 (Playwright 스켈레톤만 작성됨)

## Phase 9 — 배포
- [ ] Vercel 프로젝트 연결, Preview/Staging/Production 환경변수 설정
- [ ] 마이그레이션 적용 순서 확인
- [ ] 롤백 절차 문서화

## Phase 10 — 운영 · 유지보수
- [ ] 월 1회 의존성 점검
- [ ] Supabase 로그·에러 모니터링, `email_logs` 실패 건 점검
