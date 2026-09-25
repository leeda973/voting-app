"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Result } from "@/lib/poll-rules";

const REFRESH_INTERVAL_MS = 5000;

export function ResultView({ result: initialResult }: { result: Result }) {
  const router = useRouter();
  const [result, setResult] = useState(initialResult);
  const isOpen = result.status === "open";

  // 진행 중인 투표만 5초마다 결과를 다시 불러온다.
  // 이전 요청이 끝난 뒤 다음 요청을 예약하므로 요청이 겹치거나 쌓이지 않는다.
  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;

    async function refresh() {
      try {
        const response = await fetch(`/api/polls/${result.pollId}/result`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (response.ok) {
          const next: Result = await response.json();
          setResult(next);
          if (next.status !== "open") {
            // 마감되면 갱신을 멈추고, 화면 전체(상태 표시, 관리자 버튼)를 서버에서 다시 그린다
            router.refresh();
            return;
          }
        }
      } catch {
        // 네트워크 오류나 화면 이탈(abort)은 마지막 결과를 그대로 둔다
      }
      if (!controller.signal.aborted) timer = setTimeout(refresh, REFRESH_INTERVAL_MS);
    }

    timer = setTimeout(refresh, REFRESH_INTERVAL_MS);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [isOpen, result.pollId, router]);

  return (
    <section aria-label="결과" className="mt-6">
      <p className="text-sm text-muted" aria-live="polite">
        {isOpen ? `총 ${result.totalVotes}표 · 5초마다 갱신` : `마감된 투표의 최종 결과예요 · 총 ${result.totalVotes}표`}
      </p>
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
