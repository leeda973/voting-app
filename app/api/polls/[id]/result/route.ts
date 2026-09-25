import { notFoundResponse, resultHiddenResponse, serverErrorResponse } from "@/lib/api";
import { currentViewer } from "@/lib/auth";
import { getPollDetail, getResult } from "@/lib/polls";

export async function GET(_request: Request, ctx: RouteContext<"/api/polls/[id]/result">) {
  try {
    const { id } = await ctx.params;
    const poll = await getPollDetail(id, await currentViewer());
    if (!poll) return notFoundResponse();
    if (!poll.canViewResult) return resultHiddenResponse();
    return Response.json(await getResult(poll));
  } catch (error) {
    return serverErrorResponse(error, "결과를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
  }
}
