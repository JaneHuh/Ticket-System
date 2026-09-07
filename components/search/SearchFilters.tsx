"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition, useEffect, useRef } from "react";
import { Input, Select } from "@/components/ui/Input";

const STATUS_OPTIONS = [
  { value: "", label: "전체 상태" },
  { value: "open", label: "신규 접수" },
  { value: "in_progress", label: "처리중" },
  { value: "on_hold", label: "보류" },
  { value: "resolved", label: "해결 완료" },
  { value: "closed", label: "종료" },
  { value: "reopened", label: "재오픈" },
];

const PRIORITY_OPTIONS = [
  { value: "", label: "전체 우선순위" },
  { value: "urgent", label: "긴급" },
  { value: "high", label: "높음" },
  { value: "normal", label: "보통" },
  { value: "low", label: "낮음" },
];

const DEBOUNCE_MS = 300;
const MIN_KEYWORD_LENGTH = 2;

export function SearchFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (q.length === 0 || q.length >= MIN_KEYWORD_LENGTH) {
        updateParam("q", q);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Input
        className="max-w-xs"
        placeholder="제목·내용 검색 (2글자 이상)"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <Select
        className="max-w-[160px]"
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
      <Select
        className="max-w-[160px]"
        defaultValue={searchParams.get("priority") ?? ""}
        onChange={(e) => updateParam("priority", e.target.value)}
      >
        {PRIORITY_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
