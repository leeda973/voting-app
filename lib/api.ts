// Route Handler 공통 응답. 오류는 스펙대로 { error, message } 형태다.
import type { VoteRejection } from "./poll-rules";

export function errorResponse(status: number, error: string, message: string, extra?: object): Response {
  return Response.json({ error, message, ...extra }, { status });
}

export function notFoundResponse(): Response {
  return errorResponse(404, "not_found", "없는 투표예요. 삭제되었을 수 있어요.");
}

export function serverErrorResponse(error: unknown, message = "잠시 후 다시 시도해 주세요."): Response {
  console.error(error);
  return errorResponse(500, "server_error", message);
}

const VOTE_REJECTIONS = {
  poll_closed: { status: 409, message: "마감된 투표라 표를 남길 수 없어요." },
  already_voted: { status: 409, message: "이미 이 투표에 표를 남겼어요. 표는 바꿀 수 없어요." },
  invalid_option: { status: 400, message: "선택지를 다시 골라 주세요." },
} as const satisfies Record<VoteRejection, { status: number; message: string }>;

export function voteRejectedResponse(reason: VoteRejection): Response {
  const { status, message } = VOTE_REJECTIONS[reason];
  return errorResponse(status, reason, message);
}

export function resultHiddenResponse(): Response {
  return errorResponse(403, "result_hidden", "표를 남기면 결과를 볼 수 있어요.");
}
