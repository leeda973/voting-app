// 환경변수와 쿠키를 세션 로직(session.ts)에 연결한다.
import { cookies } from "next/headers";
import {
  createSessionToken,
  passwordsMatch,
  type SessionKeys,
  type SessionKind,
  verifySessionToken,
} from "./session";

export const ENTRY_COOKIE = "entry_session";
export const ADMIN_COOKIE = "admin_session";
const VOTER_COOKIE = "voter_id";

const DAY_SECONDS = 24 * 60 * 60;
const VOTER_MAX_AGE_SECONDS = 365 * DAY_SECONDS;

const SESSIONS = {
  entry: { cookie: ENTRY_COOKIE, passwordEnv: "ENTRY_PASSWORD", maxAgeSeconds: 30 * DAY_SECONDS },
  admin: { cookie: ADMIN_COOKIE, passwordEnv: "ADMIN_PASSWORD", maxAgeSeconds: DAY_SECONDS },
} as const;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function sessionKeys(kind: SessionKind): SessionKeys {
  return { secret: requireEnv("SESSION_SECRET"), password: requireEnv(SESSIONS[kind].passwordEnv) };
}

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

function hasSession(kind: SessionKind, token: string | undefined): Promise<boolean> {
  return verifySessionToken(token, kind, sessionKeys(kind), Date.now());
}

export function hasAdminSession(token: string | undefined): Promise<boolean> {
  return hasSession("admin", token);
}

// 관리자 세션이 유효하면 입장 세션도 유효한 것으로 본다.
export async function hasAppAccess(
  entryToken: string | undefined,
  adminToken: string | undefined,
): Promise<boolean> {
  return (await hasSession("entry", entryToken)) || (await hasAdminSession(adminToken));
}

export function isSessionPassword(kind: SessionKind, input: string): Promise<boolean> {
  return passwordsMatch(input, requireEnv(SESSIONS[kind].passwordEnv));
}

// 세션 쿠키를 발급하고, 브라우저 식별 쿠키(1년)가 없으면 함께 발급한다.
// 식별 쿠키는 세션과 따로 유지되어야 하므로 이미 있으면 건드리지 않는다.
export async function startSession(kind: SessionKind): Promise<void> {
  const { cookie, maxAgeSeconds } = SESSIONS[kind];
  const cookieStore = await cookies();
  const token = await createSessionToken(kind, sessionKeys(kind), Date.now() + maxAgeSeconds * 1000);
  cookieStore.set(cookie, token, cookieOptions(maxAgeSeconds));

  if (!cookieStore.get(VOTER_COOKIE)) {
    cookieStore.set(VOTER_COOKIE, crypto.randomUUID(), cookieOptions(VOTER_MAX_AGE_SECONDS));
  }
}

export async function endAdminSession(): Promise<void> {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin(): Promise<boolean> {
  return hasAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
}

// 관리자 전용 Route Handler 첫 줄에서 쓴다. 관리자가 아니면 403 응답을, 관리자면 null을 돌려준다.
export async function forbiddenUnlessAdmin(): Promise<Response | null> {
  if (await isAdmin()) return null;
  return Response.json({ error: "forbidden", message: "관리자만 할 수 있어요." }, { status: 403 });
}

export async function currentVoterId(): Promise<string | null> {
  return (await cookies()).get(VOTER_COOKIE)?.value ?? null;
}
