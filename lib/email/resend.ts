import "server-only";
import { Resend } from "resend";

// RESEND_API_KEY는 서버 전용 환경변수. 클라이언트 컴포넌트에서 이 모듈을 import하면 안 된다.
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

const STAGING_TEST_RECIPIENT = process.env.STAGING_TEST_EMAIL;

/**
 * 스테이징(비-production) 환경에서는 실제 수신자에게 메일을 보내지 않는다.
 * 테스트 중 전 직원에게 메일이 나가는 사고를 막기 위한 안전장치 (Concept.md 5.3).
 */
function resolveRecipient(toEmail: string): string {
  if (process.env.NODE_ENV === "production") {
    return toEmail;
  }
  if (!STAGING_TEST_RECIPIENT) {
    throw new Error(
      "비-production 환경에서는 STAGING_TEST_EMAIL 환경변수가 설정되어야 발송할 수 있습니다.",
    );
  }
  return STAGING_TEST_RECIPIENT;
}

/** 메일 헤더/제목에 사용자 입력이 들어갈 때 개행 문자를 제거해 헤더 인젝션을 막는다. */
export function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, " ").trim();
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailInput) {
  const recipient = resolveRecipient(to);
  const client = getResendClient();

  return client.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "notifications@ticket-system.example",
    to: recipient,
    subject: sanitizeHeaderValue(subject),
    html,
  });
}
