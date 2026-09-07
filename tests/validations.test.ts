import { describe, it, expect } from "vitest";
import { createTicketSchema, createCommentSchema } from "@/lib/validations/ticket";
import { loginSchema } from "@/lib/validations/auth";

describe("createTicketSchema", () => {
  it("accepts a valid ticket", () => {
    const result = createTicketSchema.safeParse({
      title: "로그인이 안 됩니다",
      body: "비밀번호를 입력해도 로그인이 되지 않습니다.",
      priority: "high",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const result = createTicketSchema.safeParse({ title: "", body: "내용" });
    expect(result.success).toBe(false);
  });

  it("rejects a title over 200 chars", () => {
    const result = createTicketSchema.safeParse({
      title: "a".repeat(201),
      body: "내용",
    });
    expect(result.success).toBe(false);
  });

  it("defaults priority to normal when omitted", () => {
    const result = createTicketSchema.parse({ title: "제목", body: "내용" });
    expect(result.priority).toBe("normal");
  });
});

describe("createCommentSchema", () => {
  it("defaults isInternal to false", () => {
    const result = createCommentSchema.parse({
      ticketId: "123e4567-e89b-12d3-a456-426614174000",
      body: "댓글 내용",
    });
    expect(result.isInternal).toBe(false);
  });

  it("rejects a non-uuid ticketId", () => {
    const result = createCommentSchema.safeParse({ ticketId: "not-a-uuid", body: "댓글" });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "password123" });
    expect(result.success).toBe(false);
  });

  it("rejects a short password", () => {
    const result = loginSchema.safeParse({ email: "a@b.com", password: "short" });
    expect(result.success).toBe(false);
  });
});
