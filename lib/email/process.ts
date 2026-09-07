import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "./resend";
import { renderTemplate } from "./templates";
import type { EmailTemplate, TicketStatus } from "@/lib/supabase/types";

/**
 * pending 상태의 email_logs를 읽어 실제 발송을 시도하고 상태를 sent/failed로 갱신한다.
 * DB 트랜잭션(티켓 상태 변경 등)과 분리되어 있으므로, 여기서 발생하는 에러는
 * 절대 호출자에게 다시 throw하지 않는다 — 이메일 발송 실패가 티켓 처리를 막으면 안 된다
 * (Concept.md 5.2 핵심 원칙).
 */
export async function processPendingEmailLogs(ticketId?: string): Promise<void> {
  const admin = createAdminClient();

  let query = admin
    .from("email_logs")
    .select("id, ticket_id, to_email, template, retry_count")
    .eq("status", "pending")
    .limit(20);

  if (ticketId) {
    query = query.eq("ticket_id", ticketId);
  }

  const { data: pending, error } = await query;
  if (error || !pending || pending.length === 0) {
    return;
  }

  const ticketIds = [...new Set(pending.map((p) => p.ticket_id).filter(Boolean))] as string[];
  const { data: tickets } = await admin
    .from("tickets")
    .select("id, ticket_no, title, status")
    .in("id", ticketIds);

  const ticketById = new Map((tickets ?? []).map((t) => [t.id, t]));

  for (const log of pending) {
    const ticket = log.ticket_id ? ticketById.get(log.ticket_id) : undefined;
    if (!ticket) {
      await admin
        .from("email_logs")
        .update({ status: "failed", error: "ticket not found" })
        .eq("id", log.id);
      continue;
    }

    try {
      const { subject, html } = renderTemplate(log.template as EmailTemplate, {
        ticketNo: ticket.ticket_no,
        ticketTitle: ticket.title,
        status: ticket.status as TicketStatus,
      });

      await sendEmail({ to: log.to_email, subject, html });

      await admin
        .from("email_logs")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", log.id);
    } catch (err) {
      await admin
        .from("email_logs")
        .update({
          status: "failed",
          error: err instanceof Error ? err.message : "unknown error",
          retry_count: log.retry_count + 1,
        })
        .eq("id", log.id);
    }
  }
}
