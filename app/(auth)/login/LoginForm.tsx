"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { login } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await login({
        email: formData.get("email"),
        password: formData.get("password"),
      });
      if (result && !result.success) {
        setError(result.error ?? "로그인에 실패했습니다");
      }
    });
  }

  return (
    <Card className="w-full max-w-sm">
      <h1 className="mb-1 text-lg font-bold text-text-primary">로그인</h1>
      <p className="mb-6 text-sm text-text-secondary">사내 계정으로 로그인하세요</p>
      <form action={handleSubmit} className="space-y-4">
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
            autoComplete="current-password"
          />
        </div>
        {error && <p className="text-sm text-status-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "로그인 중..." : "로그인"}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-text-secondary">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="text-brand-primary hover:underline">
          회원가입
        </Link>
      </p>
    </Card>
  );
}
