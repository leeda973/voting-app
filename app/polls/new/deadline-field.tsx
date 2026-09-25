"use client";

import { useRef, useState } from "react";
import {
  DAY_MS,
  DEADLINE_MAX_MS,
  DEADLINE_MIN_MS,
  formatKstDateTime,
  parseKstInput,
  toKstInputValue,
} from "@/lib/poll-rules";

const QUICK_DAYS = [1, 3, 7];

// 입력 가능 범위(한국 시간). 최솟값은 분 단위로 올려 "10분 뒤 이후"를 지킨다
function bounds(now: number) {
  return { min: toKstInputValue(now + DEADLINE_MIN_MS + 59_999), max: toKstInputValue(now + DEADLINE_MAX_MS) };
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
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
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = enabled && value ? parseKstInput(value) : null;

  function toggle(on: boolean, now: number) {
    setRange(on ? bounds(now) : null);
    onChange({ enabled: on, value: on ? value : "" });
  }

  function fillDaysLater(days: number, now: number) {
    setRange(bounds(now));
    onChange({ enabled: true, value: toKstInputValue(now + days * DAY_MS) });
  }

  // 달력 아이콘을 누르면 브라우저의 날짜·시간 선택기를 연다. 지원하지 않는 브라우저에서는 입력칸에 포커스만 준다
  function openPicker(now: number) {
    setRange(bounds(now));
    const input = inputRef.current;
    if (!input) return;
    try {
      input.showPicker();
    } catch {
      input.focus();
    }
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="sr-only">마감 시각</legend>
      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-medium">
          <CalendarIcon className="size-5 text-muted" />
          마감 시각 정하기
        </span>
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
          <div className="relative flex">
            <input
              ref={inputRef}
              id="deadline"
              type="datetime-local"
              step={60}
              value={value}
              min={range?.min}
              max={range?.max}
              onChange={(e) => onChange({ enabled: true, value: e.target.value })}
              // 화면을 오래 열어 두면 최솟값이 과거로 밀리므로 입력할 때마다 범위를 다시 계산한다
              onFocus={() => setRange(bounds(Date.now()))}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "deadline-error" : undefined}
              // 브라우저마다 다른 기본 달력 아이콘은 숨기고 아래 아이콘 버튼 하나로 통일한다
              className="min-w-0 flex-1 rounded-xl border border-line bg-background py-3 pr-12 pl-4 text-base [&::-webkit-calendar-picker-indicator]:hidden"
            />
            <button
              type="button"
              onClick={() => openPicker(Date.now())}
              aria-label="달력 열기"
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted"
            >
              <CalendarIcon className="size-5" />
            </button>
          </div>
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
