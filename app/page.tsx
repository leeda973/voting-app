import Link from "next/link";
import { LogoutButton } from "@/app/admin/logout-button";
import { LiveNow } from "@/app/components/live-now";
import { ListTiming } from "@/app/components/poll-timing";
import { currentViewer } from "@/lib/auth";
import { requestTime } from "@/lib/clock";
import { listPolls } from "@/lib/polls";
import { watchedDeadlines, type PollSummary } from "@/lib/poll-rules";

export default async function Home() {
  const [viewer, now] = await Promise.all([currentViewer(), requestTime()]);
  const { open, closed } = await listPolls(viewer.voterId, now);
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
          <LiveNow initialNow={now} deadlines={watchedDeadlines(open)}>
            <PollSection title="진행 중" polls={open} emptyText="진행 중인 투표가 없어요." />
            <PollSection title="마감" polls={closed} emptyText="마감된 투표가 없어요." />
          </LiveNow>
        </>
      )}

      <footer className="mt-16 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-line pt-4 text-sm text-muted">
        {viewer.isAdmin ? (
          <>
            <span className="font-semibold text-accent">관리자로 로그인됨</span>
            <Link href="/admin" className="underline">
              관리자 화면
            </Link>
            <LogoutButton className="underline disabled:opacity-60" />
          </>
        ) : (
          <Link href="/admin" className="underline">
            관리자 로그인
          </Link>
        )}
      </footer>
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
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="break-words">{poll.question}</span>
                  <ListTiming poll={poll} />
                </span>
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
