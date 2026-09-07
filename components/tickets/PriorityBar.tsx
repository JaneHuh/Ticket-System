import type { TicketPriority } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

// 우선순위 좌측 컬러 바 (SmartDesk §4.3 리스트 아이템 규칙): 빨강=높음/긴급, 주황=보통, 회색=낮음
const PRIORITY_COLOR: Record<TicketPriority, string> = {
  urgent: "bg-status-danger",
  high: "bg-status-danger",
  normal: "bg-status-warning",
  low: "bg-status-neutral",
};

export function PriorityBar({ priority }: { priority: TicketPriority }) {
  return <span className={cn("w-1 shrink-0 self-stretch rounded-full", PRIORITY_COLOR[priority])} aria-hidden />;
}

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  urgent: "긴급",
  high: "높음",
  normal: "보통",
  low: "낮음",
};

export function PriorityLabel({ priority }: { priority: TicketPriority }) {
  return <span className="text-xs text-text-secondary">{PRIORITY_LABEL[priority]}</span>;
}
