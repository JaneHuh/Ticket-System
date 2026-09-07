export type UserRole = "requester" | "agent" | "admin";

export type TicketStatus =
  | "open"
  | "in_progress"
  | "on_hold"
  | "resolved"
  | "closed"
  | "reopened";

export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type EmailTemplate =
  | "ticket_created"
  | "ticket_assigned"
  | "status_changed"
  | "comment_added"
  | "ticket_resolved";

// Postgrest 타입(GenericTable)은 Row/Insert/Update가 `Record<string, unknown>`에 할당 가능해야 한다.
// `interface`는 암묵적 인덱스 시그니처가 없어 이 구조적 검사에 실패하므로(→ 전체 스키마가 `never`로
// 붕괴해 모든 `.from()` 호출이 깨짐) 아래는 전부 `type`(객체 타입 별칭)으로 선언한다.
export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  team_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Team = {
  id: string;
  name: string;
  created_at: string;
};

export type Ticket = {
  id: string;
  ticket_no: number;
  title: string;
  body: string;
  status: TicketStatus;
  priority: TicketPriority;
  requester_id: string;
  assignee_id: string | null;
  team_id: string | null;
  due_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TicketComment = {
  id: string;
  ticket_id: string;
  author_id: string;
  body: string;
  is_internal: boolean;
  created_at: string;
};

export type TicketAttachment = {
  id: string;
  ticket_id: string;
  uploader_id: string;
  storage_path: string;
  file_name: string;
  file_size: number;
  content_type: string;
  created_at: string;
};

export type TicketHistoryEntry = {
  id: string;
  ticket_id: string;
  actor_id: string | null;
  field: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  ticket_id: string | null;
  title: string;
  body: string | null;
  read_at: string | null;
  created_at: string;
};

export type EmailLog = {
  id: string;
  ticket_id: string | null;
  to_email: string;
  template: EmailTemplate;
  status: "pending" | "sent" | "failed";
  error: string | null;
  retry_count: number;
  sent_at: string | null;
  created_at: string;
};

// @supabase/postgrest-js는 각 테이블이 Row/Insert/Update/Relationships를 모두 갖추고,
// 스키마가 Tables/Views/Functions를 모두 갖춘 GenericSchema 형태일 것을 요구한다.
// (Supabase CLI의 `supabase gen types`가 생성하는 형태와 동일한 구조 — 하나라도 빠지면
// 타입 추론이 `never`로 무너져 모든 `.from()` 호출이 깨진다.)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      teams: { Row: Team; Insert: Partial<Team>; Update: Partial<Team>; Relationships: [] };
      tickets: {
        Row: Ticket;
        Insert: Partial<Ticket>;
        Update: Partial<Ticket>;
        Relationships: [];
      };
      ticket_comments: {
        Row: TicketComment;
        Insert: Partial<TicketComment>;
        Update: Partial<TicketComment>;
        Relationships: [];
      };
      ticket_attachments: {
        Row: TicketAttachment;
        Insert: Partial<TicketAttachment>;
        Update: Partial<TicketAttachment>;
        Relationships: [];
      };
      ticket_history: {
        Row: TicketHistoryEntry;
        Insert: Partial<TicketHistoryEntry>;
        Update: Partial<TicketHistoryEntry>;
        Relationships: [];
      };
      notifications: {
        Row: NotificationRow;
        Insert: Partial<NotificationRow>;
        Update: Partial<NotificationRow>;
        Relationships: [];
      };
      email_logs: {
        Row: EmailLog;
        Insert: Partial<EmailLog>;
        Update: Partial<EmailLog>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      search_tickets: {
        Args: {
          keyword?: string | null;
          p_status?: TicketStatus | null;
          p_priority?: TicketPriority | null;
          p_assignee?: string | null;
          p_from?: string | null;
          p_to?: string | null;
          p_limit?: number | null;
          p_offset?: number | null;
        };
        Returns: Ticket[];
      };
    };
    Enums: {
      user_role: UserRole;
      ticket_status: TicketStatus;
      ticket_priority: TicketPriority;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
