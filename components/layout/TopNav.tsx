import Link from "next/link";
import type { Profile } from "@/lib/supabase/types";
import { logout } from "@/lib/actions/auth";

export function TopNav({ profile }: { profile: Profile | null }) {
  return (
    <header className="flex h-14 items-center justify-between bg-nav-bg px-6 text-text-inverse">
      <div className="flex items-center gap-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-badge bg-brand-primary text-xs font-bold">
          TS
        </span>
        <span className="text-base font-bold uppercase tracking-wide">Ticket System</span>
      </div>
      <nav className="flex items-center gap-6 text-sm">
        <Link href="/tickets" className="hover:text-brand-primary">
          티켓
        </Link>
        <Link href="/dashboard" className="hover:text-brand-primary">
          대시보드
        </Link>
        {profile?.role === "admin" && (
          <Link href="/admin/email-logs" className="hover:text-brand-primary">
            발송 이력
          </Link>
        )}
      </nav>
      <div className="flex items-center gap-3 text-sm">
        {profile && (
          <div className="text-right leading-tight">
            <div>{profile.full_name ?? profile.email}</div>
            <div className="text-xs text-white/60">{profile.role}</div>
          </div>
        )}
        <form action={logout}>
          <button type="submit" className="text-xs text-white/70 hover:text-white">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
