import { describe, expect, it } from "vitest";
import {
  canViewResult,
  decideVote,
  effectiveClosedAt,
  effectivePollState,
  effectiveStatus,
  formatKstDateTime,
  groupPollsByStatus,
  nextRefreshDelay,
  remainingTime,
  tallyResult,
  toKstInputValue,
  validatePollInput,
  watchedDeadlines,
  type PollSummary,
} from "./poll-rules";

function poll(overrides: Partial<PollSummary> & Pick<PollSummary, "id">): PollSummary {
  return {
    question: "질문",
    status: "open",
    createdAt: "2026-09-01T00:00:00.000Z",
    deadline: null,
    closedAt: null,
    hasVoted: false,
    ...overrides,
  };
}

describe("groupPollsByStatus", () => {
  it("투표가 없으면 진행 중과 마감 모두 비어 있다", () => {
    expect(groupPollsByStatus([])).toEqual({ open: [], closed: [] });
  });

  it("진행 중 투표와 마감된 투표를 나눈다", () => {
    const open = poll({ id: "a", status: "open" });
    const closed = poll({ id: "b", status: "closed" });

    expect(groupPollsByStatus([open, closed])).toEqual({
      open: [open],
      closed: [closed],
    });
  });

  it("마감 시각 없는 진행 중 투표는 최신순, 마감 투표는 마감된 때 최신순이다", () => {
    const older = poll({ id: "old", createdAt: "2026-09-01T00:00:00.000Z" });
    const newer = poll({ id: "new", createdAt: "2026-09-02T00:00:00.000Z" });
    const olderClosed = poll({ id: "old-c", status: "closed", createdAt: "2026-08-01T00:00:00.000Z", closedAt: "2026-08-03T00:00:00.000Z" });
    const newerClosed = poll({ id: "new-c", status: "closed", createdAt: "2026-08-02T00:00:00.000Z", closedAt: "2026-08-04T00:00:00.000Z" });

    const result = groupPollsByStatus([older, olderClosed, newer, newerClosed]);

    expect(result.open.map((p) => p.id)).toEqual(["new", "old"]);
    expect(result.closed.map((p) => p.id)).toEqual(["new-c", "old-c"]);
  });
});

