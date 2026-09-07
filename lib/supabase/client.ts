import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

// 브라우저 전용 클라이언트. anon key만 사용 — RLS가 접근 제어의 최종 책임을 진다.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
