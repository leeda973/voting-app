import { safeRedirectPath } from "@/lib/safe-redirect";
import { EntryForm } from "./entry-form";

export default async function EnterPage({ searchParams }: PageProps<"/enter">) {
  const { next } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-bold">동아리 투표</h1>
      <p className="mt-2 text-muted">동아리에서 공유한 입장 비밀번호를 입력해 주세요.</p>
      <EntryForm next={safeRedirectPath(typeof next === "string" ? next : null)} />
    </main>
  );
}