describe("validatePollInput", () => {
  const options = ["치킨", "피자"];
  // 마감 시각이 없는 입력은 현재 시각과 무관하다. 고정된 시각을 넘긴다
  const NOW = Date.parse("2026-09-25T00:00:00.000Z");

  function errorsOf(input: { question: unknown; options: unknown; deadline?: unknown }) {
    const result = validatePollInput(input, NOW);
    if (result.ok) throw new Error("검증을 통과하면 안 된다");
    return result.errors;
  }

  it("올바른 입력은 앞뒤 공백을 지운 값으로 통과한다", () => {
    expect(validatePollInput({ question: "  회식 메뉴는?  ", options: [" 치킨", "피자 ", " 족발 "] }, NOW)).toEqual({
      ok: true,
      value: { question: "회식 메뉴는?", options: ["치킨", "피자", "족발"], deadline: null },
    });
  });

  describe("질문", () => {
    it.each(["", "   "])("비었거나 공백만(%j) 있으면 거부한다", (question) => {
      expect(errorsOf({ question, options }).question).toBe("질문을 입력해 주세요.");
    });

    it("100자는 통과한다", () => {
      expect(validatePollInput({ question: "가".repeat(100), options }, NOW).ok).toBe(true);
    });

    it("101자는 거부한다", () => {
      expect(errorsOf({ question: "가".repeat(101), options }).question).toBe("질문은 100자 이하로 입력해 주세요.");
    });

    it("문자열이 아니면 거부한다", () => {
      expect(errorsOf({ question: 3, options }).question).toBe("질문을 입력해 주세요.");
    });
  });

  describe("선택지 개수", () => {
    it("1개는 거부한다", () => {
      expect(errorsOf({ question: "질문", options: ["치킨"] }).options).toBe("선택지를 2개 이상 입력해 주세요.");
    });

    it("2개와 10개는 통과한다", () => {
      expect(validatePollInput({ question: "질문", options: ["가", "나"] }, NOW).ok).toBe(true);
      const ten = Array.from({ length: 10 }, (_, i) => `선택지 ${i + 1}`);
      expect(validatePollInput({ question: "질문", options: ten }, NOW).ok).toBe(true);
    });

    it("11개는 거부한다", () => {
      const eleven = Array.from({ length: 11 }, (_, i) => `선택지 ${i + 1}`);
      expect(errorsOf({ question: "질문", options: eleven }).options).toBe("선택지는 10개까지 만들 수 있어요.");
    });

    it("배열이 아니면 거부한다", () => {
      expect(errorsOf({ question: "질문", options: "치킨" }).options).toBe("선택지를 2개 이상 입력해 주세요.");
    });
  });

  describe("선택지 문구", () => {
    it("50자는 통과하고 51자는 거부한다", () => {
      expect(validatePollInput({ question: "질문", options: ["가".repeat(50), "나"] }, NOW).ok).toBe(true);
      expect(errorsOf({ question: "질문", options: ["가".repeat(51), "나"] }).optionItems).toEqual([
        "선택지는 50자 이하로 입력해 주세요.",
        null,
      ]);
    });

    it("빈 칸이나 공백만 있는 선택지는 그 칸만 거부한다", () => {
      expect(errorsOf({ question: "질문", options: ["치킨", "  ", "피자"] }).optionItems).toEqual([
        null,
        "선택지를 입력해 주세요.",
        null,
      ]);
    });

    it("공백 차이만 있는 중복은 뒤쪽 칸을 거부한다", () => {
      expect(errorsOf({ question: "질문", options: ["치킨", " 치킨 ", "피자"] }).optionItems).toEqual([
        null,
        "같은 선택지가 이미 있어요.",
        null,
      ]);
    });

    it("문자열이 아닌 선택지는 빈 칸으로 본다", () => {
      expect(errorsOf({ question: "질문", options: ["치킨", 1] }).optionItems).toEqual([
        null,
        "선택지를 입력해 주세요.",
      ]);
    });
  });

  it("여러 칸이 틀리면 모든 오류를 한 번에 돌려준다", () => {
    expect(errorsOf({ question: "", options: ["치킨"] })).toMatchObject({
      question: "질문을 입력해 주세요.",
      options: "선택지를 2개 이상 입력해 주세요.",
    });
  });
});

describe("decideVote", () => {
  const base = { status: "open" as const, hasVoted: false, optionBelongsToPoll: true };

  it("진행 중이고 처음 투표하며 이 투표의 선택지를 고르면 허용한다", () => {
    expect(decideVote(base)).toEqual({ ok: true });
  });

  it("이미 투표했으면 already_voted로 거부한다", () => {
    expect(decideVote({ ...base, hasVoted: true })).toEqual({ ok: false, reason: "already_voted" });
  });

  it("마감됐으면 poll_closed로 거부한다", () => {
    expect(decideVote({ ...base, status: "closed" })).toEqual({ ok: false, reason: "poll_closed" });
  });

  it("다른 투표의 선택지면 invalid_option으로 거부한다", () => {
    expect(decideVote({ ...base, optionBelongsToPoll: false })).toEqual({ ok: false, reason: "invalid_option" });
  });

  it("마감과 이미 투표함이 겹치면 마감을 먼저 알린다", () => {
    expect(decideVote({ status: "closed", hasVoted: true, optionBelongsToPoll: false })).toEqual({
      ok: false,
      reason: "poll_closed",
    });
  });

  it("이미 투표함과 잘못된 선택지가 겹치면 이미 투표함을 먼저 알린다", () => {
    expect(decideVote({ ...base, hasVoted: true, optionBelongsToPoll: false })).toEqual({
      ok: false,
      reason: "already_voted",
    });
  });
});

