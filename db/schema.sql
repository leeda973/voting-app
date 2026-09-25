-- 투표 앱 스키마. 여러 번 적용해도 안전하다(IF NOT EXISTS).
-- 적용 방법은 README의 "데이터베이스 스키마 적용"을 참고한다.

-- 투표(Poll): 질문 하나와 상태
CREATE TABLE IF NOT EXISTS polls (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  question   text        NOT NULL CHECK (char_length(question) BETWEEN 1 AND 100),
  status     text        NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at  timestamptz,
  -- 마감 시각은 마감된 투표에만 있다
  CHECK ((status = 'closed') = (closed_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS polls_created_at_idx ON polls (created_at DESC);

-- 선택지(Option): 한 투표에 속한 답 하나
CREATE TABLE IF NOT EXISTS options (
  id       uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id  uuid    NOT NULL REFERENCES polls (id) ON DELETE CASCADE,
  label    text    NOT NULL CHECK (char_length(label) BETWEEN 1 AND 50),
  position integer NOT NULL CHECK (position BETWEEN 0 AND 9),
  UNIQUE (poll_id, label),
  UNIQUE (poll_id, position),
  -- 표가 같은 투표의 선택지만 가리키도록 복합 FK의 대상이 된다
  UNIQUE (id, poll_id)
);

-- 표(Vote): 한 투표자(브라우저)가 한 투표에서 고른 선택지
CREATE TABLE IF NOT EXISTS votes (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id    uuid        NOT NULL REFERENCES polls (id) ON DELETE CASCADE,
  option_id  uuid        NOT NULL,
  voter_id   text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (option_id, poll_id) REFERENCES options (id, poll_id) ON DELETE CASCADE,
  -- 1인 1표의 최종 보장
  UNIQUE (poll_id, voter_id)
);
