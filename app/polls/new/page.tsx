import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { CreatePollForm } from "./create-poll-form";

export default async function NewPollPage() {
  if (!(await isAdmin())) {
    return (
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-bold">투표 만들기</h1>
        <p className="mt-4 text-muted">관리자만 투표를 만들 수 있어요.</p>
        <Link href="/" className="mt-6 inline-block text-accent underline">
          투표 목록으로
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold">투표 만들기</h1>
      <p className="mt-2 text-muted">만든 뒤에는 수정할 수 없어요. 오타가 있으면 삭제하고 다시 만들어 주세요.</p>
      <CreatePollForm />
    </main>
  );
}