describe("canViewResult", () => {
  it.each([
    { status: "open", hasVoted: false, isAdmin: false, expected: false },
    { status: "open", hasVoted: true, isAdmin: false, expected: true },
    { status: "open", hasVoted: false, isAdmin: true, expected: true },
    { status: "open", hasVoted: true, isAdmin: true, expected: true },
    { status: "closed", hasVoted: false, isAdmin: false, expected: true },
    { status: "closed", hasVoted: true, isAdmin: false, expected: true },
    { status: "closed", hasVoted: false, isAdmin: true, expected: true },
  ] as const)(
    "상태 $status, 투표함 $hasVoted, 관리자 $isAdmin → $expected",
    ({ expected, ...input }) => {
      expect(canViewResult(input)).toBe(expected);
    },
  );
});

describe("tallyResult", () => {
  const options = [
    { id: "a", label: "치킨" },
    { id: "b", label: "피자" },
    { id: "c", label: "족발" },
  ];

  it("표가 없으면 총 0표, 모두 0%다", () => {
    expect(tallyResult(options, {})).toEqual({
      totalVotes: 0,
      options: [
        { id: "a", label: "치킨", votes: 0, percent: 0 },
        { id: "b", label: "피자", votes: 0, percent: 0 },
        { id: "c", label: "족발", votes: 0, percent: 0 },
      ],
    });
  });

  it("한 선택지에 몰리면 그 선택지가 100%다", () => {
    const result = tallyResult(options, { b: 4 });
    expect(result.totalVotes).toBe(4);
    expect(result.options.map((o) => o.percent)).toEqual([0, 100, 0]);
  });

  it("비율은 정수로 반올림한다(3표를 1:1:1로 나누면 각 33%)", () => {
    expect(tallyResult(options, { a: 1, b: 1, c: 1 }).options.map((o) => o.percent)).toEqual([33, 33, 33]);
  });

  it("반올림 경계: 2:1이면 67%와 33%다", () => {
    expect(tallyResult(options, { a: 2, c: 1 }).options.map((o) => o.percent)).toEqual([67, 0, 33]);
  });

  it("표가 없는 선택지도 0표로 포함하고 표시 순서를 지킨다", () => {
    const result = tallyResult(options, { c: 2, a: 1 });
    expect(result.options.map((o) => [o.id, o.votes])).toEqual([
      ["a", 1],
      ["b", 0],
      ["c", 2],
    ]);
  });
});

describe("effectiveStatus", () => {
  const deadline = "2026-09-27T09:00:00.000Z";
  const at = Date.parse(deadline);

  it("마감 시각이 없으면 저장된 상태를 그대로 쓴다", () => {
    expect(effectiveStatus({ storedStatus: "open", deadline: null }, at)).toBe("open");
    expect(effectiveStatus({ storedStatus: "closed", deadline: null }, at)).toBe("closed");
  });

  it("마감 시각 1밀리초 전에는 진행 중이다", () => {
    expect(effectiveStatus({ storedStatus: "open", deadline }, at - 1)).toBe("open");
  });

  it("마감 시각 정각에는 마감이다", () => {
    expect(effectiveStatus({ storedStatus: "open", deadline }, at)).toBe("closed");
  });

  it("마감 시각 1밀리초 후에는 마감이다", () => {
    expect(effectiveStatus({ storedStatus: "open", deadline }, at + 1)).toBe("closed");
  });

  it("관리자가 마감했으면 마감 시각이 미래여도 마감이다", () => {
    expect(effectiveStatus({ storedStatus: "closed", deadline }, at - 60_000)).toBe("closed");
  });
});

