import { createClient } from "@/lib/supabase/server";
import { TicketForm } from "./TicketForm";

export default async function NewTicketPage() {
  const supabase = await createClient();
  const { data: teams } = await supabase.from("teams").select("*").order("name");

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-bold text-text-primary">티켓 등록</h1>
      <TicketForm teams={teams ?? []} />
    </div>
  );
}
