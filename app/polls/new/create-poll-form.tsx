"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  MAX_OPTIONS,
  MIN_OPTIONS,
  OPTION_MAX_LENGTH,
  QUESTION_MAX_LENGTH,
  type PollInputErrors,
} from "@/lib/poll-rules";

export function CreatePollForm() {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [errors, setErrors] = useState<PollInputErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((option, i) => (i === index ? value : option)));
  }

  function removeOption(index: number) {
    setOptions((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => ({ ...prev, optionItems: prev.optionItems?.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setFormError(null);

    try {
      const response = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, options }),
      });
      const body = await response.json().catch(() => null);

      if (response.ok) {
        router.push(`/polls/${body.id}`);
        return;
      }
      if (response.status === 400 && body?.fields) setErrors(body.fields);
      else setFormError(body?.message ?? "투표를 만들지 못했어요. 잠시 후 다시 시도해 주세요.");
    } catch {
      setFormError("투표를 만들지 못했어요. 네트워크를 확인해 주세요.");
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6" noValidate>
      <div className="flex flex-col gap-2">
        <label htmlFor="question" className="text-sm font-medium">
          질문
        </label>
        <input
          id="question"
          value={question}
          maxLength={QUESTION_MAX_LENGTH}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="예: 이번 회식 메뉴는?"
          aria-invalid={errors.question ? true : undefined}
          aria-describedby={errors.question ? "question-error" : undefined}
          className="rounded-xl border border-line bg-background px-4 py-3 text-base"
        />
        <FieldError id="question-error" message={errors.question} />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-medium">
          선택지 ({MIN_OPTIONS}~{MAX_OPTIONS}개)
        </legend>
        {options.map((option, i) => {
          const error = errors.optionItems?.[i];
          return (
            <div key={i} className="flex flex-col gap-1">
              <div className="flex gap-2">
                <input
                  aria-label={`선택지 ${i + 1}`}
                  value={option}
                  maxLength={OPTION_MAX_LENGTH}
                  onChange={(e) => updateOption(i, e.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `option-${i}-error` : undefined}
                  className="min-w-0 flex-1 rounded-xl border border-line bg-background px-4 py-3 text-base"
                />
                <button
                  type="button"
                  onClick={() => removeOption(i)}
                  disabled={options.length <= MIN_OPTIONS}
                  aria-label={`선택지 ${i + 1} 지우기`}
                  className="shrink-0 rounded-xl border border-line px-3 text-muted disabled:opacity-40"
                >
                  지우기
                </button>
              </div>
              <FieldError id={`option-${i}-error`} message={error ?? undefined} />
            </div>
          );
        })}
        <FieldError id="options-error" message={errors.options} />
        <button
          type="button"
          onClick={() => setOptions((prev) => [...prev, ""])}
          disabled={options.length >= MAX_OPTIONS}
          className="mt-1 rounded-xl border border-dashed border-line px-4 py-3 text-muted disabled:opacity-40"
        >
          + 선택지 추가
        </button>
      </fieldset>

      {formError && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {formError}
        </p>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-accent px-4 py-3 font-semibold text-background disabled:opacity-60"
      >
        {submitting ? "만드는 중…" : "투표 만들기"}
      </button>
    </form>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}
