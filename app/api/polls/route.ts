import { listPolls } from "@/lib/polls";

export async function GET() {
  try {
    // 브라우저 식별 쿠키는 티켓 02에서 생긴다. 그 전까지는 hasVoted가 모두 false다.
    return Response.json(await listPolls(null));
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "server_error", message: "투표 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
