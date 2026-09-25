// 입장 API와 관리자 세션 API가 함께 쓰는 비밀번호 확인 → 세션 발급 흐름.
import { isSessionPassword, startSession } from "./auth";
import type { SessionKind } from "./session";

export async function startSessionWithPassword(
  request: Request,
  kind: SessionKind,
  messages: { wrongPassword: string; serverError: string },
): Promise<Response> {
  try {
    const body = await request.json().catch(() => null);
    const password = typeof body?.password === "string" ? body.password : "";

    if (!(await isSessionPassword(kind, password))) {
      return Response.json({ error: "wrong_password", message: messages.wrongPassword }, { status: 401 });
    }

    await startSession(kind);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "server_error", message: messages.serverError }, { status: 500 });
  }
}
