import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processPendingEmailLogs } from "@/lib/email/process";

// 서버 전용 발송 트리거. 관리자만 호출 가능 — 실패/재시도 건을 수동으로 다시 처리할 때 사용한다.
// (평소에는 lib/actions/tickets.ts, lib/actions/comments.ts가 DB 변경 직후 자동으로 호출한다)
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  await processPendingEmailLogs(typeof body.ticketId === "string" ? body.ticketId : undefined);

  return NextResponse.json({ ok: true });
}
