"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { PollStatus } from "@/lib/poll-rules";

export function AdminActions({ pollId, status }: { pollId: string; status: PollStatus }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function closePoll() {
    if (!window.confirm("투표를 마감할까요? 마감하면 다시 열 수 없어요.")) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/polls/${pollId}/close`, { method: "POST" });
      if (!response.ok && response.status !== 409) {
        const body = await response.json().catch(() => null);
        setError(body?.message ?? "투표를 마감하지 못했어요.");
      }
      router.refresh();
    } catch {
      setError("투표를 마감하지 못했어요. 네트워크를 확인해 주세요.");
    }
    setBusy(false);
  }

  return (
    <section aria-label="관리자 기능" className="mt-10 flex flex-col gap-3 border-t border-line pt-6">
      <h2 className="text-sm font-semibold text-muted">관리자</h2>
      {status === "open" && (
        <button
          type="button"
          onClick={closePoll}
          disabled={busy}
          className="rounded-xl border border-line px-4 py-3 font-semibold disabled:opacity-60"
        >
          마감하기
        </button>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </section>
  );
}
