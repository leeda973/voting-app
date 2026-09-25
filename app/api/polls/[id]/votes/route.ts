import { notFoundResponse, serverErrorResponse, voteRejectedResponse } from "@/lib/api";
import { currentViewer, ensureVoterId } from "@/lib/auth";
import { decideVote, type PollDetail } from "@/lib/poll-rules";
import { castVote, getPollDetail, getResult } from "@/lib/polls";

const decide = (poll: PollDetail, optionId: string) =>
  decideVote({
    status: poll.status,
    hasVoted: poll.myOptionId !== null,
    optionBelongsToPoll: poll.options.some((option) => option.id === optionId),
  });

// 표 남기기
export async function POST(request: Request, ctx: RouteContext<"/api/polls/[id]/votes">) {
  try {
    const { id } = await ctx.params;
    const body = await request.json().catch(() => null);
    const optionId = typeof body?.optionId === "string" ? body.optionId : "";

    const viewer = await currentViewer();
    const poll = await getPollDetail(id, viewer);
    if (!poll) return notFoundResponse();

    const decision = decide(poll, optionId);
    if (!decision.ok) return voteRejectedResponse(decision.reason);

    const voterId = await ensureVoterId();
    if (!(await castVote(id, optionId, voterId))) {
      // 확인과 저장 사이에 상태가 바뀌었다(동시 투표, 마감, 삭제). 최신 상태로 사유를 다시 판단한다.
      const fresh = await getPollDetail(id, { ...viewer, voterId });
      if (!fresh) return notFoundResponse();
      const retry = decide(fresh, optionId);
      return voteRejectedResponse(retry.ok ? "already_voted" : retry.reason);
    }

    const voted = await getPollDetail(id, { ...viewer, voterId });
    if (!voted) return notFoundResponse();
    return Response.json(await getResult(voted), { status: 201 });
  } catch (error) {
    return serverErrorResponse(error, "표를 남기지 못했어요. 잠시 후 다시 시도해 주세요.");
  }
}
