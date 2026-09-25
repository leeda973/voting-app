"use client";

import { formatKstDateTime, remainingTime, type EffectivePollState } from "@/lib/poll-rules";
import { useNow } from "./live-now";

// 투표의 status·closedAt·deadline(실제 상태). 지금 시각은 LiveNow가 준다(처음에는 서버가 상태를 판단한 요청 시각).
type Timing = EffectivePollState;

const urgentClass = (urgent: boolean) => (urgent ? "font-semibold text-accent" : undefined);

// 목록 항목의 시간 표시: 진행 중이면 남은 시간(24시간 미만 강조), 마감이면 마감된 때.
// 마감 시각이 없는 진행 중 투표에는 아무것도 표시하지 않는다.
export function ListTiming({ poll }: { poll: Timing }) {
  const now = useNow();
  if (poll.status === "closed" && poll.closedAt) {
    return (
      <span className="text-xs text-muted">{formatKstDateTime(poll.closedAt, { now, weekday: false })} 마감</span>
    );
  }
  if (poll.status === "open" && poll.deadline) {
    const { label, urgent } = remainingTime(poll.deadline, now);
    return <span className={`text-xs ${urgentClass(urgent) ?? "text-muted"}`}>{label}</span>;
  }
  return null;
}

// 상세 화면의 상태 줄: "진행 중 · 5시간 남음 · 9월 27일(일) 18:00 마감" / "마감 · 9월 27일(일) 18:00 마감됨"(마감된 때)
export function DetailTiming({ poll }: { poll: Timing }) {
  const now = useNow();
  if (poll.status === "closed") {
    return <>마감{poll.closedAt && <> · {formatKstDateTime(poll.closedAt, { now })} 마감됨</>}</>;
  }
  if (!poll.deadline) return <>진행 중</>;
  const { label, urgent } = remainingTime(poll.deadline, now);
  return (
    <>
      진행 중 · <span className={urgentClass(urgent)}>{label}</span> ·{" "}
      {formatKstDateTime(poll.deadline, { now })} 마감
    </>
  );
}
