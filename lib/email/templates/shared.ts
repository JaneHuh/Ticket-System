import { sanitizeHeaderValue } from "../resend";

export function ticketUrl(ticketNo: number): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${base}/tickets/${ticketNo}`;
}

/**
 * 메일 본문 공용 레이아웃. 티켓 제목/상태/링크만 담고 본문 전체는 넣지 않는다
 * (Concept.md 5.3 — 메일함은 접근 통제 밖이므로 상세는 로그인 후 확인).
 */
export function renderEmailLayout(opts: {
  heading: string;
  ticketNo: number;
  ticketTitle: string;
  message: string;
}): string {
  const heading = sanitizeHeaderValue(opts.heading);
  const ticketTitle = sanitizeHeaderValue(opts.ticketTitle);
  const url = ticketUrl(opts.ticketNo);

  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#0F172B;">${heading}</h2>
      <p style="color:#64748B;">티켓 #${opts.ticketNo} · ${ticketTitle}</p>
      <p style="color:#0F172B;">${opts.message}</p>
      <a href="${url}" style="display:inline-block;margin-top:16px;padding:10px 16px;background:#155DFC;color:#fff;text-decoration:none;border-radius:6px;">
        티켓 확인하기
      </a>
    </div>
  `;
}
