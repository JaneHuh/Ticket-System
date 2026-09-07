"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { processPendingEmailLogs } from "@/lib/email/process";
import { createCommentSchema } from "@/lib/validations/ticket";
import type { ActionResult } from "./tickets";

export async function createComment(input: unknown): Promise<ActionResult> {
  const parsed = createCommentSchema.safeParse(input);
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

  const { error } = await supabase.from("ticket_comments").insert({
    ticket_id: parsed.data.ticketId,
    author_id: user.id,
    body: parsed.data.body,
    is_internal: parsed.data.isInternal,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  await processPendingEmailLogs(parsed.data.ticketId).catch(() => {});

  revalidatePath(`/tickets/${parsed.data.ticketId}`);
  return { success: true };
}
