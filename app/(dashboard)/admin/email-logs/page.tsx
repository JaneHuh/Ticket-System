import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";

const STATUS_COLOR: Record<string, string> = {
  sent: "text-status-success",
  failed: "text-status-danger",
  pending: "text-status-warning",
};

export default async function EmailLogsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    redirect("/tickets");
  }

  // RLS(email_logs_admin_select)가 admin 외 접근을 이미 차단하지만, UI에서도 명시적으로 확인한다.
  const { data: logs, error } = await supabase
    .from("email_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-text-primary">이메일 발송 이력</h1>
      {error && <p className="text-sm text-status-danger">{error.message}</p>}
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-border-subtle text-left text-[11px] uppercase tracking-wide text-text-secondary">
            <tr>
              <th className="p-3">수신자</th>
              <th className="p-3">템플릿</th>
              <th className="p-3">상태</th>
              <th className="p-3">재시도</th>
              <th className="p-3">발송 시각</th>
              <th className="p-3">오류</th>
            </tr>
          </thead>
          <tbody>
            {(logs ?? []).map((log) => (
              <tr key={log.id} className="border-b border-border-subtle last:border-0">
                <td className="p-3 font-mono text-xs">{log.to_email}</td>
                <td className="p-3">{log.template}</td>
                <td className={`p-3 font-medium ${STATUS_COLOR[log.status] ?? ""}`}>{log.status}</td>
                <td className="p-3">{log.retry_count}</td>
                <td className="p-3 text-xs text-text-secondary">
                  {log.sent_at ? new Date(log.sent_at).toLocaleString("ko-KR") : "-"}
                </td>
                <td className="p-3 text-xs text-status-danger">{log.error ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
