import { errorResponse, serverErrorResponse } from "@/lib/api";
import { currentVoterId, forbiddenUnlessAdmin } from "@/lib/auth";
import { validatePollInput } from "@/lib/poll-rules";
import { createPoll, listPolls } from "@/lib/polls";

export async function GET() {
  try {
    return Response.json(await listPolls(await currentVoterId(), Date.now()));
  } catch (error) {
    return serverErrorResponse(error, "투표 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.");
  }
}

// 투표 만들기 (관리자)
export async function POST(request: Request) {
  const forbidden = await forbiddenUnlessAdmin();
  if (forbidden) return forbidden;

  try {
    const body = await request.json().catch(() => null);
    const result = validatePollInput(
      { question: body?.question, options: body?.options, deadline: body?.deadline },
      Date.now(),
    );
    if (!result.ok) {
      return errorResponse(400, "invalid_input", "입력한 내용을 확인해 주세요.", { fields: result.errors });
    }

    const id = await createPoll(result.value);
    return Response.json({ id }, { status: 201 });
  } catch (error) {
    return serverErrorResponse(error, "투표를 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
  }
}
