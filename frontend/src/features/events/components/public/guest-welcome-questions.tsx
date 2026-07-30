"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { eventsService } from "@/features/events/services/events.service";
import type { PublicEvent } from "@/features/events/types/events";
import { guestSessionKey } from "./event-entry";

interface GuestSession {
  token: string;
  name: string;
}

interface PublicQuiz {
  enabled: boolean;
  title: string;
  questions: Array<{ prompt: string; options: string[] }>;
}

export function GuestWelcomeQuestions({ publicId }: { publicId: string }) {
  const router = useRouter();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [session, setSession] = useState<GuestSession | null>(null);
  const [quiz, setQuiz] = useState<PublicQuiz | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [result, setResult] = useState<{ score: number; total: number } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const rawSession = sessionStorage.getItem(guestSessionKey(publicId));
    if (!rawSession) {
      router.replace(`/event/${publicId}`);
      return;
    }
    let parsed: GuestSession;
    try {
      parsed = JSON.parse(rawSession) as GuestSession;
      if (!parsed.token || !parsed.name) throw new Error("Invalid session");
      queueMicrotask(() => setSession(parsed));
    } catch {
      sessionStorage.removeItem(guestSessionKey(publicId));
      router.replace(`/event/${publicId}`);
      return;
    }

    const controller = new AbortController();
    void Promise.all([
      eventsService.getPublicEvent(publicId, controller.signal),
      eventsService
        .getPublicQuizResponse(publicId, parsed.token)
        .then(async (response) => {
          if (!response.ok) throw new Error();
          return response.json() as Promise<PublicQuiz>;
        }),
    ])
      .then(([loadedEvent, loadedQuiz]) => {
        setEvent(loadedEvent);
        setQuiz(loadedQuiz);
        if (!loadedQuiz.enabled) router.replace(`/event/${publicId}/upload`);
      })
      .catch(() => setError("Quiz-ът не може да бъде зареден."));
    return () => controller.abort();
  }, [publicId, router]);

  async function continueQuiz() {
    if (selected === null || !quiz || !session) return;
    const nextAnswers = [...answers, selected];
    if (questionIndex < quiz.questions.length - 1) {
      setAnswers(nextAnswers);
      setSelected(null);
      setQuestionIndex((current) => current + 1);
      return;
    }

    setSubmitting(true);
    const response = await eventsService.submitQuizAttemptResponse(
      publicId,
      session.token,
      nextAnswers,
    );
    setSubmitting(false);
    if (!response.ok) {
      setError("Резултатът не може да бъде изчислен.");
      return;
    }
    setResult((await response.json()) as { score: number; total: number });
  }

  const theme = getTheme(event?.themeColor);
  if (!session || !event || !quiz || !quiz.enabled) {
    return (
      <main className="page-canvas grid min-h-screen place-items-center">
        {error ? (
          <p className="surface-card rounded-2xl p-6 text-red-700">{error}</p>
        ) : (
          <span
            className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent"
            style={{
              borderColor: `${theme.accent}55`,
              borderTopColor: theme.primary,
            }}
          />
        )}
      </main>
    );
  }

  const question = quiz.questions[questionIndex];
  const progress = result
    ? 100
    : ((questionIndex + 1) / quiz.questions.length) * 100;

  return (
    <main
      className="grid min-h-screen place-items-center overflow-hidden px-4 py-10"
      style={{
        color: theme.primary,
        background: `radial-gradient(circle at 15% 15%, ${theme.accent}35, transparent 35%), linear-gradient(145deg, #ffffff, ${theme.accent}20)`,
      }}
    >
      <section className="surface-card reveal-up relative w-full max-w-2xl overflow-hidden rounded-[2.25rem] p-7 sm:p-11">
        <div
          className="absolute top-0 left-0 h-1.5 transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: theme.accent }}
        />

        {result ? (
          <div className="py-6 text-center">
            <span
              className="mx-auto grid h-16 w-16 place-items-center rounded-full text-2xl text-white"
              style={{ backgroundColor: theme.accent }}
            >
              ✦
            </span>
            <p
              className="mt-7 text-xs font-bold tracking-[0.18em] uppercase"
              style={{ color: theme.accent }}
            >
              Твоят резултат
            </p>
            <h1 className="mt-3 text-5xl font-semibold tracking-[-0.06em]">
              {result.score} / {result.total}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 opacity-65">
              {resultMessage(result.score, result.total)}
            </p>
            <button
              onClick={() => router.replace(`/event/${publicId}/upload`)}
              className="mt-8 rounded-full px-8 py-4 text-sm font-bold text-white"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
              }}
            >
              Към снимките →
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-bold tracking-[0.18em] uppercase"
                style={{ color: theme.accent }}
              >
                {quiz.title}
              </span>
              <span className="text-xs font-semibold opacity-50">
                {questionIndex + 1} / {quiz.questions.length}
              </span>
            </div>
            <p className="mt-8 text-sm font-medium opacity-55">
              Здравей, {session.name}!
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              {question.prompt}
            </h1>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {question.options.map((option, optionIndex) => (
                <button
                  key={optionIndex}
                  type="button"
                  onClick={() => setSelected(optionIndex)}
                  className="rounded-2xl border p-5 text-left text-sm font-bold transition hover:-translate-y-0.5"
                  style={{
                    borderColor:
                      selected === optionIndex
                        ? theme.accent
                        : `${theme.primary}20`,
                    backgroundColor:
                      selected === optionIndex
                        ? `${theme.accent}22`
                        : "#ffffffaa",
                  }}
                >
                  <span className="mr-3 opacity-40">
                    {String.fromCharCode(65 + optionIndex)}.
                  </span>
                  {option}
                </button>
              ))}
            </div>
            {error && (
              <p className="mt-4 text-sm font-semibold text-red-700">{error}</p>
            )}
            <button
              type="button"
              onClick={() => void continueQuiz()}
              disabled={selected === null || submitting}
              className="mt-7 w-full rounded-full px-8 py-4 text-sm font-bold text-white disabled:opacity-40"
              style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
              }}
            >
              {submitting
                ? "Изчисляване…"
                : questionIndex === quiz.questions.length - 1
                  ? "Виж резултата"
                  : "Следващ въпрос →"}
            </button>
          </>
        )}
      </section>
    </main>
  );
}

function resultMessage(score: number, total: number) {
  const percent = total ? score / total : 0;
  if (percent === 1)
    return "Истински вътрешен човек! Познаваш домакините до последния детайл.";
  if (percent >= 0.6)
    return "Почти част от семейството — страхотно представяне!";
  return "Днес ще научиш още много за тях. Най-хубавите моменти тепърва започват!";
}

const THEMES: Record<string, { primary: string; accent: string }> = {
  ocean: { primary: "#173b57", accent: "#5aa9d6" },
  rose: { primary: "#6d3044", accent: "#d8899e" },
  sage: { primary: "#354f42", accent: "#8eaa96" },
  lavender: { primary: "#493d6b", accent: "#a99bd4" },
  terracotta: { primary: "#6d382b", accent: "#c8795d" },
  midnight: { primary: "#171b2e", accent: "#59658f" },
};

function getTheme(theme: string | undefined) {
  return THEMES[theme ?? "ocean"] ?? THEMES.ocean;
}
