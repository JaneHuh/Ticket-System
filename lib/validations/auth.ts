import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("올바른 이메일 주소를 입력하세요"),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다"),
});

export const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(1, "이름을 입력하세요").max(100),
});
