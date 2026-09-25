"use client";

import { useState } from "react";
import {
  DEADLINE_MAX_MS,
  DEADLINE_MIN_MS,
  formatKstDateTime,
  parseKstInput,
  toKstInputValue,
} from "@/lib/poll-rules";

const DAY_MS = 24 * 60 * 60 * 1000;
const QUICK_DAYS = [1, 3, 7];

// 입력 가능 범위(한국 시간). 최솟값은 분 단위로 올려 "10분 뒤 이후"를 지킨다
function bounds(now: number) {
  return { min: toKstInputValue(now + DEADLINE_MIN_MS + 59_999), max: toKstInputValue(now + DEADLINE_MAX_MS) };
}

// 마감 시각 입력. value는 한국 시간 "YYYY-MM-DDTHH:mm", enabled가 꺼져 있으면 마감 시각 없음이다.
export function DeadlineField({
  enabled,
  value,
  error,
  onChange,
}: {
  enabled: boolean;
  value: string;
  error?: string;
  onChange: (next: { enabled: boolean; value: string }) => void;
}) {
  // 현재 시각은 렌더 중이 아니라 스위치를 켜거나 버튼을 누르는 이벤트에서 읽어 넘긴다
  const [range, setRange] = useState<{ min: string; max: string } | null>(null);
  const preview = enabled && value ? parseKstInput(value) : null;

  function toggle(on: boolean, now: number) {
    setRange(on ? bounds(now) : null);
    onChange({ enabled: on, value: on ? value : "" });
  }

  function fillDaysLater(days: number, now: number) {
    setRange(bounds(now));
    onChange({ enabled: true, value: toKstInputValue(now + days * DAY_MS) });
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">마감 시각</legend>
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
        <span className="text-sm font-medium">마감 시각 정하기</span>
        <input
          type="checkbox"
          role="switch"
          checked={enabled}
          onChange={(e) => toggle(e.target.checked, Date.now())}
          className="size-5 accent-[var(--accent)]"
        />
      </label>
      <p className="text-sm text-muted">
        마감 시각은 나중에 바꿀 수 없어요. 정하지 않으면 관리자가 마감할 때까지 열려 있어요.
      </p>

      {enabled && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {QUICK_DAYS.map((days) => (
              <button
                key={days}
                type="button"
                onClick={() => fillDaysLater(days, Date.now())}
                className="flex-1 rounded-xl border border-line px-3 py-2 text-sm"
              >
                {days}일 뒤
              </button>
            ))}
          </div>
          <label htmlFor="deadline" className="text-sm font-medium">
            마감 시각 (한국 시간)
          </label>
          <input
            id="deadline"
            type="datetime-local"
            step={60}
            value={value}
            min={range?.min}
            max={range?.max}
            onChange={(e) => onChange({ enabled: true, value: e.target.value })}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "deadline-error" : undefined}
            className="min-w-0 rounded-xl border border-line bg-background px-4 py-3 text-base"
          />
          {preview !== null && (
            <p className="text-sm text-muted">{formatKstDateTime(new Date(preview).toISOString())}에 마감돼요.</p>
          )}
          {error && (
            <p id="deadline-error" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}
