"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { nextRefreshDelay } from "@/lib/poll-rules";

const TICK_MS = 60_000;
const NowContext = createContext<number | null>(null);

// 화면을 열어 둔 동안의 "지금 시각". 처음에는 서버가 상태를 판단한 요청 시각을 쓰고, 1분마다 갱신한다.
// deadlines(화면의 진행 중 투표 마감 시각들) 중 가장 가까운 것이 지나면 화면을 서버에서 다시 그려 마감 상태로 바꾼다.
// 카운트다운은 표시일 뿐이며, 표를 받을지는 항상 서버가 판단한다.
export function LiveNow({
  initialNow,
  deadlines,
  children,
}: {
  initialNow: number;
  deadlines: string[];
  children: ReactNode;
}) {
  const router = useRouter();
  const [now, setNow] = useState(initialNow);
  // 서버가 다시 그려 새 요청 시각을 주면 그 값으로 맞춘다
  const [seenInitialNow, setSeenInitialNow] = useState(initialNow);
  if (seenInitialNow !== initialNow) {
    setSeenInitialNow(initialNow);
    setNow(initialNow);
  }

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(id);
  }, []);

  // 매 분(now가 바뀔 때)마다 다음 마감 전환을 다시 예약한다. 24시간보다 먼 마감은 가까워진 뒤에 예약된다.
  const deadlineKey = deadlines.join(",");
  useEffect(() => {
    const delay = nextRefreshDelay(deadlineKey ? deadlineKey.split(",") : [], Date.now());
    if (delay === null) return;
    const id = setTimeout(() => router.refresh(), delay);
    return () => clearTimeout(id);
  }, [deadlineKey, now, router]);

  return <NowContext.Provider value={now}>{children}</NowContext.Provider>;
}

export function useNow(): number {
  const now = useContext(NowContext);
  if (now === null) throw new Error("useNow는 LiveNow 안에서만 쓸 수 있다");
  return now;
}
