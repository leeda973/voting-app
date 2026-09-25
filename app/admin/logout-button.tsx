"use client";

import { useState } from "react";

export function LogoutButton() {
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    setSubmitting(true);
    await fetch("/api/admin/session", { method: "DELETE" }).catch(() => null);
    window.location.assign("/admin");
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
