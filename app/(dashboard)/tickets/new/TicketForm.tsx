"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTicket } from "@/lib/actions/tickets";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, Textarea } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import type { Team } from "@/lib/supabase/types";

export function TicketForm({ teams }: { teams: Team[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const teamId = formData.get("teamId");
      const result = await createTicket({
        title: formData.get("title"),
        body: formData.get("body"),
        priority: formData.get("priority"),
        teamId: teamId ? teamId : null,
      });
      if (!result.success) {
        setError(result.error ?? "등록에 실패했습니다");
        return;
      }
      router.push("/tickets");
    });
  }

  return (
    <Card className="max-w-2xl">
      <form action={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="title">제목</Label>
          <Input id="title" name="title" required maxLength={200} />
        </div>
        <div>
          <Label htmlFor="body">내용</Label>
          <Textarea id="body" name="body" required rows={8} maxLength={10000} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priority">우선순위</Label>
            <Select id="priority" name="priority" defaultValue="normal">
              <option value="low">낮음</option>
              <option value="normal">보통</option>
              <option value="high">높음</option>
              <option value="urgent">긴급</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="teamId">담당 팀</Label>
            <Select id="teamId" name="teamId" defaultValue="">
              <option value="">미지정</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
        {error && <p className="text-sm text-status-danger">{error}</p>}
        <Button type="submit" disabled={isPending}>
          {isPending ? "등록 중..." : "티켓 등록"}
        </Button>
      </form>
    </Card>
  );
}
