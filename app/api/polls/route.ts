import { currentVoterId } from "@/lib/auth";
import { listPolls } from "@/lib/polls";

export async function GET() {
  try {
    return Response.json(await listPolls(await currentVoterId()));
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "server_error", message: "투표 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