describe("effectiveClosedAt", () => {
  const deadline = "2026-09-27T09:00:00.000Z";
  const at = Date.parse(deadline);

  it("관리자가 마감한 시각이 있으면 그 값을 쓴다", () => {
    const closedAt = "2026-09-26T12:00:00.000Z";
    expect(effectiveClosedAt({ storedStatus: "closed", closedAt, deadline }, at + 1)).toBe(closedAt);
  });

  it("마감 시각 없이 관리자가 마감했으면 관리자가 마감한 시각이다", () => {
    const closedAt = "2026-09-26T12:00:00.000Z";
    expect(effectiveClosedAt({ storedStatus: "closed", closedAt, deadline: null }, at)).toBe(closedAt);
  });

  it("마감 시각이 지나 마감됐으면 마감 시각 값이다", () => {
    expect(effectiveClosedAt({ storedStatus: "open", closedAt: null, deadline }, at + 1)).toBe(deadline);
  });

  it("진행 중이면 없다", () => {
    expect(effectiveClosedAt({ storedStatus: "open", closedAt: null, deadline }, at - 1)).toBeNull();
    expect(effectiveClosedAt({ storedStatus: "open", closedAt: null, deadline: null }, at)).toBeNull();
  });
});

describe("실제 상태와 기존 규칙의 조합", () => {
  const deadline = "2026-09-27T09:00:00.000Z";
  const after = Date.parse(deadline) + 1;

  it("마감 시각이 지난 투표에는 표를 남길 수 없다", () => {
    const status = effectiveStatus({ storedStatus: "open", deadline }, after);
    expect(decideVote({ status, hasVoted: false, optionBelongsToPoll: true })).toEqual({
      ok: false,
      reason: "poll_closed",
    });
  });

  it("마감 시각이 지난 투표는 표를 남기지 않아도 결과를 볼 수 있다", () => {
    const status = effectiveStatus({ storedStatus: "open", deadline }, after);
    expect(canViewResult({ status, hasVoted: false, isAdmin: false })).toBe(true);
  });

  it("마감 시각이 없는 진행 중 투표는 지금과 같다(표 가능, 표 전에는 결과 비공개)", () => {
    const status = effectiveStatus({ storedStatus: "open", deadline: null }, after);
    expect(decideVote({ status, hasVoted: false, optionBelongsToPoll: true })).toEqual({ ok: true });
    expect(canViewResult({ status, hasVoted: false, isAdmin: false })).toBe(false);
  });
});

describe("effectivePollState와 목록 분류", () => {
  const now = Date.parse("2026-09-27T09:00:00.000Z");
  const stored = (id: string, over: Partial<{ storedStatus: "open" | "closed"; deadline: string | null; closedAt: string | null }>) => ({
    ...poll({ id }),
    storedStatus: "open" as const,
    deadline: null,
    closedAt: null,
    ...over,
  });
  const classify = (polls: ReturnType<typeof stored>[]) =>
    groupPollsByStatus(polls.map((p) => ({ ...p, ...effectivePollState(p, now) })));

  it("마감 시각이 지난 투표는 마감 쪽으로 가고, 마감된 때는 마감 시각이다", () => {
    const { open, closed } = classify([stored("past", { deadline: "2026-09-27T08:00:00.000Z" })]);
    expect(open).toEqual([]);
    expect(closed.map((p) => [p.id, p.status, p.closedAt])).toEqual([["past", "closed", "2026-09-27T08:00:00.000Z"]]);
  });

  it("마감 시각이 없는 투표는 저장된 상태대로 나뉜다", () => {
    const { open, closed } = classify([
      stored("none-open", {}),
      stored("none-closed", { storedStatus: "closed", closedAt: "2026-09-26T00:00:00.000Z" }),
    ]);
    expect(open.map((p) => [p.id, p.deadline, p.closedAt])).toEqual([["none-open", null, null]]);
    expect(closed.map((p) => [p.id, p.closedAt])).toEqual([["none-closed", "2026-09-26T00:00:00.000Z"]]);
  });

  it("마감 시각이 미래인 투표는 진행 중이다", () => {
    const { open } = classify([stored("future", { deadline: "2026-09-28T00:00:00.000Z" })]);
    expect(open.map((p) => [p.id, p.status])).toEqual([["future", "open"]]);
  });
});

