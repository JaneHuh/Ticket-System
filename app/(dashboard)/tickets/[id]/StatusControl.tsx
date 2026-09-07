"use client";

import { useState, useTransition } from "react";
import { updateTicketStatus } from "@/lib/actions/tickets";
import { ALLOWED_STATUS_TRANSITIONS } from "@/lib/validations/ticket";
import { Select } from "@/components/ui/Input";
import type { TicketStatus } from "@/lib/supabase/types";

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "신규 접수",
  in_progress: "처리중",
  on_hold: "보류",
  resolved: "해결 완료",
  closed: "종료",
  reopened: "재오픈",
};

export function StatusControl({
  ticketId,
  status,
  canEdit,
}: {
  ticketId: string;
  status: TicketStatus;
  canEdit: boolean;
}) {
  const [current, setCurrent] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const nextOptions = ALLOWED_STATUS_TRANSITIONS[current];

  if (!canEdit) {
    return <span className="text-sm font-medium text-text-primary">{STATUS_LABEL[current]}</span>;
  }

  function handleChange(next: TicketStatus) {
    setError(null);
    const prev = current;
    setCurrent(next);
    startTransition(async () => {
      const result = await updateTicketStatus({ ticketId, status: next });
      if (!result.success) {
        setCurrent(prev);
        setError(result.error ?? "상태 변경에 실패했습니다");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={current}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value as TicketStatus)}
        className="max-w-[160px]"
      >
        <option value={current}>{STATUS_LABEL[current]} (현재)</option>
        {nextOptions.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </Select>
      {error && <p className="text-xs text-status-danger">{error}</p>}
    </div>
  );
}
