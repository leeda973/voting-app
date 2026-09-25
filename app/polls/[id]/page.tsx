import Link from "next/link";
import { currentViewer } from "@/lib/auth";
import { requestTime } from "@/lib/clock";
import { DetailTiming } from "@/app/components/poll-timing";
import { decideVote } from "@/lib/poll-rules";
import { getPollDetail, getResult } from "@/lib/polls";
import { AdminActions } from "./admin-actions";
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

  // 아직 선택지를 고르기 전이므로 선택지 조건은 통과로 두고 투표 가능 여부만 묻는다
  const canVote = decideVote({
    status: poll.status,
    hasVoted: poll.myOptionId !== null,
    optionBelongsToPoll: true,
  }).ok;
  const result = poll.canViewResult ? await getResult(poll) : null;
  const now = await requestTime();

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      <BackLink />
      <p className="mt-6 text-sm text-muted">
        <DetailTiming poll={poll} now={now} />
      </p>
      <h1 className="mt-1 text-2xl font-bold break-words">{poll.question}</h1>

      {canVote && <VoteForm pollId={poll.id} options={poll.options} />}

      {result && (
        <>
          {canVote && (
            <h2 className="mt-10 text-sm font-semibold text-muted">현재 결과 (관리자에게만 보여요)</h2>
          )}
          <ResultView key={`${result.status}-${result.myOptionId}`} result={result} />
        </>
      )}

      {poll.isAdmin && <AdminActions pollId={poll.id} status={poll.status} />}
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
