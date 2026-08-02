"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { eventsService } from "@/features/events/services/events.service";
import type { AdminEventDetails } from "@/features/events/types/events";
import { EventQuizBuilder, type ManagerQuiz } from "./event-quiz-builder";
import { customThemeValue, getEventTheme } from "@/features/events/lib/event-theme";

export function EditEventForm({
  publicId,
  basePath = "/admin/events",
}: {
  publicId: string;
  basePath?: string;
}) {
  const router = useRouter();
  const [event, setEvent] = useState<AdminEventDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("ocean");
  const [customPrimary, setCustomPrimary] = useState("#173b57");
  const [customAccent, setCustomAccent] = useState("#5aa9d6");
  const [quiz, setQuiz] = useState<ManagerQuiz | null>(null);

  useEffect(() => {
    void eventsService
      .getAdminEventResponse(publicId)
      .then(async (response) => {
        if (!response.ok)
          return setError("Събитието не може да бъде заредено.");
        const loadedEvent = (await response.json()) as AdminEventDetails;
        const loadedTheme = getEventTheme(loadedEvent.themeColor);
        setEvent(loadedEvent);
        setSelectedTheme(
          loadedEvent.themeColor.startsWith("custom-")
            ? "custom"
            : loadedEvent.themeColor,
        );
        setCustomPrimary(loadedTheme.primary);
        setCustomAccent(loadedTheme.accent);
      });
  }, [publicId]);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const data = new FormData(e.currentTarget);
    const date = (key: string) => {
      const value = String(data.get(key) ?? "");
      return value ? new Date(value).toISOString() : undefined;
    };
    const response = await eventsService.updateEventResponse(publicId, {
      title: String(data.get("title") ?? ""),
      description: String(data.get("description") ?? "") || undefined,
      location: String(data.get("location") ?? ""),
      eventType: String(data.get("eventType") ?? "other"),
      startAt: date("startAt"),
      uploadDeadline: date("uploadDeadline"),
      themeColor:
        selectedTheme === "custom"
          ? customThemeValue(customPrimary, customAccent)
          : selectedTheme,
      requireGuestOtp: data.has("requireGuestOtp"),
    });
    if (!response.ok) {
      setSaving(false);
      return setError("Промените не могат да бъдат запазени.");
    }
    if (quiz) {
      const quizResponse = await eventsService.updateManagerQuizResponse(
        publicId,
        {
          enabled: quiz.enabled,
          title: quiz.title,
          questions: quiz.questions,
        },
      );
      if (!quizResponse.ok) {
        setSaving(false);
        return setError("Събитието е запазено, но quiz-ът не можа да бъде запазен.");
      }
    }
    setSaving(false);
    router.push(`${basePath}/${publicId}`);
    router.refresh();
  }

  if (error && !event)
    return <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>;
  if (!event) return <p className="p-8 text-center">Зареждане…</p>;

  return (
    <div className="space-y-8">
      <form
        id="edit-event-form"
        onSubmit={submit}
        className="surface-card space-y-6 rounded-[2rem] p-6 sm:p-9"
      >
        <Field label="Име на събитието">
          <input
            name="title"
            required
            maxLength={150}
            defaultValue={event.title}
            className="field-input"
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Тип">
            <select
              name="eventType"
              defaultValue={event.eventType}
              className="field-input"
            >
              <option value="wedding">Сватба</option>
              <option value="birthday">Рожден ден</option>
              <option value="baptism">Кръщене</option>
              <option value="prom">Бал</option>
              <option value="corporate">Корпоративно</option>
              <option value="other">Друго</option>
            </select>
          </Field>
          <Field label="Локация">
            <input
              name="location"
              required
              defaultValue={event.location ?? ""}
              className="field-input"
            />
          </Field>
          <Field label="Начало">
            <input
              name="startAt"
              type="datetime-local"
              defaultValue={toLocal(event.startAt)}
              className="field-input"
            />
          </Field>
          <Field label="Краен срок за качване">
            <input
              name="uploadDeadline"
              type="datetime-local"
              defaultValue={toLocal(event.uploadDeadline)}
              className="field-input"
            />
          </Field>
        </div>
        <Field label="Описание">
          <textarea
            name="description"
            rows={5}
            defaultValue={event.description ?? ""}
            className="field-input resize-none"
          />
        </Field>
        <Field label="Цветова тема">
          <select
            name="themeColor"
            value={selectedTheme}
            onChange={(event) => setSelectedTheme(event.target.value)}
            className="field-input"
          >
            <option value="ocean">Океан</option>
            <option value="rose">Роза</option>
            <option value="sage">Градински чай</option>
            <option value="lavender">Лавандула</option>
            <option value="terracotta">Теракота</option>
            <option value="midnight">Полунощ</option>
            <option value="custom">Персонална палитра</option>
          </select>
          {selectedTheme === "custom" && (
            <span className="mt-3 grid gap-3 rounded-2xl border border-[#173b57]/10 bg-white/55 p-4 sm:grid-cols-2">
              <ColorPicker label="Основен цвят" value={customPrimary} onChange={setCustomPrimary} />
              <ColorPicker label="Акцентен цвят" value={customAccent} onChange={setCustomAccent} />
            </span>
          )}
        </Field>
        <label className="flex cursor-pointer gap-3 rounded-2xl border border-[#173b57]/12 bg-white/55 p-4">
            <input
              name="requireGuestOtp"
              type="checkbox"
              defaultChecked={event.requireGuestOtp}
              className="mt-1 h-4 w-4 accent-[#173b57]"
            />
            <span>
              <span className="block text-sm font-semibold">
                Код за достъп по имейл
              </span>
              <span className="mt-1 block text-xs text-[#173b57]/55">
                Изисквай 6-цифрен код преди достъп до галерията.
              </span>
            </span>
        </label>
        {error && (
          <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>
        )}
      </form>
      <EventQuizBuilder
        publicId={publicId}
        hideSaveButton
        onChange={setQuiz}
      />
      <button
        type="submit"
        form="edit-event-form"
        disabled={saving}
        className="primary-action w-full justify-center py-4 disabled:opacity-50"
      >
        {saving ? "Запазване…" : "Запази промените"}
      </button>
    </div>
  );
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <span className="flex items-center gap-3 text-sm font-semibold">
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-14 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
      <span>{label}<span className="mt-0.5 block font-mono text-xs font-normal uppercase opacity-45">{value}</span></span>
    </span>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}
function toLocal(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
