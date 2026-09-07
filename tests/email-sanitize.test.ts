import { describe, it, expect } from "vitest";
import { sanitizeHeaderValue } from "@/lib/email/resend";

describe("sanitizeHeaderValue", () => {
  it("strips newlines to prevent header injection", () => {
    const malicious = "정상 제목\r\nBcc: attacker@example.com";
    expect(sanitizeHeaderValue(malicious)).not.toContain("\r");
    expect(sanitizeHeaderValue(malicious)).not.toContain("\n");
  });

  it("trims surrounding whitespace", () => {
    expect(sanitizeHeaderValue("  제목  ")).toBe("제목");
  });
});
