import Link from "next/link";
import { PasswordForm } from "@/app/components/password-form";
import { safeRedirectPath } from "@/lib/safe-redirect";

export default async function EnterPage({ searchParams }: PageProps<"/enter">) {
  const { next } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-bold">동아리 투표</h1>
      <p className="mt-2 text-muted">동아리에서 공유한 입장 비밀번호를 입력해 주세요.</p>
      <PasswordForm
        endpoint="/api/entry"
        label="입장 비밀번호"
        submitText="입장하기"
        redirectTo={safeRedirectPath(typeof next === "string" ? next : null)}
      />
      {/* 관리자 세션만으로 들어왔던 운영진이 로그아웃하거나 세션이 끝나면 이 화면으로 온다. 여기서도 다시 들어갈 수 있게 한다 */}
      <p className="mt-8 text-center">
        <Link href="/admin" className="text-sm text-muted underline">
          관리자 로그인
        </Link>
      </p>
    </main>
  );
}
