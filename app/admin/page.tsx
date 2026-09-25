import Link from "next/link";
import { PasswordForm } from "@/app/components/password-form";
import { isAdmin } from "@/lib/auth";
import { LogoutButton } from "./logout-button";

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
        <h1 className="text-2xl font-bold">관리자</h1>
        <p className="mt-2 text-muted">운영진이 공유한 관리자 비밀번호를 입력해 주세요.</p>
        <PasswordForm
          endpoint="/api/admin/session"
          label="관리자 비밀번호"
          submitText="관리자로 들어가기"
          redirectTo="/admin"
        />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold">관리자</h1>
      <p className="mt-2 text-muted">관리자 세션은 1일 동안 유지돼요.</p>

      <div className="mt-8 flex flex-col gap-3">
        {/* 투표 만들기는 티켓 04에서 연결한다 */}
        <button
          type="button"
          disabled
          className="rounded-xl bg-accent px-4 py-3 font-semibold text-background opacity-60"
        >
          투표 만들기 (준비 중)
        </button>
        <Link href="/" className="rounded-xl border border-line px-4 py-3 text-center">
          투표 목록으로
        </Link>
        <LogoutButton />
      </div>
    </main>
  );
}
