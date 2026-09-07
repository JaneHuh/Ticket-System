"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { processPendingEmailLogs } from "@/lib/email/process";
import {
  createTicketSchema,
  updateTicketStatusSchema,
  assignTicketSchema,
} from "@/lib/validations/ticket";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function createTicket(input: unknown): Promise<ActionResult> {
  const parsed = createTicketSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "로그인이 필요합니다" };
  }

  const { data, error } = await supabase
    .from("tickets")
    .insert({
      title: parsed.data.title,
      body: parsed.data.body,
      priority: parsed.data.priority,
      team_id: parsed.data.teamId ?? null,
      requester_id: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  // 이메일 발송 실패가 티켓 등록을 롤백시키지 않도록 별도로 처리한다.
  await processPendingEmailLogs(data.id).catch(() => {});

  revalidatePath("/tickets");
  return { success: true };
}

export async function updateTicketStatus(input: unknown): Promise<ActionResult> {
  const parsed = updateTicketStatusSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tickets")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.ticketId);

  if (error) {
    // DB 트리거(enforce_ticket_status_transition)가 허용하지 않는 전이를 막는다.
    return { success: false, error: error.message };
  }

  await processPendingEmailLogs(parsed.data.ticketId).catch(() => {});

  revalidatePath(`/tickets/${parsed.data.ticketId}`);
  revalidatePath("/tickets");
  return { success: true };
}

export async function assignTicket(input: unknown): Promise<ActionResult> {
  const parsed = assignTicketSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않습니다" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tickets")
    .update({ assignee_id: parsed.data.assigneeId })
    .eq("id", parsed.data.ticketId);

  if (error) {
    return { success: false, error: error.message };
  }

  await processPendingEmailLogs(parsed.data.ticketId).catch(() => {});

  revalidatePath(`/tickets/${parsed.data.ticketId}`);
  revalidatePath("/tickets");
  return { success: true };
}
