import type { EmailTemplate, TicketStatus } from "@/lib/supabase/types";
import { renderEmailLayout } from "./shared";

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "신규 접수",
  in_progress: "처리중",
  on_hold: "보류",
  resolved: "해결 완료",
  closed: "종료",
  reopened: "재오픈",
};

export interface TemplateContext {
  ticketNo: number;
  ticketTitle: string;
  status?: TicketStatus;
}

const TEMPLATES: Record<EmailTemplate, (ctx: TemplateContext) => { subject: string; html: string }> = {
  ticket_created: (ctx) => ({
    subject: `[티켓 #${ctx.ticketNo}] 새 요청이 접수되었습니다`,
    html: renderEmailLayout({
      heading: "새 요청이 접수되었습니다",
      ticketNo: ctx.ticketNo,
      ticketTitle: ctx.ticketTitle,
      message: "담당 팀이 확인 후 처리를 시작합니다.",
    }),
  }),
  ticket_assigned: (ctx) => ({
    subject: `[티켓 #${ctx.ticketNo}] 담당자로 지정되었습니다`,
    html: renderEmailLayout({
      heading: "담당자로 지정되었습니다",
      ticketNo: ctx.ticketNo,
      ticketTitle: ctx.ticketTitle,
      message: "티켓을 확인하고 처리를 시작해 주세요.",
    }),
  }),
  status_changed: (ctx) => ({
    subject: `[티켓 #${ctx.ticketNo}] 처리 상태가 '${STATUS_LABEL[ctx.status ?? "in_progress"]}'(으)로 변경되었습니다`,
    html: renderEmailLayout({
      heading: "처리 상태가 변경되었습니다",
      ticketNo: ctx.ticketNo,
      ticketTitle: ctx.ticketTitle,
      message: `현재 상태: ${STATUS_LABEL[ctx.status ?? "in_progress"]}`,
    }),
  }),
  comment_added: (ctx) => ({
    subject: `[티켓 #${ctx.ticketNo}] 새 댓글이 등록되었습니다`,
    html: renderEmailLayout({
      heading: "새 댓글이 등록되었습니다",
      ticketNo: ctx.ticketNo,
      ticketTitle: ctx.ticketTitle,
      message: "내용을 확인하고 필요 시 답변해 주세요.",
    }),
  }),
  ticket_resolved: (ctx) => ({
    subject: `[티켓 #${ctx.ticketNo}] 처리가 완료되었습니다`,
    html: renderEmailLayout({
      heading: "처리가 완료되었습니다",
      ticketNo: ctx.ticketNo,
      ticketTitle: ctx.ticketTitle,
      message: "문제가 해결되지 않았다면 티켓을 재오픈할 수 있습니다.",
    }),
  }),
};

export function renderTemplate(template: EmailTemplate, ctx: TemplateContext) {
  return TEMPLATES[template](ctx);
}
