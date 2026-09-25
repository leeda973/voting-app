"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({
  className = "rounded-xl border border-line px-4 py-3 text-muted disabled:opacity-60",
}: {
  className?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    setSubmitting(true);
    await fetch("/api/admin/session", { method: "DELETE" }).catch(() => null);
    // 지금 화면을 서버에서 다시 그려 관리자가 아닌 상태로 바꾼다
    router.refresh();
    setSubmitting(false);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={submitting}
      className={className}
    >
      {submitting ? "로그아웃 중…" : "로그아웃"}
    </button>
  );
}
