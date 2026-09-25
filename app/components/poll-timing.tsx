import { formatKstDateTime, remainingTime, type PollStatus } from "@/lib/poll-rules";

type Timing = { status: PollStatus; deadline: string | null; closedAt: string | null };

// 목록 항목의 시간 표시: 진행 중이면 남은 시간(24시간 미만 강조), 마감이면 마감된 때. 마감 시각 없는 진행 중 투표는 없음
export function ListTiming({ poll, now }: { poll: Timing; now: number }) {
  if (poll.status === "closed" && poll.closedAt) {
    return (
      <span className="text-xs text-muted">{formatKstDateTime(poll.closedAt, { now, weekday: false })} 마감</span>
    );
  }
  if (poll.status === "open" && poll.deadline) {
    const { label, urgent } = remainingTime(poll.deadline, now);
    return <span className={`text-xs ${urgent ? "font-semibold text-accent" : "text-muted"}`}>{label}</span>;
  }
  return null;
}

// 상세 화면의 상태 줄: "진행 중 · 5시간 남음 · 9월 27일(일) 18:00 마감" / "마감 · 9월 27일(일) 18:00 마감됨"
export function DetailTiming({ poll, now }: { poll: Timing; now: number }) {
  if (poll.status === "closed") {
    return <>마감{poll.closedAt && <> · {formatKstDateTime(poll.closedAt, { now })} 마감됨</>}</>;
  }
  if (!poll.deadline) return <>진행 중</>;
  const { label, urgent } = remainingTime(poll.deadline, now);
  return (
    <>
      진행 중 · <span className={urgent ? "font-semibold text-accent" : undefined}>{label}</span> ·{" "}
      {formatKstDateTime(poll.deadline, { now })} 마감
    </>
  );
}
