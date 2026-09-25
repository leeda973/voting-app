// Route Handler 공통 응답. 오류는 스펙대로 { error, message } 형태다.

export function errorResponse(status: number, error: string, message: string, extra?: object): Response {
  return Response.json({ error, message, ...extra }, { status });
}

export const notFoundResponse = () => errorResponse(404, "not_found", "없는 투표예요. 삭제되었을 수 있어요.");

export function serverErrorResponse(error: unknown, message = "잠시 후 다시 시도해 주세요."): Response {
  console.error(error);
  return errorResponse(500, "server_error", message);
}
