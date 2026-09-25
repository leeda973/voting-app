import { connection } from "next/server";
import { getSql } from "./db";
import { groupPollsByStatus, type PollList, type PollStatus } from "./poll-rules";

type PollRow = {
  id: string;
  question: string;
  status: PollStatus;
  created_at: Date;
  has_voted: boolean;
};

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
  `) as PollRow[];

  return groupPollsByStatus(
    rows.map((r) => ({
      id: r.id,
      question: r.question,
      status: r.status,
      createdAt: new Date(r.created_at).toISOString(),
      hasVoted: r.has_voted,
    })),
  );
}
