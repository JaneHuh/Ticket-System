import { test, expect } from "@playwright/test";

// 시나리오: 등록 → 배정 → 완료 (Concept.md Phase 8 E2E 항목)
// 실행 전제: 앱이 실행 중이고, 아래 계정이 로컬/스테이징 Supabase에 시드되어 있어야 한다.
// (CI에 연결하기 전까지는 스켈레톤으로 두고, 로컬 Supabase 준비 후 계정 정보를 채워 사용한다.)

const REQUESTER = { email: process.env.E2E_REQUESTER_EMAIL ?? "", password: process.env.E2E_REQUESTER_PASSWORD ?? "" };

test.skip(!REQUESTER.email, "E2E_REQUESTER_EMAIL/PASSWORD 환경변수가 없어 스킵합니다");

test("requester는 티켓을 등록하고 목록에서 확인할 수 있다", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("이메일").fill(REQUESTER.email);
  await page.getByLabel("비밀번호").fill(REQUESTER.password);
  await page.getByRole("button", { name: "로그인" }).click();

  await page.waitForURL("/tickets");
  await page.getByRole("link", { name: "티켓 등록" }).click();

  const title = `E2E 테스트 티켓 ${Date.now()}`;
  await page.getByLabel("제목").fill(title);
  await page.getByLabel("내용").fill("Playwright E2E 테스트로 생성된 티켓입니다.");
  await page.getByRole("button", { name: "티켓 등록" }).click();

  await page.waitForURL("/tickets");
  await expect(page.getByText(title)).toBeVisible();
});
