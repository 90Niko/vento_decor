"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { eventsService } from "@/features/events/services/events.service";
import type { PublicEvent } from "@/features/events/types/events";
import { clearGuestSession, readGuestSession } from "./event-entry";
import { getEventTheme } from "@/features/events/lib/event-theme";

interface GuestSession {
  token: string;
  name: string;
}

interface PublicQuiz {
  enabled: boolean;
  hasCorrectAnswers: boolean;
  completed: boolean;
  title: string;
  questions: Array<{
    prompt: string;
    options: string[];
    correctOption?: number;
  }>;
}

export function GuestWelcomeQuestions({
  publicId,
  adminPreview = false,
}: {
  publicId: string;
  adminPreview?: boolean;
}) {
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
    if (adminPreview) {
      const controller = new AbortController();
      void Promise.all([
        eventsService.getAdminEventResponse(publicId, controller.signal),
        eventsService.getManagerQuizResponse(publicId),
      ])
        .then(async ([eventResponse, quizResponse]) => {
          if (!eventResponse.ok || !quizResponse.ok) throw new Error();
          const loadedEvent = (await eventResponse.json()) as PublicEvent;
          const loadedQuiz = (await quizResponse.json()) as PublicQuiz;
          if (loadedQuiz.questions.length === 0) {
            throw new Error("Този quiz все още няма въпроси.");
          }
          setSession({ token: "preview", name: "Гост" });
          setEvent(loadedEvent);
          setQuiz({ ...loadedQuiz, completed: false });
        })
        .catch((previewError) =>
          setError(
            previewError instanceof Error && previewError.message
              ? previewError.message
              : "Quiz preview-то не може да бъде заредено.",
          ),
        );
      return () => controller.abort();
    }

    const rawSession = readGuestSession(publicId);
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
      clearGuestSession(publicId);
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
        if (!loadedQuiz.enabled || loadedQuiz.completed) {
          router.replace(`/event/${publicId}/upload`);
        }
      })
      .catch(() => setError("Quiz-ът не може да бъде зареден."));
    return () => controller.abort();
  }, [adminPreview, publicId, router]);

  async function continueQuiz() {
    if (selected === null || !quiz || !session) return;
    const nextAnswers = [...answers, selected];
    if (questionIndex < quiz.questions.length - 1) {
      setAnswers(nextAnswers);
      setSelected(null);
      setQuestionIndex((current) => current + 1);
      return;
    }

    if (adminPreview) {
      const score = quiz.hasCorrectAnswers
        ? quiz.questions.reduce(
            (total, item, index) =>
              total + (item.correctOption === nextAnswers[index] ? 1 : 0),
            0,
          )
        : 0;
      setResult({ score, total: quiz.questions.length });
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

  const theme = getEventTheme(event?.themeColor);
  if (
    !session ||
    !event ||
    !quiz ||
    (!adminPreview && (!quiz.enabled || quiz.completed))
  ) {
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
    : (questionIndex / quiz.questions.length) * 100;

  return (
    <main
      className="guest-flow-page grid min-h-screen place-items-center overflow-hidden px-4 py-0 sm:py-10"
      style={{
        color: theme.primary,
        background: `radial-gradient(circle at 15% 15%, ${theme.accent}35, transparent 35%), linear-gradient(145deg, #ffffff, ${theme.accent}20)`,
      }}
    >
      <section className="quiz-question-container surface-card reveal-up relative flex h-dvh w-full max-w-2xl flex-col overflow-hidden rounded-[2.25rem] p-7 sm:h-auto sm:max-h-[calc(100dvh-5rem)] sm:p-11">
        <div className="relative z-20 -mx-7 -mt-7 h-7 shrink-0 sm:-mx-11 sm:-mt-11">
          <div
            className="absolute inset-x-0 top-0 h-1 transition-all duration-500"
            style={{
              background: `linear-gradient(to right, ${theme.accent} ${progress}%, transparent ${progress}%)`,
            }}
          />
          <span className="relative flex h-full items-center justify-end px-4 text-[11px] font-bold tabular-nums opacity-60 sm:px-6">
            {result ? quiz.questions.length : questionIndex + 1} / {quiz.questions.length}
          </span>
        </div>

        {result ? (
          <div className="min-h-0 flex-1 overflow-y-auto py-6 text-center">
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
              {quiz.hasCorrectAnswers ? "Твоят резултат" : "Благодарим за отговорите"}
            </p>
            {quiz.hasCorrectAnswers && <h1 className="mt-3 text-5xl font-semibold tracking-[-0.06em]">
              {result.score} / {result.total}
            </h1>}
            <p className="mx-auto mt-4 max-w-md text-sm leading-6 opacity-65">
              {quiz.hasCorrectAnswers
                ? resultMessage(result.score, result.total)
                : "Можеш да сравниш избора си с отговорите на останалите гости."}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              {adminPreview ? (
                <button
                  onClick={() => {
                    setQuestionIndex(0);
                    setAnswers([]);
                    setSelected(null);
                    setResult(null);
                  }}
                  className="primary-button-effect min-h-14 w-full max-w-md self-center rounded-full px-8 py-4 text-sm font-bold text-white sm:w-auto sm:max-w-none"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                  }}
                >
                  Прегледай отново
                </button>
              ) : (
                <button
                  onClick={() => router.push(`/event/${publicId}/quiz-review`)}
                  className="primary-button-effect min-h-14 w-full max-w-md self-center rounded-full px-8 py-4 text-sm font-bold text-white sm:w-auto sm:max-w-none"
                  style={{
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                  }}
                >
                  Преглед на отговорите
                </button>
              )}
              <button
                onClick={() =>
                  adminPreview
                    ? router.back()
                    : router.replace(`/event/${publicId}/upload`)
                }
                className="min-h-14 w-full max-w-md self-center rounded-full border border-black/10 bg-white/70 px-8 py-4 text-sm font-bold sm:w-auto sm:max-w-none"
              >
                {adminPreview ? "Назад към събитието" : "Към снимките →"}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto pt-1">
              <div className="flex items-center">
                <span
                  className="text-xs font-bold tracking-[0.18em] uppercase"
                  style={{ color: theme.accent }}
                >
                  {quiz.title}
                </span>
              </div>
              <p className="mt-8 text-sm font-medium opacity-55">
                Здравей, {session.name}!
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
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
            </div>
            <div className="z-20 -mx-7 -mb-7 mt-3 shrink-0 px-7 pt-3 pb-0 sm:-mx-11 sm:-mb-11 sm:px-11 sm:pb-6">
              <button
                type="button"
                onClick={() => void continueQuiz()}
                disabled={selected === null || submitting}
                className="primary-button-effect mx-auto min-h-14 w-full max-w-md rounded-full px-8 py-4 text-sm font-bold text-white sm:max-w-none disabled:opacity-40"
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
            </div>
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