describe("validatePollInput의 마감 시각", () => {
  // 2026-09-25 09:00 (한국 시간) = 2026-09-25T00:00Z
  const NOW = Date.parse("2026-09-25T00:00:00.000Z");
  const base = { question: "질문", options: ["가", "나"] };
  const MIN = 60_000;

  function deadlineOf(deadline: unknown, now = NOW) {
    const result = validatePollInput({ ...base, deadline }, now);
    return result.ok ? { ok: result.value.deadline } : { error: result.errors.deadline };
  }

  it.each([undefined, null])("없으면(%j) 마감 시각 없이 통과한다", (deadline) => {
    expect(deadlineOf(deadline)).toEqual({ ok: null });
  });

  it("빈 문자열은 고르지 않은 것으로 보고 거부한다(마감 시각 정하기를 켜고 비워 둠)", () => {
    expect(deadlineOf("")).toEqual({ error: "마감 시각을 골라 주세요. 필요 없으면 마감 시각 정하기를 꺼 주세요." });
  });

  it("한국 시간으로 해석해 UTC로 돌려준다", () => {
    // 2026-09-27 18:00 KST = 09:00Z
    expect(deadlineOf("2026-09-27T18:00")).toEqual({ ok: "2026-09-27T09:00:00.000Z" });
  });

  it.each(["2026-09-27", "2026-09-27 18:00", "2026-09-27T18:00:00", "2026-13-01T10:00", "2026-02-30T10:00", "2026-09-27T24:00", "내일", 20260927])(
    "형식이 잘못되면(%j) 거부한다",
    (deadline) => {
      expect(deadlineOf(deadline)).toEqual({ error: "마감 시각을 다시 확인해 주세요." });
    },
  );

  it("지금부터 10분 뒤는 통과하고, 9분 59초 뒤는 거부한다", () => {
    // 입력은 분 단위라 초를 흉내 내려고 현재 시각을 1초 옮긴다: 09:10 KST 입력
    expect(deadlineOf("2026-09-25T09:10")).toEqual({ ok: "2026-09-25T00:10:00.000Z" });
    expect(deadlineOf("2026-09-25T09:10", NOW + 1000)).toEqual({
      error: "마감 시각은 지금부터 10분 뒤 이후로 정해 주세요.",
    });
  });

  it("지난 시각은 거부한다", () => {
    expect(deadlineOf("2026-09-24T18:00")).toEqual({ error: "마감 시각은 지금부터 10분 뒤 이후로 정해 주세요." });
  });

  it("30일 뒤는 통과하고, 30일 1분 뒤는 거부한다", () => {
    expect(deadlineOf("2026-10-25T09:00")).toEqual({ ok: "2026-10-25T00:00:00.000Z" });
    expect(deadlineOf("2026-10-25T09:01")).toEqual({ error: "마감 시각은 30일 이내로 정해 주세요." });
    expect(Date.parse("2026-10-25T00:01:00.000Z") - NOW).toBe(30 * 24 * 60 * MIN + MIN);
  });

  it("마감 시각 오류는 다른 칸 오류와 함께 돌려준다", () => {
    const result = validatePollInput({ question: "", options: ["가"], deadline: "x" }, NOW);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(["deadline", "options", "question"]);
  });
});

