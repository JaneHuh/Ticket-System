import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import type { TicketStatus } from "@/lib/supabase/types";

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "신규 접수",
  in_progress: "처리중",
  on_hold: "보류",
  resolved: "해결 완료",
  closed: "종료",
  reopened: "재오픈",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: tickets } = await supabase.from("tickets").select("status");

  const counts: Record<string, number> = {};
  for (const t of tickets ?? []) {
    counts[t.status] = (counts[t.status] ?? 0) + 1;
  }
  const total = tickets?.length ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-text-primary">대시보드</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="전체 티켓 수 (ALL)" value={total} />
        {(Object.keys(STATUS_LABEL) as TicketStatus[]).map((status) => (
          <StatCard key={status} label={STATUS_LABEL[status]} value={counts[status] ?? 0} />
        ))}
      </div>
    </div>
  );
}
