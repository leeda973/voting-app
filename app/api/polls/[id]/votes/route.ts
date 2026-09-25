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
    const poll = await getPollDetail(id, viewer, Date.now());
    if (!poll) return notFoundResponse();

    const decision = decide(poll, optionId);
    if (!decision.ok) return voteRejectedResponse(decision.reason);

    const voterId = await ensureVoterId();
    if (!(await castVote(id, optionId, voterId))) {
      // 확인과 저장 사이에 상태가 바뀌었다(동시 투표, 마감, 삭제). 최신 상태로 사유를 다시 판단한다.
      const fresh = await getPollDetail(id, { ...viewer, voterId }, Date.now());
      if (!fresh) return notFoundResponse();
      const retry = decide(fresh, optionId);
      if (!retry.ok) return voteRejectedResponse(retry.reason);
      // 앱 기준으로는 아직 가능해 보여도 DB가 거절했다. 내 표가 있으면 이미 투표한 것이고,
      // 없으면 DB 현재 시각 기준으로 마감 시각이 지난 것이다(앱 서버와 DB 시계의 작은 차이).
      return voteRejectedResponse(fresh.myOptionId !== null ? "already_voted" : "poll_closed");
    }

    const voted = await getPollDetail(id, { ...viewer, voterId }, Date.now());
    if (!voted) return notFoundResponse();
    return Response.json(await getResult(voted), { status: 201 });
  } catch (error) {
    return serverErrorResponse(error, "표를 남기지 못했어요. 잠시 후 다시 시도해 주세요.");
  }
}
