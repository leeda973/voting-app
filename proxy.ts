import { NextResponse, type NextRequest } from "next/server";
import { ENTRY_COOKIE, hasEntrySession } from "@/lib/auth";

// 입장 세션이 없으면 화면은 입장 화면으로, API는 401로 막는다.
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (await hasEntrySession(request.cookies.get(ENTRY_COOKIE)?.value)) {
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
  // 입장 화면과 입장 API, 정적 파일은 입장 없이 열린다
  matcher: ["/((?!enter$|api/entry$|_next/static|_next/image|favicon\\.ico$).*)"],
};
