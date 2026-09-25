"use client";

import { useState, type FormEvent } from "react";

export function EntryForm({ next }: { next: string }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (response.ok) {
        // 전체 페이지 이동으로 새 쿠키를 가진 요청이 proxy를 다시 거치게 한다
        window.location.assign(next);
        return;
      }

      const body = await response.json().catch(() => null);
      setError(body?.message ?? "입장하지 못했어요. 잠시 후 다시 시도해 주세요.");
    } catch {
      setError("입장하지 못했어요. 네트워크를 확인해 주세요.");
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
      <label htmlFor="password" className="text-sm font-medium">
        입장 비밀번호
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "password-error" : undefined}
        className="rounded-xl border border-line bg-background px-4 py-3 text-base"
      />
      {error && (
        <p id="password-error" role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-accent px-4 py-3 font-semibold text-background disabled:opacity-60"
      >
        {submitting ? "확인 중…" : "입장하기"}
      </button>
    </form>
  );
}
