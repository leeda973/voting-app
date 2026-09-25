"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { PollOption } from "@/lib/poll-rules";

export function VoteForm({ pollId, options }: { pollId: string; options: PollOption[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/polls/${pollId}/votes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId: selected }),
      });
      if (response.ok) {
        // 서버에서 화면을 다시 그려 내 표(와 결과)를 보여준다
        router.refresh();
        return;
      }
      const body = await response.json().catch(() => null);
      setError(body?.message ?? "표를 남기지 못했어요. 잠시 후 다시 시도해 주세요.");
      // 마감·삭제·이미 투표함이면 최신 상태로 화면을 바꾼다
      if (response.status === 404 || response.status === 409) router.refresh();
    } catch {
      setError("표를 남기지 못했어요. 네트워크를 확인해 주세요.");
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm text-muted">하나를 골라 주세요. 표는 바꿀 수 없어요.</legend>
        {options.map((option) => (
          <label
            key={option.id}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-4 py-3 has-[:checked]:border-accent has-[:checked]:bg-accent-soft"
          >
            <input
              type="radio"
              name="option"
              value={option.id}
              checked={selected === option.id}
              onChange={() => setSelected(option.id)}
              className="size-4 shrink-0 accent-[var(--accent)]"
            />
            <span className="min-w-0 break-words">{option.label}</span>
          </label>
        ))}
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={!selected || submitting}
        className="rounded-xl bg-accent px-4 py-3 font-semibold text-background disabled:opacity-60"
      >
        {submitting ? "표 남기는 중…" : "투표하기"}
      </button>
    </form>
  );
}
