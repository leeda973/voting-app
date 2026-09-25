import { isEntryPassword, startEntrySession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const password = typeof body?.password === "string" ? body.password : "";

    if (!(await isEntryPassword(password))) {
      return Response.json(
        { error: "wrong_password", message: "입장 비밀번호가 맞지 않아요." },
        { status: 401 },
      );
    }

    await startEntrySession();
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "server_error", message: "입장하지 못했어요. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