describe("formatKstDateTime", () => {
  it("한국 시간 기준 월·일·요일·시각을 보여준다", () => {
    expect(formatKstDateTime("2026-09-27T09:00:00.000Z")).toBe("9월 27일(일) 18:00");
  });

  it("UTC 자정 전 시각은 한국 시간으로 다음 날이다", () => {
    expect(formatKstDateTime("2026-09-26T15:30:00.000Z")).toBe("9월 27일(일) 00:30");
  });

  it("한 자리 분도 두 자리로 보여준다", () => {
    expect(formatKstDateTime("2026-01-01T00:05:00.000Z")).toBe("1월 1일(목) 09:05");
  });
});

describe("toKstInputValue", () => {
  it("현재 시각을 한국 시간 날짜·시간 입력값(분 단위)으로 바꾼다", () => {
    expect(toKstInputValue(Date.parse("2026-09-26T15:30:59.999Z"))).toBe("2026-09-27T00:30");
  });

  it("입력 검증과 왕복해도 같은 분이다", () => {
    const now = Date.parse("2026-09-25T00:00:00.000Z");
    const value = toKstInputValue(now + 24 * 60 * 60 * 1000);
    const result = validatePollInput({ question: "질문", options: ["가", "나"], deadline: value }, now);
    expect(result.ok && result.value.deadline).toBe("2026-09-26T00:00:00.000Z");
  });
});

describe("remainingTime", () => {
  const deadline = "2026-09-27T09:00:00.000Z";
  const at = Date.parse(deadline);
  const MIN = 60_000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;

  it.each([
    [3 * DAY + 5 * HOUR, "3일 남음", false],
    [DAY, "1일 남음", false],
    [DAY - MIN, "23시간 남음", true],
    [HOUR, "1시간 남음", true],
    [HOUR - 1, "1시간 남음", true], // 분 올림이 60분이 되면 "1시간"으로 보인다
    [30 * MIN, "30분 남음", true],
    [29 * MIN + 1, "30분 남음", true],
    [30 * 1000, "1분 남음", true],
    [1, "1분 남음", true],
  ])("%d ms 남으면 %s (강조 %s)", (left, label, urgent) => {
    expect(remainingTime(deadline, at - left)).toEqual({ label, urgent });
  });

  it("마감 시각이 되면 마감됨이다", () => {
    expect(remainingTime(deadline, at)).toEqual({ label: "마감됨", urgent: false });
    expect(remainingTime(deadline, at + MIN)).toEqual({ label: "마감됨", urgent: false });
  });
});

describe("groupPollsByStatus 정렬", () => {
  it("진행 중: 마감 시각 있는 투표를 임박순으로 먼저, 없는 투표는 아래에 최신순", () => {
    const { open } = groupPollsByStatus([
      poll({ id: "none-old", createdAt: "2026-09-01T00:00:00.000Z" }),
      poll({ id: "late", deadline: "2026-09-30T00:00:00.000Z", createdAt: "2026-09-24T00:00:00.000Z" }),
      poll({ id: "none-new", createdAt: "2026-09-20T00:00:00.000Z" }),
      poll({ id: "soon", deadline: "2026-09-26T00:00:00.000Z", createdAt: "2026-09-02T00:00:00.000Z" }),
    ]);
    expect(open.map((p) => p.id)).toEqual(["soon", "late", "none-new", "none-old"]);
  });

  it("마감: 마감된 때의 최신순(만든 순서와 무관)", () => {
    const { closed } = groupPollsByStatus([
      poll({ id: "made-new-closed-early", status: "closed", createdAt: "2026-09-20T00:00:00.000Z", closedAt: "2026-09-21T00:00:00.000Z" }),
      poll({ id: "made-old-closed-late", status: "closed", createdAt: "2026-09-01T00:00:00.000Z", closedAt: "2026-09-24T00:00:00.000Z" }),
    ]);
    expect(closed.map((p) => p.id)).toEqual(["made-old-closed-late", "made-new-closed-early"]);
  });
});

