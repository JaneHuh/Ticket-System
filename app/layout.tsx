import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ticket System",
  description: "사내 업무 요청·장애·문의 티켓 관리 시스템",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-bg-page font-sans text-text-primary">{children}</body>
    </html>
  );
}
