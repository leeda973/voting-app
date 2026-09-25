import Link from "next/link";
import { currentVoterId } from "@/lib/auth";
import { listPolls } from "@/lib/polls";
import type { PollSummary } from "@/lib/poll-rules";

export default async function Home() {
  const { open, closed } = await listPolls(await currentVoterId());
  const isEmpty = open.length === 0 && closed.length === 0;

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold">동아리 투표</h1>

      {isEmpty ? (
        <p className="mt-10 rounded-xl border border-dashed border-line px-4 py-10 text-center text-muted">
          아직 투표가 없어요.
        </p>
      ) : (
        <>
          <PollSection title="진행 중" polls={open} emptyText="진행 중인 투표가 없어요." />
          <PollSection title="마감" polls={closed} emptyText="마감된 투표가 없어요." />
        </>
      )}
    </main>
  );
}

function PollSection({
  title,
  polls,
  emptyText,
}: {
  title: string;
  polls: PollSummary[];
  emptyText: string;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-muted">{title}</h2>
      {polls.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{emptyText}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {polls.map((poll) => (
            <li key={poll.id}>
              <Link
                href={`/polls/${poll.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-line px-4 py-3"
              >
                <span className="min-w-0 break-words">{poll.question}</span>
                {poll.hasVoted && (
                  <span className="shrink-0 rounded-full bg-accent-soft px-2 py-0.5 text-xs text-accent">
                    투표 완료
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
