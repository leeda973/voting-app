// 환경변수와 쿠키를 세션 로직(session.ts)에 연결한다.
import { cookies } from "next/headers";
import { createSessionToken, passwordsMatch, type SessionKeys, verifySessionToken } from "./session";

export const ENTRY_COOKIE = "entry_session";
const VOTER_COOKIE = "voter_id";

const DAY_SECONDS = 24 * 60 * 60;
const ENTRY_MAX_AGE_SECONDS = 30 * DAY_SECONDS;
const VOTER_MAX_AGE_SECONDS = 365 * DAY_SECONDS;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

function entryKeys(): SessionKeys {
  return { secret: requireEnv("SESSION_SECRET"), password: requireEnv("ENTRY_PASSWORD") };
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

export function hasEntrySession(token: string | undefined): Promise<boolean> {
  return verifySessionToken(token, "entry", entryKeys(), Date.now());
}

export function isEntryPassword(input: string): Promise<boolean> {
  return passwordsMatch(input, requireEnv("ENTRY_PASSWORD"));
}

// 입장 세션 쿠키(30일)를 발급하고, 브라우저 식별 쿠키(1년)가 없으면 함께 발급한다.
// 식별 쿠키는 입장 세션과 따로 유지되어야 하므로 이미 있으면 건드리지 않는다.
export async function startEntrySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = await createSessionToken("entry", entryKeys(), Date.now() + ENTRY_MAX_AGE_SECONDS * 1000);
  cookieStore.set(ENTRY_COOKIE, token, cookieOptions(ENTRY_MAX_AGE_SECONDS));

  if (!cookieStore.get(VOTER_COOKIE)) {
    cookieStore.set(VOTER_COOKIE, crypto.randomUUID(), cookieOptions(VOTER_MAX_AGE_SECONDS));
  }
}

export async function currentVoterId(): Promise<string | null> {
  return (await cookies()).get(VOTER_COOKIE)?.value ?? null;
}
