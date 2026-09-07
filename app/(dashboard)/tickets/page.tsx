import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { searchTicketsSchema } from "@/lib/validations/ticket";
import { SearchFilters } from "@/components/search/SearchFilters";
import { TicketCard } from "@/components/tickets/TicketCard";
import { Button } from "@/components/ui/Button";
import type { Ticket } from "@/lib/supabase/types";

const PAGE_SIZE = 20;

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = searchTicketsSchema.parse(await searchParams);
  const supabase = await createClient();

  const { data: tickets, error } = await supabase.rpc("search_tickets", {
    keyword: params.q && params.q.length >= 2 ? params.q : null,
    p_status: params.status ?? null,
    p_priority: params.priority ?? null,
    p_assignee: params.assignee ?? null,
    p_from: params.from ?? null,
    p_to: params.to ?? null,
    p_limit: PAGE_SIZE,
    p_offset: (params.page - 1) * PAGE_SIZE,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-text-primary">티켓 목록</h1>
        <Link href="/tickets/new">
          <Button>티켓 등록</Button>
        </Link>
      </div>

      <SearchFilters />

      {error && <p className="text-sm text-status-danger">검색 중 오류가 발생했습니다: {error.message}</p>}

      {!error && (!tickets || tickets.length === 0) && (
        <p className="py-12 text-center text-sm text-text-secondary">
          조건에 맞는 티켓이 없습니다. 필터를 해제해 보세요.
        </p>
      )}

      <div className="space-y-2">
        {(tickets as Ticket[] | null)?.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>

      <div className="flex justify-center gap-2 pt-4">
        {params.page > 1 && (
          <PageLink page={params.page - 1} searchParams={params} label="이전" />
        )}
        {tickets && tickets.length === PAGE_SIZE && (
          <PageLink page={params.page + 1} searchParams={params} label="다음" />
        )}
      </div>
    </div>
  );
}

function PageLink({
  page,
  searchParams,
  label,
}: {
  page: number;
  searchParams: Record<string, unknown>;
  label: string;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== "page") params.set(key, String(value));
  }
  params.set("page", String(page));
  return (
    <Link href={`/tickets?${params.toString()}`} className="text-sm text-brand-primary hover:underline">
      {label}
    </Link>
  );
}
