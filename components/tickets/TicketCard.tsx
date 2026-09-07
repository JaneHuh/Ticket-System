import Link from "next/link";
import type { Ticket } from "@/lib/supabase/types";
import { PriorityBar } from "./PriorityBar";
import { StatusBadge } from "./StatusBadge";

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffH = Math.floor(diffMs / 3_600_000);
  if (diffH < 1) return "방금 전";
  if (diffH < 24) return `${diffH}시간 전`;
  return `${Math.floor(diffH / 24)}일 전`;
}

export function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className="flex gap-3 rounded-card border border-border-subtle bg-bg-surface p-4 hover:bg-bg-surface-selected"
    >
      <PriorityBar priority={ticket.priority} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-text-secondary">
            TCK-{String(ticket.ticket_no).padStart(4, "0")}
          </span>
          <span className="text-xs text-text-secondary">{relativeTime(ticket.created_at)}</span>
        </div>
        <p className="mt-1 truncate text-sm font-semibold text-text-primary">{ticket.title}</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-text-secondary">#{ticket.ticket_no}</span>
          <StatusBadge status={ticket.status} />
        </div>
      </div>
    </Link>
  );
}
