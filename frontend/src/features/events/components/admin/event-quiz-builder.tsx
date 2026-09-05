"use client";

import { useEffect, useState } from "react";
import { eventsService } from "@/features/events/services/events.service";
import { ToggleSwitch } from "@/shared/components/toggle-switch";

export interface QuizQuestion {
  prompt: string;
  options: string[];
  correctOption: number;
  optionPercentages?: number[];
}

export interface ManagerQuiz {
  enabled: boolean;
  hasCorrectAnswers: boolean;
  title: string;
  questions: QuizQuestion[];
  stats: { attempts: number; averagePercent: number };
}

export function EventQuizBuilder({
  publicId,
  hideSaveButton = false,
  onChange,
}: {
  publicId: string;
  hideSaveButton?: boolean;
  onChange?: (quiz: ManagerQuiz) => void;
}) {
  const [quiz, setQuiz] = useState<ManagerQuiz | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void eventsService
      .getManagerQuizResponse(publicId)
      .then(async (response) => {
        if (!response.ok) throw new Error();
        setQuiz((await response.json()) as ManagerQuiz);
      })
      .catch(() => setNotice("Quiz настройките не могат да бъдат заредени."));
  }, [publicId]);

  useEffect(() => {
    if (quiz) onChange?.(quiz);
  }, [quiz, onChange]);

  if (!quiz) {
    return (
      <section id="event-quiz" className="scroll-mt-24 border-t border-[#173b57]/12 px-0 py-8 sm:px-9 sm:py-9">
        <p className="text-sm text-[#173b57]/60">
          {notice ?? "Зареждане на quiz…"}
        </p>
      </section>
    );
  }

  function updateQuestion(index: number, update: Partial<QuizQuestion>) {
    setQuiz((current) =>
      current
        ? {
            ...current,
            questions: current.questions.map((question, questionIndex) =>
              questionIndex === index ? { ...question, ...update } : question,
            ),
          }
        : current,
    );
  }

  async function save() {
    if (!quiz) return;
    setSaving(true);
    setNotice(null);
    const response = await eventsService.updateManagerQuizResponse(publicId, {
      enabled: quiz.enabled,
      hasCorrectAnswers: quiz.hasCorrectAnswers,
      title: quiz.title,
      questions: quiz.questions,
    });
    setSaving(false);
    setNotice(
      response.ok ? "Quiz-ът е запазен." : "Quiz-ът не може да бъде запазен.",
    );
  }

  return (
    <section id="event-quiz" className="scroll-mt-24 border-t border-[#173b57]/12 px-0 py-8 sm:px-9 sm:py-9">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">Guest quiz</p>
          <h2 className="mt-2 text-2xl font-semibold">Quiz преди снимките</h2>
          <p className="mt-2 text-sm text-[#173b57]/55">
            {quiz.stats.attempts} участия
            {quiz.hasCorrectAnswers && <> · среден резултат {quiz.stats.averagePercent}%</>}
          </p>
        </div>
        <label className="flex cursor-pointer items-center px-0 py-3">
          <ToggleSwitch
            checked={quiz.enabled}
            onChange={(event) =>
              setQuiz({ ...quiz, enabled: event.target.checked })
            }
          />
        </label>
      </div>

      {quiz.enabled && (
      <div className="quiz-settings-reveal mt-7">
      <label className="flex cursor-pointer items-center justify-between gap-4 py-6">
        <span>
          <span className="block text-sm font-semibold">Quiz с верни отговори</span>
          <span className="mt-1 block text-xs opacity-55">
            Изключи за информативни въпроси без верен и грешен отговор.
          </span>
        </span>
        <ToggleSwitch
          checked={quiz.hasCorrectAnswers}
          onChange={(event) =>
            setQuiz({ ...quiz, hasCorrectAnswers: event.target.checked })
          }
        />
      </label>
      <label className="block py-6">
        <span className="mb-2 block text-sm font-semibold">Заглавие</span>
        <input
          value={quiz.title}
          onChange={(event) => setQuiz({ ...quiz, title: event.target.value })}
          maxLength={150}
          placeholder="Колко добре познаваш домакините?"
          className="field-input"
        />
      </label>

      <div>
        {quiz.questions.map((question, questionIndex) => (
          <article
            key={questionIndex}
            className="py-6"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-[#5aa9d6]">
                ВЪПРОС {questionIndex + 1}
              </span>
              <div className="flex gap-1">
                <MoveButton
                  label="↑"
                  disabled={questionIndex === 0}
                  onClick={() => {
                    const questions = [...quiz.questions];
                    [questions[questionIndex - 1], questions[questionIndex]] = [
                      questions[questionIndex],
                      questions[questionIndex - 1],
                    ];
                    setQuiz({ ...quiz, questions });
                  }}
                />
                <MoveButton
                  label="↓"
                  disabled={questionIndex === quiz.questions.length - 1}
                  onClick={() => {
                    const questions = [...quiz.questions];
                    [questions[questionIndex + 1], questions[questionIndex]] = [
                      questions[questionIndex],
                      questions[questionIndex + 1],
                    ];
                    setQuiz({ ...quiz, questions });
                  }}
                />
                <MoveButton
                  label="×"
                  onClick={() =>
                    setQuiz({
                      ...quiz,
                      questions: quiz.questions.filter(
                        (_, index) => index !== questionIndex,
                      ),
                    })
                  }
                />
              </div>
            </div>
            <input
              value={question.prompt}
              onChange={(event) =>
                updateQuestion(questionIndex, { prompt: event.target.value })
              }
              maxLength={240}
              placeholder="Напиши въпроса…"
              className="field-input mt-3"
            />
            <div className="mt-4 space-y-2">
              {question.options.map((option, optionIndex) => (
                <div key={optionIndex} className="flex items-center gap-3">
                  {quiz.hasCorrectAnswers && <input
                    type="radio"
                    name={`correct-${questionIndex}`}
                    checked={question.correctOption === optionIndex}
                    onChange={() =>
                      updateQuestion(questionIndex, {
                        correctOption: optionIndex,
                      })
                    }
                    aria-label="Правилен отговор"
                    className="h-4 w-4 accent-emerald-600"
                  />}
                  <input
                    value={option}
                    onChange={(event) => {
                      const options = [...question.options];
                      options[optionIndex] = event.target.value;
                      updateQuestion(questionIndex, { options });
                    }}
                    maxLength={120}
                    placeholder={`Отговор ${optionIndex + 1}`}
                    className="field-input py-2.5"
                  />
                  {question.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => {
                        const options = question.options.filter(
                          (_, index) => index !== optionIndex,
                        );
                        const correctOption =
                          question.correctOption === optionIndex
                            ? 0
                            : Math.min(
                                question.correctOption,
                                options.length - 1,
                              );
                        updateQuestion(questionIndex, {
                          options,
                          correctOption,
                        });
                      }}
                      className="px-2 text-lg opacity-45"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {question.options.length < 4 && (
              <button
                type="button"
                onClick={() =>
                  updateQuestion(questionIndex, {
                    options: [...question.options, ""],
                  })
                }
                className="mt-3 text-sm font-bold text-[#5aa9d6]"
              >
                + Добави отговор
              </button>
            )}
          </article>
        ))}
      </div>

      {quiz.questions.length < 10 && (
        <button
          type="button"
          onClick={() =>
            setQuiz({
              ...quiz,
              questions: [
                ...quiz.questions,
                { prompt: "", options: ["", ""], correctOption: 0 },
              ],
            })
          }
        className="secondary-action mt-6 w-full justify-center"
        >
          + Добави въпрос
        </button>
      )}
      </div>
      )}
      {notice && <p className="mt-4 text-sm font-semibold">{notice}</p>}
      {!hideSaveButton && (
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="primary-action mt-5 w-full justify-center py-4 disabled:opacity-50"
        >
          {saving ? "Запазване…" : "Запази quiz-а"}
        </button>
      )}
    </section>
  );
}

function MoveButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-lg bg-[#173b57]/5 text-sm disabled:opacity-25"
    >
      {label}
    </button>
  );
}
