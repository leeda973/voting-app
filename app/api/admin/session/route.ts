import { endAdminSession } from "@/lib/auth";
import { startSessionWithPassword } from "@/lib/password-session-route";

// 관리자 세션 시작 (관리자 비밀번호 확인). 관리자도 투표자이므로 브라우저 식별 쿠키가 함께 발급된다.
export function POST(request: Request) {
  return startSessionWithPassword(request, "admin", {
    wrongPassword: "관리자 비밀번호가 맞지 않아요.",
    serverError: "관리자로 들어가지 못했어요. 잠시 후 다시 시도해 주세요.",
  });
}

// 관리자 세션 끝내기 (로그아웃)
export async function DELETE() {
  await endAdminSession();
  return new Response(null, { status: 204 });
}
