import { connection } from "next/server";
import { getSql } from "./db";
import {
  canViewResult,
  effectiveClosedAt,
  effectiveStatus,
  groupPollsByStatus,
  tallyResult,
  type PollDetail,
  type PollInput,
  type PollList,
  type PollOption,
  type PollStatus,
  type Result,
  type Viewer,
} from "./poll-rules";

// DB 행. status는 저장된 상태 값(관리자가 마감했는지)일 뿐이고, 실제 상태는 pollState로 계산한다.
// closes_at(마감 시각)과 closed_at(관리자가 마감한 시각)은 다른 열이다.
type PollRow = {
  id: string;
  question: string;
  status: PollStatus;
  created_at: Date;
  closed_at: Date | null;
  closes_at: Date | null;
};

const toIso = (date: Date) => new Date(date).toISOString();

// 저장된 값과 현재 시각으로 실제 상태, 실제 마감된 시각, 마감 시각을 계산한다.
function pollState(row: PollRow, now: number) {
  const stored = {
    storedStatus: row.status,
    deadline: row.closes_at ? toIso(row.closes_at) : null,
    closedAt: row.closed_at ? toIso(row.closed_at) : null,
  };
  return {
    status: effectiveStatus(stored, now),
    closedAt: effectiveClosedAt(stored, now),
    deadline: stored.deadline,
  };
}

// 투표·선택지 id는 uuid다. 형식이 다르면 DB가 오류를 내므로 미리 걸러 "없는 것"으로 처리한다.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (id: string) => UUID.test(id);

// voterId가 없으면(아직 브라우저 식별 쿠키가 없으면) 모든 투표가 hasVoted: false다.
export async function listPolls(voterId: string | null): Promise<PollList> {
  // 빌드 시점에 미리 렌더링하지 않고 요청마다 DB에서 새로 읽는다
  await connection();
  const sql = getSql();
  const rows = (await sql`
    SELECT p.id, p.question, p.status, p.created_at, p.closed_at, p.closes_at,
           EXISTS (
             SELECT 1 FROM votes v WHERE v.poll_id = p.id AND v.voter_id = ${voterId}
           ) AS has_voted
    FROM polls p
  `) as (PollRow & { has_voted: boolean })[];

  const now = Date.now();
  return groupPollsByStatus(
    rows.map((r) => ({
      id: r.id,
      question: r.question,
      ...pollState(r, now),
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

export async function getPollDetail(id: string, viewer: Viewer): Promise<PollDetail | null> {
  await connection();
  if (!isUuid(id)) return null;

  const sql = getSql();
  const [polls, options, myVotes] = (await Promise.all([
    sql`SELECT id, question, status, created_at, closed_at, closes_at FROM polls WHERE id = ${id}`,
    sql`SELECT id, label FROM options WHERE poll_id = ${id} ORDER BY position`,
    sql`SELECT option_id FROM votes WHERE poll_id = ${id} AND voter_id = ${viewer.voterId}`,
  ])) as [PollRow[], PollOption[], { option_id: string }[]];

  const poll = polls[0];
  if (!poll) return null;

  const myOptionId = myVotes[0]?.option_id ?? null;
  const { status, closedAt, deadline } = pollState(poll, Date.now());
  return {
    id: poll.id,
    question: poll.question,
    status,
    createdAt: toIso(poll.created_at),
    deadline,
    closedAt,
    options,
    myOptionId,
    canViewResult: canViewResult({ status, hasVoted: myOptionId !== null, isAdmin: viewer.isAdmin }),
    isAdmin: viewer.isAdmin,
  };
}

// 표를 저장한다. "진행 중인(관리자가 마감하지 않았고 마감 시각 전인) 투표의, 그 투표에 속한 선택지"일 때만
// 같은 쿼리 안에서 저장하고,
// 같은 브라우저의 두 번째 표는 (poll_id, voter_id) 유니크 제약으로 버려진다.
// 투표 행에 FOR SHARE 잠금을 걸어, 동시에 마감이 커밋되면 그 뒤의 상태로 다시 확인한다(마감 이후의 표 방지).
// 저장했으면 true, 조건에 걸려 저장하지 않았으면 false.
export async function castVote(pollId: string, optionId: string, voterId: string): Promise<boolean> {
  if (!isUuid(pollId) || !isUuid(optionId)) return false;
  const sql = getSql();
  const rows = await sql`
    INSERT INTO votes (poll_id, option_id, voter_id)
    SELECT o.poll_id, o.id, ${voterId}
    FROM options o
    JOIN polls p ON p.id = o.poll_id
    WHERE o.id = ${optionId} AND o.poll_id = ${pollId}
      AND p.status = 'open' AND (p.closes_at IS NULL OR p.closes_at > now())
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

// 진행 중인 투표만 마감한다. 마감 시각이 이미 지났으면 이미 마감된 투표다.
// 마감된 투표를 다시 진행 중으로 바꾸는 함수는 없다.
export async function closePoll(id: string): Promise<"closed" | "already_closed" | "not_found"> {
  if (!isUuid(id)) return "not_found";
  const sql = getSql();
  const closed = await sql`
    UPDATE polls SET status = 'closed', closed_at = now()
    WHERE id = ${id} AND status = 'open' AND (closes_at IS NULL OR closes_at > now())
    RETURNING id
  `;
  if (closed.length > 0) return "closed";

  const existing = await sql`SELECT 1 FROM polls WHERE id = ${id}`;
  return existing.length > 0 ? "already_closed" : "not_found";
}

// 투표를 완전히 삭제한다. 선택지와 표는 연쇄 삭제된다. 삭제했으면 true, 없던 투표면 false.
export async function deletePoll(id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  const sql = getSql();
  const rows = await sql`DELETE FROM polls WHERE id = ${id} RETURNING id`;
  return rows.length > 0;
}
