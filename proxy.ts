import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, ENTRY_COOKIE, hasAppAccess } from "@/lib/auth";

// 입장 세션(또는 관리자 세션)이 없으면 화면은 입장 화면으로, API는 401로 막는다.
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { cookies } = request;

  if (await hasAppAccess(cookies.get(ENTRY_COOKIE)?.value, cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      { error: "unauthorized", message: "입장 비밀번호를 먼저 입력해 주세요." },
      { status: 401 },
    );
  }

  const enterUrl = new URL("/enter", request.url);
  enterUrl.searchParams.set("next", pathname + search);
  return NextResponse.redirect(enterUrl);
}

export const config = {
  // 입장 화면·입장 API, 관리자 화면·관리자 세션 API, 정적 파일은 입장 없이 열린다
  matcher: [
    "/((?!enter$|api/entry$|admin$|api/admin/session$|_next/static|_next/image|favicon\\.ico$).*)",
  ],
};
