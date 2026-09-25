// 투표 규칙 모듈: DB와 HTTP를 모르는 순수 함수만 둔다.
// Route Handler와 화면은 여기서 답을 받아 저장하거나 응답만 한다.

export type PollStatus = "open" | "closed";

// ── 실제 상태 (ADR 0002) ──
// DB에 저장된 상태 값은 관리자가 마감했는지만 나타낸다. 마감 시각이 지났는지는 조회할 때 판단한다.
// 진행 중/마감은 항상 이 두 함수로 판단한다. 현재 시각(ms)은 인자로 받는다.

type StoredPollState = { storedStatus: PollStatus; deadline: string | null };

export function effectiveStatus({ storedStatus, deadline }: StoredPollState, now: number): PollStatus {
  if (storedStatus === "closed") return "closed";
  // 마감 시각 정각부터 마감이다
  if (deadline !== null && now >= Date.parse(deadline)) return "closed";
  return "open";
}

// 관리자가 마감한 시각이 있으면 그 값, 마감 시각이 지나 마감됐으면 마감 시각 값, 진행 중이면 null
export function effectiveClosedAt(
  poll: StoredPollState & { closedAt: string | null },
  now: number,
): string | null {
  if (poll.closedAt !== null) return poll.closedAt;
  return effectiveStatus(poll, now) === "closed" ? poll.deadline : null;
}

export type PollSummary = {
  id: string;
  question: string;
  status: PollStatus;
  createdAt: string;
  deadline: string | null; // 마감 시각. 없으면 null
  closedAt: string | null; // 실제 마감된 시각. 진행 중이면 null
  hasVoted: boolean;
};

export type PollList = {
  open: PollSummary[];
  closed: PollSummary[];
};

const newestFirst = (a: PollSummary, b: PollSummary) =>
  Date.parse(b.createdAt) - Date.parse(a.createdAt);

export function groupPollsByStatus(polls: PollSummary[]): PollList {
  return {
    open: polls.filter((p) => p.status === "open").sort(newestFirst),
    closed: polls.filter((p) => p.status === "closed").sort(newestFirst),
  };
}

// ── 투표 입력 검증 ──

export const QUESTION_MAX_LENGTH = 100;
export const OPTION_MAX_LENGTH = 50;
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 10;

export type PollInput = { question: string; options: string[] };

export type PollInputErrors = {
  question?: string;
  options?: string;
  // 선택지 칸별 오류. 오류가 없는 칸은 null이다.
  optionItems?: (string | null)[];
};

export type PollInputResult = { ok: true; value: PollInput } | { ok: false; errors: PollInputErrors };

// DB의 char_length와 같이 코드 포인트 단위로 센다
const lengthOf = (text: string) => Array.from(text).length;
const trimmed = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export function validatePollInput(input: { question: unknown; options: unknown }): PollInputResult {
  const errors: PollInputErrors = {};

  const question = trimmed(input.question);
  if (question === "") errors.question = "질문을 입력해 주세요.";
  else if (lengthOf(question) > QUESTION_MAX_LENGTH)
    errors.question = `질문은 ${QUESTION_MAX_LENGTH}자 이하로 입력해 주세요.`;

  const options = Array.isArray(input.options) ? input.options.map(trimmed) : [];
  if (options.length < MIN_OPTIONS) errors.options = `선택지를 ${MIN_OPTIONS}개 이상 입력해 주세요.`;
  else if (options.length > MAX_OPTIONS) errors.options = `선택지는 ${MAX_OPTIONS}개까지 만들 수 있어요.`;

  const optionItems = options.map((option, i) => {
    if (option === "") return "선택지를 입력해 주세요.";
    if (lengthOf(option) > OPTION_MAX_LENGTH) return `선택지는 ${OPTION_MAX_LENGTH}자 이하로 입력해 주세요.`;
    if (options.indexOf(option) < i) return "같은 선택지가 이미 있어요.";
    return null;
  });
  if (optionItems.some((error) => error !== null)) errors.optionItems = optionItems;

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return { ok: true, value: { question, options } };
}

// ── 투표 상세 ──

export type PollOption = { id: string; label: string };

export type PollDetail = {
  id: string;
  question: string;
  status: PollStatus;
  createdAt: string;
  deadline: string | null; // 마감 시각. 없으면 null
  closedAt: string | null; // 실제 마감된 시각. 진행 중이면 null
  options: PollOption[]; // 표시 순서대로
  myOptionId: string | null; // 이 브라우저의 표. 없으면 null
  canViewResult: boolean;
  isAdmin: boolean;
};

// ── 투표 가능 여부 ──

export type VoteRejection = "poll_closed" | "already_voted" | "invalid_option";

export function decideVote(input: {
  status: PollStatus;
  hasVoted: boolean;
  optionBelongsToPoll: boolean;
}): { ok: true } | { ok: false; reason: VoteRejection } {
  if (input.status === "closed") return { ok: false, reason: "poll_closed" };
  if (input.hasVoted) return { ok: false, reason: "already_voted" };
  if (!input.optionBelongsToPoll) return { ok: false, reason: "invalid_option" };
  return { ok: true };
}

// ── 결과 공개 여부와 선택지별 표 수 계산 ──

// 관리자이거나, 표를 남겼거나, 마감된 투표면 결과를 볼 수 있다.
export function canViewResult(input: { status: PollStatus; hasVoted: boolean; isAdmin: boolean }): boolean {
  return input.isAdmin || input.hasVoted || input.status === "closed";
}

export type ResultOption = PollOption & { votes: number; percent: number };

export type Result = {
  pollId: string;
  status: PollStatus;
  totalVotes: number;
  options: ResultOption[]; // 표시 순서대로
  myOptionId: string | null;
};

// 비율은 정수로 반올림하므로 합계가 100이 아닐 수 있다.
export function tallyResult(
  options: PollOption[],
  votesByOption: Record<string, number>,
): Pick<Result, "totalVotes" | "options"> {
  const counted = options.map((option) => ({ ...option, votes: votesByOption[option.id] ?? 0 }));
  const totalVotes = counted.reduce((sum, option) => sum + option.votes, 0);
  return {
    totalVotes,
    options: counted.map((option) => ({
      ...option,
      percent: totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100),
    })),
  };
}

// 지금 요청한 브라우저: 투표자 식별 쿠키 값(없으면 null)과 관리자 여부
export type Viewer = { voterId: string | null; isAdmin: boolean };
