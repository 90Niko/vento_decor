"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { eventsService } from "@/features/events/services/events.service";
import { getEventTheme } from "@/features/events/lib/event-theme";
import type { PublicEvent } from "@/features/events/types/events";
import { clearGuestSession, readGuestSession } from "./event-entry";

interface QuizReview {
  title: string;
  score: number;
  total: number;
  percentage: number;
  hasCorrectAnswers: boolean;
  completedAt: string;
  questions: Array<{
    prompt: string;
    options: string[];
    optionPercentages: number[];
    selectedOption: number | null;
    correctOption: number;
    isCorrect: boolean;
  }>;
}

export function GuestQuizReviewPage({ publicId }: { publicId: string }) {
  const router = useRouter();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [review, setReview] = useState<QuizReview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = readGuestSession(publicId);
    if (!stored) {
      router.replace(`/event/${publicId}`);
      return;
    }

    let token: string;
    try {
      const parsed = JSON.parse(stored) as { token?: unknown };
      if (typeof parsed.token !== "string") throw new Error();
      token = parsed.token;
    } catch {
      clearGuestSession(publicId);
      router.replace(`/event/${publicId}`);
      return;
    }

    const controller = new AbortController();
    void Promise.all([
      eventsService.getPublicEvent(publicId, controller.signal),
      eventsService.getQuizReviewResponse(publicId, token),
    ])
      .then(async ([loadedEvent, response]) => {
        if (response.status === 401) {
          clearGuestSession(publicId);
          router.replace(`/event/${publicId}`);
          return;
        }
        if (response.status === 404) {
          router.replace(`/event/${publicId}/upload`);
          return;
        }
        if (!response.ok) throw new Error("Резултатът не може да бъде зареден.");
        setEvent(loadedEvent);
        setReview((await response.json()) as QuizReview);
      })
      .catch((requestError) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError(requestError instanceof Error ? requestError.message : "Възникна неочаквана грешка.");
      });
    return () => controller.abort();
  }, [publicId, router]);

  const theme = getEventTheme(event?.themeColor);
  if (!event || !review) {
    return (
      <main className="page-canvas grid min-h-screen place-items-center px-5 text-[#173b57]">
        {error ? <p className="text-center font-medium text-red-700">{error}</p> : <span className="h-10 w-10 animate-spin rounded-full border-2 border-t-transparent" />}
      </main>
    );
  }

  return (
    <main
      className="guest-flow-page min-h-screen px-4 py-8"
      style={{
        color: theme.primary,
        background: `linear-gradient(145deg, #ffffff, ${theme.accent}20)`,
      }}
    >
      <div className="quiz-review-container app-grid-container mx-auto max-w-3xl">
        <section className="quiz-review-flat surface-card p-6 sm:rounded-[2rem] sm:p-10">
          <p className="text-xs font-bold tracking-[0.18em] uppercase" style={{ color: theme.accent }}>
            Твоят quiz резултат
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-5xl">{review.title}</h1>
          {review.hasCorrectAnswers ? <div className="mt-8 flex items-end gap-4">
            <span className="text-7xl font-semibold tracking-[-0.08em] sm:text-8xl">{review.percentage}%</span>
            <span className="pb-2 text-sm font-semibold opacity-55">{review.score} от {review.total} верни</span>
          </div> : <p className="mt-6 text-sm font-semibold opacity-60">Виж как са отговорили всички гости.</p>}
        </section>

        <div className="mt-6 space-y-4">
          {review.questions.map((question, index) => (
            <article key={`${question.prompt}-${index}`} className="quiz-review-flat surface-card p-5 sm:rounded-2xl sm:p-7">
              <h2 className="font-semibold">{index + 1}. {question.prompt}</h2>
              <div className="mt-5 space-y-2">
                {question.options.map((option, optionIndex) => {
                  const isCorrect = review.hasCorrectAnswers && optionIndex === question.correctOption;
                  const isSelected = optionIndex === question.selectedOption;
                  return (
                    <div
                      key={`${option}-${optionIndex}`}
                      className={`quiz-review-option rounded-xl border px-4 py-3 text-sm ${isCorrect ? "border-emerald-300 bg-emerald-50 text-emerald-800" : isSelected ? "border-sky-300 bg-sky-50 text-sky-800" : "border-black/8 bg-white/45 opacity-60"}`}
                    >
                      <span className="flex items-center justify-between gap-4">
                        <span>{option}</span>
                        <span className="shrink-0 font-semibold tabular-nums">
                          {question.optionPercentages[optionIndex] ?? 0}%
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>

        <button
          type="button"
          onClick={() => router.replace(`/event/${publicId}/upload`)}
          className="primary-button-effect mx-auto mt-7 flex min-h-14 w-[calc(100%-3rem)] max-w-md rounded-full px-8 py-4 text-sm font-bold text-white sm:w-full sm:max-w-none"
          style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}
        >
          Към снимките →
        </button>
      </div>
    </main>
  );
}
