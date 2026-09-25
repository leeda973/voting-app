import { connection } from "next/server";
import { getSql } from "./db";
import {
  canViewResult,
  groupPollsByStatus,
  tallyResult,
  type PollDetail,
  type PollInput,
  type PollList,
  type PollOption,
  type PollStatus,
  type Result,
} from "./poll-rules";

type PollRow = {
  id: string;
  question: string;
  status: PollStatus;
  created_at: Date;
  closed_at: Date | null;
};

const toIso = (date: Date) => new Date(date).toISOString();

// 투표 id는 uuid다. 형식이 다르면 DB가 오류를 내므로 미리 걸러 "없는 투표"로 처리한다.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isPollId = (id: string) => UUID.test(id);

// voterId가 없으면(아직 브라우저 식별 쿠키가 없으면) 모든 투표가 hasVoted: false다.
export async function listPolls(voterId: string | null): Promise<PollList> {
  // 빌드 시점에 미리 렌더링하지 않고 요청마다 DB에서 새로 읽는다
  await connection();
  const sql = getSql();
  const rows = (await sql`
    SELECT p.id, p.question, p.status, p.created_at,
           EXISTS (
             SELECT 1 FROM votes v WHERE v.poll_id = p.id AND v.voter_id = ${voterId}
           ) AS has_voted
    FROM polls p
  `) as (PollRow & { has_voted: boolean })[];

  return groupPollsByStatus(
    rows.map((r) => ({
      id: r.id,
      question: r.question,
      status: r.status,
      createdAt: toIso(r.created_at),
      hasVoted: r.has_voted,
    })),
  );
}

// 투표 1건과 선택지들을 한 트랜잭션으로 저장한다. 선택지는 입력 순서대로 position이 매겨진다.
export async function createPoll(input: PollInput): Promise<string> {
  const sql = getSql();
  const id = crypto.randomUUID();
  const positions = input.options.map((_, i) => i);
  await sql.transaction([
    sql`INSERT INTO polls (id, question) VALUES (${id}, ${input.question})`,
    sql`
      INSERT INTO options (poll_id, label, position)
      SELECT ${id}, label, position
      FROM unnest(${input.options}::text[], ${positions}::int[]) AS t(label, position)
    `,
  ]);
  return id;
}

export type Viewer = { voterId: string | null; isAdmin: boolean };

export async function getPollDetail(id: string, viewer: Viewer): Promise<PollDetail | null> {
  await connection();
  if (!isPollId(id)) return null;

  const sql = getSql();
  const [polls, options, myVotes] = (await Promise.all([
    sql`SELECT id, question, status, created_at, closed_at FROM polls WHERE id = ${id}`,
    sql`SELECT id, label FROM options WHERE poll_id = ${id} ORDER BY position`,
    sql`SELECT option_id FROM votes WHERE poll_id = ${id} AND voter_id = ${viewer.voterId}`,
  ])) as [PollRow[], PollOption[], { option_id: string }[]];

  const poll = polls[0];
  if (!poll) return null;

  const myOptionId = myVotes[0]?.option_id ?? null;
  return {
    id: poll.id,
    question: poll.question,
    status: poll.status,
    createdAt: toIso(poll.created_at),
    closedAt: poll.closed_at ? toIso(poll.closed_at) : null,
    options,
    myOptionId,
    canViewResult: canViewResult({ status: poll.status, hasVoted: myOptionId !== null, isAdmin: viewer.isAdmin }),
    isAdmin: viewer.isAdmin,
  };
}

// 표를 저장한다. "진행 중인 투표의, 그 투표에 속한 선택지"일 때만 같은 쿼리 안에서 저장하고,
// 같은 브라우저의 두 번째 표는 (poll_id, voter_id) 유니크 제약으로 버려진다.
// 투표 행에 FOR SHARE 잠금을 걸어, 동시에 마감이 커밋되면 그 뒤의 상태로 다시 확인한다(마감 이후의 표 방지).
// 저장했으면 true, 조건에 걸려 저장하지 않았으면 false.
export async function castVote(pollId: string, optionId: string, voterId: string): Promise<boolean> {
  if (!isPollId(pollId) || !isPollId(optionId)) return false;
  const sql = getSql();
  const rows = await sql`
    INSERT INTO votes (poll_id, option_id, voter_id)
    SELECT o.poll_id, o.id, ${voterId}
    FROM options o
    JOIN polls p ON p.id = o.poll_id
    WHERE o.id = ${optionId} AND o.poll_id = ${pollId} AND p.status = 'open'
    FOR SHARE OF p
    ON CONFLICT (poll_id, voter_id) DO NOTHING
    RETURNING id
  `;
  return rows.length > 0;
}

// 공개 여부는 호출하는 쪽에서 poll.canViewResult로 먼저 확인한다.
export async function getResult(poll: PollDetail): Promise<Result> {
  const sql = getSql();
  const rows = (await sql`
    SELECT option_id, count(*)::int AS votes FROM votes WHERE poll_id = ${poll.id} GROUP BY option_id
  `) as { option_id: string; votes: number }[];

  const votesByOption = Object.fromEntries(rows.map((r) => [r.option_id, r.votes]));
  return {
    pollId: poll.id,
    status: poll.status,
    ...tallyResult(poll.options, votesByOption),
    myOptionId: poll.myOptionId,
  };
}

// 진행 중인 투표만 마감한다. 마감된 투표를 다시 진행 중으로 바꾸는 함수는 없다.
export async function closePoll(id: string): Promise<"closed" | "already_closed" | "not_found"> {
  if (!isPollId(id)) return "not_found";
  const sql = getSql();
  const closed = await sql`
    UPDATE polls SET status = 'closed', closed_at = now()
    WHERE id = ${id} AND status = 'open'
    RETURNING id
  `;
  if (closed.length > 0) return "closed";

  const existing = await sql`SELECT 1 FROM polls WHERE id = ${id}`;
  return existing.length > 0 ? "already_closed" : "not_found";
}
