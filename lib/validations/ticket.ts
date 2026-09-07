import { z } from "zod";

export const ticketStatusEnum = z.enum([
  "open",
  "in_progress",
  "on_hold",
  "resolved",
  "closed",
  "reopened",
]);

export const ticketPriorityEnum = z.enum(["low", "normal", "high", "urgent"]);

export const createTicketSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력하세요").max(200),
  body: z.string().trim().min(1, "내용을 입력하세요").max(10000),
  priority: ticketPriorityEnum.default("normal"),
  teamId: z.string().uuid().nullable().optional(),
});

export type CreateTicketInput = z.infer<typeof createTicketSchema>;

export const updateTicketStatusSchema = z.object({
  ticketId: z.string().uuid(),
  status: ticketStatusEnum,
});

export const assignTicketSchema = z.object({
  ticketId: z.string().uuid(),
  assigneeId: z.string().uuid(),
});

export const createCommentSchema = z.object({
  ticketId: z.string().uuid(),
  body: z.string().trim().min(1, "댓글 내용을 입력하세요").max(5000),
  isInternal: z.boolean().default(false),
});

export const searchTicketsSchema = z.object({
  q: z.string().trim().max(200).optional(),
  status: ticketStatusEnum.optional(),
  priority: ticketPriorityEnum.optional(),
  assignee: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
});

// DB 트리거(enforce_ticket_status_transition)와 동일한 규칙을 UI에서 미리 검증하기 위한 맵.
// 최종 강제는 항상 DB 트리거가 담당하며, 이 맵은 UX(허용되지 않는 버튼 비활성화)용이다.
export const ALLOWED_STATUS_TRANSITIONS: Record<
  z.infer<typeof ticketStatusEnum>,
  z.infer<typeof ticketStatusEnum>[]
> = {
  open: ["in_progress", "on_hold"],
  in_progress: ["on_hold", "resolved"],
  on_hold: ["in_progress"],
  resolved: ["closed", "reopened"],
  closed: ["reopened"],
  reopened: ["in_progress"],
};

export function isValidStatusTransition(
  from: z.infer<typeof ticketStatusEnum>,
  to: z.infer<typeof ticketStatusEnum>,
): boolean {
  if (from === to) return true;
  return ALLOWED_STATUS_TRANSITIONS[from].includes(to);
}
