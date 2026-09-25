import { startSessionWithPassword } from "@/lib/password-session-route";

export function POST(request: Request) {
  return startSessionWithPassword(request, "entry", {
    wrongPassword: "입장 비밀번호가 맞지 않아요.",
    serverError: "입장하지 못했어요. 잠시 후 다시 시도해 주세요.",
  });
}