describe("formatKstDateTime 옵션", () => {
  const now = Date.parse("2026-09-25T00:00:00.000Z");

  it("요일을 뺄 수 있다(목록용)", () => {
    expect(formatKstDateTime("2026-09-27T09:00:00.000Z", { weekday: false })).toBe("9월 27일 18:00");
  });

  it("현재 시각과 한국 시간 연도가 다르면 연도를 붙인다", () => {
    expect(formatKstDateTime("2025-09-27T09:00:00.000Z", { now })).toBe("2025년 9월 27일(토) 18:00");
    expect(formatKstDateTime("2026-09-27T09:00:00.000Z", { now })).toBe("9월 27일(일) 18:00");
  });

  it("연도는 한국 시간 기준이다(UTC로는 작년 12월 31일 15시 = 한국 1월 1일 0시)", () => {
    expect(formatKstDateTime("2025-12-31T15:00:00.000Z", { now })).toBe("1월 1일(목) 00:00");
  });
});

describe("마감 시각으로 마감된 투표와 관리자가 마감한 투표의 정렬", () => {
  it("마감된 때(마감 시각 또는 관리자가 마감한 시각)로 섞어서 최신순으로 놓는다", () => {
    const now = Date.parse("2026-09-27T12:00:00.000Z");
    const stored = [
      { ...poll({ id: "manual-early" }), storedStatus: "closed" as const, deadline: null, closedAt: "2026-09-26T00:00:00.000Z" },
      { ...poll({ id: "deadline-late" }), storedStatus: "open" as const, deadline: "2026-09-27T09:00:00.000Z", closedAt: null },
      { ...poll({ id: "manual-before-deadline" }), storedStatus: "closed" as const, deadline: "2026-09-30T00:00:00.000Z", closedAt: "2026-09-27T10:00:00.000Z" },
    ];
    const { closed } = groupPollsByStatus(stored.map((p) => ({ ...p, ...effectivePollState(p, now) })));
    expect(closed.map((p) => [p.id, p.closedAt])).toEqual([
      ["manual-before-deadline", "2026-09-27T10:00:00.000Z"],
      ["deadline-late", "2026-09-27T09:00:00.000Z"],
      ["manual-early", "2026-09-26T00:00:00.000Z"],
    ]);
  });
});

describe("nextRefreshDelay", () => {
  const now = Date.parse("2026-09-25T00:00:00.000Z");
  const at = (ms: number) => new Date(now + ms).toISOString();
  const HOUR = 60 * 60 * 1000;

  it("마감 시각이 없으면 다시 그리지 않는다", () => {
    expect(nextRefreshDelay([], now)).toBeNull();
  });

  it("이미 지난 마감 시각만 있으면 다시 그리지 않는다(무한 반복 방지)", () => {
    expect(nextRefreshDelay([at(-1000), at(0)], now)).toBeNull();
  });

  it("가장 가까운 앞으로의 마감 시각에 여유 1초를 더한 뒤 다시 그린다", () => {
    expect(nextRefreshDelay([at(3 * HOUR), at(-5000), at(90_000)], now)).toBe(90_000 + 1000);
  });

  it("24시간보다 먼 마감 시각은 지금 예약하지 않는다(타이머 한계, 1분 갱신 때 다시 계산)", () => {
    expect(nextRefreshDelay([at(24 * HOUR + 1)], now)).toBeNull();
    expect(nextRefreshDelay([at(24 * HOUR)], now)).toBe(24 * HOUR + 1000);
  });
});

describe("watchedDeadlines", () => {
  it("진행 중이고 마감 시각이 있는 투표의 마감 시각만 고른다", () => {
    expect(
      watchedDeadlines([
        { status: "open", deadline: "2026-09-27T09:00:00.000Z", closedAt: null },
        { status: "open", deadline: null, closedAt: null },
        { status: "closed", deadline: "2026-09-20T00:00:00.000Z", closedAt: "2026-09-20T00:00:00.000Z" },
      ]),
    ).toEqual(["2026-09-27T09:00:00.000Z"]);
  });
});
