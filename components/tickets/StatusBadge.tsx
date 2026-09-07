import type { TicketStatus } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "신규 접수",
  in_progress: "처리중",
  on_hold: "보류",
  resolved: "해결 완료",
  closed: "종료",
  reopened: "재오픈",
};

// Semantic 컬러 매핑: 빨강=긴급, 주황=진행중, 초록=완료, 파랑=신규, 회색=중립 (SmartDesk §7 원칙 1)
const STATUS_DOT: Record<TicketStatus, string> = {
  open: "bg-status-info",
  in_progress: "bg-status-warning",
  on_hold: "bg-status-muted",
  resolved: "bg-status-success",
  closed: "bg-status-neutral",
  reopened: "bg-status-danger",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-primary">
      <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[status])} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}
