"use client";

import { useState, useTransition } from "react";
import { createComment } from "@/lib/actions/comments";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import type { TicketComment, Profile } from "@/lib/supabase/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ko-KR");
}

export function CommentSection({
  ticketId,
  comments,
  authorsById,
  canPostInternal,
}: {
  ticketId: string;
  comments: TicketComment[];
  authorsById: Record<string, Profile>;
  canPostInternal: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createComment({
        ticketId,
        body: formData.get("body"),
        isInternal: formData.get("isInternal") === "on",
      });
      if (!result.success) {
        setError(result.error ?? "댓글 등록에 실패했습니다");
      }
    });
  }

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-bold uppercase tracking-wide text-text-secondary">
        Activity Thread
      </h2>
      <div className="space-y-3">
        {comments.length === 0 && (
          <p className="text-sm text-text-secondary">아직 댓글이 없습니다.</p>
        )}
        {comments.map((comment) => {
          const author = authorsById[comment.author_id];
          return (
            <div
              key={comment.id}
              className="rounded-card border border-border-subtle bg-bg-surface p-3 text-sm"
            >
              <div className="mb-1 flex items-center justify-between text-xs text-text-secondary">
                <span className="font-medium text-text-primary">
                  {author?.full_name ?? author?.email ?? "알 수 없음"}
                  {comment.is_internal && (
                    <span className="ml-2 rounded-badge bg-nav-bg px-1.5 py-0.5 text-[10px] text-white">
                      내부 메모
                    </span>
                  )}
                </span>
                <span>{formatDate(comment.created_at)}</span>
              </div>
              <p className="whitespace-pre-wrap text-text-primary">{comment.body}</p>
            </div>
          );
        })}
      </div>

      <form action={handleSubmit} className="space-y-2">
        <Textarea name="body" rows={3} placeholder="댓글을 입력하세요" required maxLength={5000} />
        <div className="flex items-center justify-between">
          {canPostInternal ? (
            <label className="flex items-center gap-2 text-xs text-text-secondary">
              <input type="checkbox" name="isInternal" />
              내부 메모 (요청자에게 노출되지 않음)
            </label>
          ) : (
            <span />
          )}
          <Button type="submit" disabled={isPending}>
            {isPending ? "등록 중..." : "댓글 등록"}
          </Button>
        </div>
        {error && <p className="text-xs text-status-danger">{error}</p>}
      </form>
    </div>
  );
}
