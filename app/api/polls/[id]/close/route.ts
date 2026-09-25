import { errorResponse, notFoundResponse, serverErrorResponse } from "@/lib/api";
import { currentViewer, forbiddenUnlessAdmin } from "@/lib/auth";
import { closePoll, getPollDetail } from "@/lib/polls";

// 투표 마감 (관리자)
export async function POST(_request: Request, ctx: RouteContext<"/api/polls/[id]/close">) {
  const forbidden = await forbiddenUnlessAdmin();
  if (forbidden) return forbidden;

  try {
    const { id } = await ctx.params;
    const outcome = await closePoll(id);
    if (outcome === "not_found") return notFoundResponse();
    if (outcome === "already_closed") return errorResponse(409, "already_closed", "이미 마감된 투표예요.");

    const poll = await getPollDetail(id, await currentViewer());
    return poll ? Response.json(poll) : notFoundResponse();
  } catch (error) {
    return serverErrorResponse(error, "투표를 마감하지 못했어요. 잠시 후 다시 시도해 주세요.");
  }
}
