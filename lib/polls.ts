import { connection } from "next/server";
import { getSql } from "./db";
import {
  groupPollsByStatus,
  type PollDetail,
  type PollInput,
  type PollList,
  type PollOption,
  type PollStatus,
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

  return {
    id: poll.id,
    question: poll.question,
    status: poll.status,
    createdAt: toIso(poll.created_at),
    closedAt: poll.closed_at ? toIso(poll.closed_at) : null,
    options,
    myOptionId: myVotes[0]?.option_id ?? null,
    canViewResult: false, // 결과 공개 규칙은 티켓 06에서 붙인다
    isAdmin: viewer.isAdmin,
  };
}
