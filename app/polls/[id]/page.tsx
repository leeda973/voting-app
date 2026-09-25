import Link from "next/link";
import { currentViewer } from "@/lib/auth";
import { getPollDetail, getResult } from "@/lib/polls";
import { ResultView } from "./result-view";
import { VoteForm } from "./vote-form";

export default async function PollPage({ params }: PageProps<"/polls/[id]">) {
  const { id } = await params;
  const poll = await getPollDetail(id, await currentViewer());

  if (!poll) {
    return (
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
        <h1 className="text-2xl font-bold">없는 투표예요</h1>
        <p className="mt-4 text-muted">삭제되었거나 주소가 잘못되었을 수 있어요.</p>
        <BackLink />
      </main>
    );
  }

  const canVote = poll.status === "open" && poll.myOptionId === null;
  const result = poll.canViewResult ? await getResult(poll) : null;

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      <BackLink />
      <p className="mt-6 text-sm text-muted">{poll.status === "open" ? "진행 중" : "마감"}</p>
      <h1 className="mt-1 text-2xl font-bold break-words">{poll.question}</h1>

      {canVote && <VoteForm pollId={poll.id} options={poll.options} />}

      {result && (
        <>
          {canVote && (
            <h2 className="mt-10 text-sm font-semibold text-muted">현재 결과 (관리자에게만 보여요)</h2>
          )}
          <ResultView result={result} />
        </>
      )}
    </main>
  );
}

function BackLink() {
  return (
    <Link href="/" className="text-sm text-muted">
      ← 투표 목록
    </Link>
  );
}
