// 세션 토큰 서명/검증과 비밀번호 비교. 환경변수와 쿠키는 모른다.
// 토큰 형식: "<만료 시각 ms>.<서명>"
// 서명에 비밀번호를 넣으므로, 비밀번호를 바꾸면 기존 토큰이 모두 무효가 된다.

export type SessionKind = "entry" | "admin";

export type SessionKeys = {
  secret: string;
  password: string;
};

const encoder = new TextEncoder();

async function hmac(secret: string, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

async function sha256(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

function sign(kind: SessionKind, keys: SessionKeys, expiresAt: number) {
  return hmac(keys.secret, `${kind}\n${expiresAt}\n${keys.password}`);
}

export async function createSessionToken(
  kind: SessionKind,
  keys: SessionKeys,
  expiresAt: number,
): Promise<string> {
  const signature = await sign(kind, keys, expiresAt);
  return `${expiresAt}.${Buffer.from(signature).toString("base64url")}`;
}

export async function verifySessionToken(
  token: string | undefined,
  kind: SessionKind,
  keys: SessionKeys,
  now: number,
): Promise<boolean> {
  const match = token?.match(/^(\d+)\.([A-Za-z0-9_-]+)$/);
  if (!match) return false;

  const expiresAt = Number(match[1]);
  if (!Number.isSafeInteger(expiresAt) || now >= expiresAt) return false;

  const expected = await sign(kind, keys, expiresAt);
  return timingSafeEqual(Buffer.from(match[2], "base64url"), expected);
}

// 두 값을 같은 길이의 해시로 바꿔 비교하므로 길이나 내용으로 응답 시간이 달라지지 않는다.
export async function passwordsMatch(input: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all([sha256(input), sha256(expected)]);
  return timingSafeEqual(a, b);
}
