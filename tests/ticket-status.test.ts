import { describe, it, expect } from "vitest";
import { isValidStatusTransition, ALLOWED_STATUS_TRANSITIONS } from "@/lib/validations/ticket";

describe("isValidStatusTransition", () => {
  it("allows the same status (no-op)", () => {
    expect(isValidStatusTransition("open", "open")).toBe(true);
  });

  it("allows open -> in_progress and open -> on_hold", () => {
    expect(isValidStatusTransition("open", "in_progress")).toBe(true);
    expect(isValidStatusTransition("open", "on_hold")).toBe(true);
  });

  it("rejects open -> resolved (skipping in_progress)", () => {
    expect(isValidStatusTransition("open", "resolved")).toBe(false);
  });

  it("rejects closed -> in_progress directly (must reopen first)", () => {
    expect(isValidStatusTransition("closed", "in_progress")).toBe(false);
  });

  it("allows closed -> reopened and reopened -> in_progress", () => {
    expect(isValidStatusTransition("closed", "reopened")).toBe(true);
    expect(isValidStatusTransition("reopened", "in_progress")).toBe(true);
  });

  it("rejects resolved -> open (no backwards path)", () => {
    expect(isValidStatusTransition("resolved", "open")).toBe(false);
  });

  it("every status has a defined transition list, even if empty", () => {
    const statuses: (keyof typeof ALLOWED_STATUS_TRANSITIONS)[] = [
      "open",
      "in_progress",
      "on_hold",
      "resolved",
      "closed",
      "reopened",
    ];
    for (const status of statuses) {
      expect(Array.isArray(ALLOWED_STATUS_TRANSITIONS[status])).toBe(true);
    }
  });
});
