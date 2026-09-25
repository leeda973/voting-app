import { describe, expect, it } from "vitest";
import {
  canViewResult,
  decideVote,
  groupPollsByStatus,
  tallyResult,
  validatePollInput,
  type PollSummary,
} from "./poll-rules";

function poll(overrides: Partial<PollSummary> & Pick<PollSummary, "id">): PollSummary {
  return {
    question: "질문",
    status: "open",
    createdAt: "2026-09-01T00:00:00.000Z",
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

  it("각 목록을 최신순으로 정렬한다", () => {
    const older = poll({ id: "old", createdAt: "2026-09-01T00:00:00.000Z" });
    const newer = poll({ id: "new", createdAt: "2026-09-02T00:00:00.000Z" });
    const olderClosed = poll({ id: "old-c", status: "closed", createdAt: "2026-08-01T00:00:00.000Z" });
    const newerClosed = poll({ id: "new-c", status: "closed", createdAt: "2026-08-02T00:00:00.000Z" });

    const result = groupPollsByStatus([older, olderClosed, newer, newerClosed]);

    expect(result.open.map((p) => p.id)).toEqual(["new", "old"]);
    expect(result.closed.map((p) => p.id)).toEqual(["new-c", "old-c"]);
  });
});

describe("validatePollInput", () => {
  const options = ["치킨", "피자"];

  function errorsOf(input: { question: unknown; options: unknown }) {
    const result = validatePollInput(input);
    if (result.ok) throw new Error("검증을 통과하면 안 된다");
    return result.errors;
  }

  it("올바른 입력은 앞뒤 공백을 지운 값으로 통과한다", () => {
    expect(validatePollInput({ question: "  회식 메뉴는?  ", options: [" 치킨", "피자 ", " 족발 "] })).toEqual({
      ok: true,
      value: { question: "회식 메뉴는?", options: ["치킨", "피자", "족발"] },
    });
  });

  describe("질문", () => {
    it.each(["", "   "])("비었거나 공백만(%j) 있으면 거부한다", (question) => {
      expect(errorsOf({ question, options }).question).toBe("질문을 입력해 주세요.");
    });

    it("100자는 통과한다", () => {
      expect(validatePollInput({ question: "가".repeat(100), options }).ok).toBe(true);
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
      expect(validatePollInput({ question: "질문", options: ["가", "나"] }).ok).toBe(true);
      const ten = Array.from({ length: 10 }, (_, i) => `선택지 ${i + 1}`);
      expect(validatePollInput({ question: "질문", options: ten }).ok).toBe(true);
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
      expect(validatePollInput({ question: "질문", options: ["가".repeat(50), "나"] }).ok).toBe(true);
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
