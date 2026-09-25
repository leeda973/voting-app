import Link from "next/link";
import { currentViewer } from "@/lib/auth";
import { getPollDetail } from "@/lib/polls";
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

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      <BackLink />
      <p className="mt-6 text-sm text-muted">{poll.status === "open" ? "진행 중" : "마감"}</p>
      <h1 className="mt-1 text-2xl font-bold break-words">{poll.question}</h1>

      {canVote ? (
        <VoteForm pollId={poll.id} options={poll.options} />
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {poll.options.map((option) => {
            const mine = option.id === poll.myOptionId;
            return (
              <li
                key={option.id}
                className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                  mine ? "border-accent bg-accent-soft" : "border-line"
                }`}
              >
                <span className="min-w-0 break-words">{option.label}</span>
                {mine && <span className="shrink-0 text-xs font-semibold text-accent">내 선택</span>}
              </li>
            );
          })}
        </ul>
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
