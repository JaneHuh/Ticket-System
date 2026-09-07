import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { PriorityLabel } from "@/components/tickets/PriorityBar";
import { StatusControl } from "./StatusControl";
import { AssigneeControl } from "./AssigneeControl";
import { CommentSection } from "./CommentSection";
import type { Profile } from "@/lib/supabase/types";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: ticket } = await supabase.from("tickets").select("*").eq("id", id).single();
  if (!ticket) notFound();

  const [{ data: viewerProfile }, { data: comments }, { data: history }, { data: agents }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("ticket_comments")
        .select("*")
        .eq("ticket_id", id)
        .order("created_at", { ascending: true }),
      supabase
        .from("ticket_history")
        .select("*")
        .eq("ticket_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").in("role", ["agent", "admin"]).order("full_name"),
    ]);

  const authorIds = [...new Set((comments ?? []).map((c) => c.author_id))];
  const { data: authors } =
    authorIds.length > 0
      ? await supabase.from("profiles").select("*").in("id", authorIds)
      : { data: [] as Profile[] };
  const authorsById = Object.fromEntries((authors ?? []).map((a) => [a.id, a]));

  const canManage =
    viewerProfile?.role === "admin" || ticket.assignee_id === user.id || viewerProfile?.role === "agent";
  const isRequester = ticket.requester_id === user.id;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-xs text-text-secondary">
              TCK-{String(ticket.ticket_no).padStart(4, "0")}
            </span>
            <StatusControl ticketId={ticket.id} status={ticket.status} canEdit={canManage} />
          </div>
          <h1 className="text-lg font-bold text-text-primary">{ticket.title}</h1>
          <p className="mt-3 whitespace-pre-wrap text-sm text-text-primary">{ticket.body}</p>
        </Card>

        <Card>
          <CommentSection
            ticketId={ticket.id}
            comments={comments ?? []}
            authorsById={authorsById}
            canPostInternal={canManage && !isRequester}
          />
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            Ticket Info
          </h2>
          <Field label="우선순위">
            <PriorityLabel priority={ticket.priority} />
          </Field>
          <Field label="담당자">
            <AssigneeControl
              ticketId={ticket.id}
              assigneeId={ticket.assignee_id}
              agents={agents ?? []}
              canEdit={viewerProfile?.role === "admin"}
            />
          </Field>
          <Field label="등록일">
            <span className="text-sm text-text-primary">
              {new Date(ticket.created_at).toLocaleDateString("ko-KR")}
            </span>
          </Field>
        </Card>

        <Card className="space-y-3">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            Activity Logs
          </h2>
          {(history ?? []).length === 0 && (
            <p className="text-xs text-text-secondary">변경 이력이 없습니다.</p>
          )}
          {(history ?? []).map((entry) => (
            <div key={entry.id} className="rounded-card bg-bg-page p-2 text-xs text-text-secondary">
              {entry.field} : {entry.old_value ?? "-"} → {entry.new_value ?? "-"}
              <div className="mt-0.5 text-[10px]">
                {new Date(entry.created_at).toLocaleString("ko-KR")}
              </div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
        {label}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}
