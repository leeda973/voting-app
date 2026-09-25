import { notFoundResponse, serverErrorResponse } from "@/lib/api";
import { currentViewer } from "@/lib/auth";
import { getPollDetail } from "@/lib/polls";

export async function GET(_request: Request, ctx: RouteContext<"/api/polls/[id]">) {
  try {
    const { id } = await ctx.params;
    const poll = await getPollDetail(id, await currentViewer());
    return poll ? Response.json(poll) : notFoundResponse();
  } catch (error) {
    return serverErrorResponse(error);
  }
}
