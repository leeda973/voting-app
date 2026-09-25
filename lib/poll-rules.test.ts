import { describe, expect, it } from "vitest";
import { groupPollsByStatus, type PollSummary } from "./poll-rules";

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
