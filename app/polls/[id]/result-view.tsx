"use client";

import type { Result } from "@/lib/poll-rules";

export function ResultView({ result }: { result: Result }) {
  return (
    <section aria-label="결과" className="mt-6">
      <p className="text-sm text-muted">총 {result.totalVotes}표</p>
      <ul className="mt-2 flex flex-col gap-2">
        {result.options.map((option) => {
          const mine = option.id === result.myOptionId;
          return (
            <li
              key={option.id}
              className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                mine ? "border-accent bg-accent-soft" : "border-line"
              }`}
            >
              <span className="min-w-0 break-words">
                {option.label}
                {mine && <span className="ml-2 text-xs font-semibold text-accent">내 선택</span>}
              </span>
              <span className="shrink-0 tabular-nums">
                <span className="font-semibold">{option.votes}표</span>
                <span className="ml-2 text-muted">{option.percent}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
