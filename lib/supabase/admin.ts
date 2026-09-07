import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// SERVICE_ROLE_KEY는 RLS를 우회한다. 이 파일은 서버 전용이며 절대 클라이언트 번들에 포함되면 안 된다.
// 사용처: 이메일 발송 Route Handler(email_logs 갱신), 관리자 배치 작업.
// 새 사용처를 추가할 때는 PR에서 별도 승인 대상으로 취급한다 (Concept.md 2.2 보안 경계선 참조).
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
