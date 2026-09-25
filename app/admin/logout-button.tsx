"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    setSubmitting(true);
    await fetch("/api/admin/session", { method: "DELETE" }).catch(() => null);
    // 같은 /admin 화면을 서버에서 다시 그려 관리자 비밀번호 폼으로 바꾼다
    router.refresh();
    setSubmitting(false);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={submitting}
      className="rounded-xl border border-line px-4 py-3 text-muted disabled:opacity-60"
    >
      {submitting ? "로그아웃 중…" : "로그아웃"}
    </button>
  );
}
