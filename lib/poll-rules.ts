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
