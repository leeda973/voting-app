// 투표 규칙 모듈: DB와 HTTP를 모르는 순수 함수만 둔다.
// Route Handler와 화면은 여기서 답을 받아 저장하거나 응답만 한다.

export type PollStatus = "open" | "closed";

export type PollSummary = {
  id: string;
  question: string;
  status: PollStatus;
  createdAt: string;
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
  closedAt: string | null;
  options: PollOption[]; // 표시 순서대로
  myOptionId: string | null; // 이 브라우저의 표. 없으면 null
  canViewResult: boolean;
  isAdmin: boolean;
};
