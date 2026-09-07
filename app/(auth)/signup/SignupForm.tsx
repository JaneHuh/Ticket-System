"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { signup } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signup({
        fullName: formData.get("fullName"),
        email: formData.get("email"),
        password: formData.get("password"),
      });
      if (result && !result.success) {
        setError(result.error ?? "회원가입에 실패했습니다");
      }
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <h1 className="mb-1 text-lg font-bold text-text-primary">회원가입</h1>
      <p className="mb-6 text-sm text-text-secondary">
        신규 계정은 기본적으로 요청자(requester) 권한으로 생성됩니다
      </p>
      <form action={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="fullName">이름</Label>
          <Input id="fullName" name="fullName" required />
        </div>
        <div>
          <Label htmlFor="email">이메일</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div>
          <Label htmlFor="password">비밀번호</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
          />
        </div>
        {error && <p className="text-sm text-status-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "가입 중..." : "회원가입"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-text-secondary">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="text-brand-primary hover:underline">
          로그인
        </Link>
      </p>
    </Card>
  );
}
