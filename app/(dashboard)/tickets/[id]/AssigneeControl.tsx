"use client";

import { useState, useTransition } from "react";
import { assignTicket } from "@/lib/actions/tickets";
import { Select } from "@/components/ui/Input";
import type { Profile } from "@/lib/supabase/types";

export function AssigneeControl({
  ticketId,
  assigneeId,
  agents,
  canEdit,
}: {
  ticketId: string;
  assigneeId: string | null;
  agents: Profile[];
  canEdit: boolean;
}) {
  const [current, setCurrent] = useState(assigneeId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const currentAgent = agents.find((a) => a.id === current);

  if (!canEdit) {
    return (
      <span className="text-sm text-text-primary">
        {currentAgent?.full_name ?? currentAgent?.email ?? "미배정"}
      </span>
    );
  }

  function handleChange(nextId: string) {
    if (!nextId) return;
    setError(null);
    const prev = current;
    setCurrent(nextId);
    startTransition(async () => {
      const result = await assignTicket({ ticketId, assigneeId: nextId });
      if (!result.success) {
        setCurrent(prev);
        setError(result.error ?? "담당자 배정에 실패했습니다");
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={current}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value)}
        className="max-w-[200px]"
      >
        <option value="">미배정</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {agent.full_name ?? agent.email}
          </option>
        ))}
      </Select>
      {error && <p className="text-xs text-status-danger">{error}</p>}
    </div>
  );
}
