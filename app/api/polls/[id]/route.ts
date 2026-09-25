import { notFoundResponse, serverErrorResponse } from "@/lib/api";
import { currentViewer, forbiddenUnlessAdmin } from "@/lib/auth";
import { deletePoll, getPollDetail } from "@/lib/polls";

export async function GET(_request: Request, ctx: RouteContext<"/api/polls/[id]">) {
  try {
    const { id } = await ctx.params;
    const poll = await getPollDetail(id, await currentViewer());
    return poll ? Response.json(poll) : notFoundResponse();
  } catch (error) {
    return serverErrorResponse(error);
  }
}

// 투표 삭제 (관리자). 복구할 수 없다.
export async function DELETE(_request: Request, ctx: RouteContext<"/api/polls/[id]">) {
  const forbidden = await forbiddenUnlessAdmin();
  if (forbidden) return forbidden;

  try {
    const { id } = await ctx.params;
    return (await deletePoll(id)) ? new Response(null, { status: 204 }) : notFoundResponse();
  } catch (error) {
    return serverErrorResponse(error, "투표를 삭제하지 못했어요. 잠시 후 다시 시도해 주세요.");
  }
}
