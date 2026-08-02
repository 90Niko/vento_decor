"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { eventsService } from "@/features/events/services/events.service";
import type { CreatedEvent } from "@/features/events/types/events";
import { uploadImages } from "@/features/uploads/services/uploads.service";
import { EventQuizBuilder } from "./event-quiz-builder";
import { customThemeValue, getEventTheme } from "@/features/events/lib/event-theme";

const EVENT_TYPES = [
  ["wedding", "💍", "Сватба"],
  ["birthday", "🎂", "Рожден ден"],
  ["baptism", "🕊️", "Кръщене"],
  ["prom", "✨", "Бал"],
  ["corporate", "🏢", "Корпоративно"],
  ["other", "＋", "Друго"],
] as const;

const COLOR_THEMES = [
  ["ocean", "#173b57", "#5aa9d6", "Океан"],
  ["rose", "#6d3044", "#d8899e", "Роза"],
  ["sage", "#354f42", "#8eaa96", "Градински чай"],
  ["lavender", "#493d6b", "#a99bd4", "Лавандула"],
  ["terracotta", "#6d382b", "#c8795d", "Теракота"],
  ["midnight", "#171b2e", "#59658f", "Полунощ"],
] as const;

export function CreateEventForm({
  basePath = "/admin/events",
}: {
  basePath?: string;
}) {
  const canConfigureGuestOtp = basePath.startsWith("/admin");
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedEvent | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState("ocean");
  const [customPrimary, setCustomPrimary] = useState("#173b57");
  const [customAccent, setCustomAccent] = useState("#5aa9d6");
  const formRef = useRef<HTMLFormElement>(null);
  const previewTheme = getEventTheme(
    selectedTheme === "custom"
      ? customThemeValue(customPrimary, customAccent)
      : selectedTheme,
  );

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  useEffect(() => {
    if (!created) return;
    const publicUrl = `${window.location.origin}/event/${created.publicId}`;
    void QRCode.toDataURL(publicUrl, {
      width: 300,
      margin: 2,
      color: { dark: "#173b57", light: "#ffffff" },
    }).then(setQrCode);
  }, [created]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setProgress(0);

    const data = new FormData(event.currentTarget);
    try {
      let uploadedCover: { url: string; publicId: string } | undefined;
      if (cover) {
        const upload = await uploadImages({
          files: [cover],
          uploadPath: "/uploads/images",
          onProgress: setProgress,
        });
        uploadedCover = upload.images[0];
      }

      const response = await eventsService.createEventResponse({
        title: String(data.get("title") ?? ""),
        eventType: String(data.get("eventType") ?? "other"),
        description: optionalValue(data, "description"),
        location: String(data.get("location") ?? ""),
        startAt: optionalDate(data, "startAt"),
        uploadDeadline: optionalDate(data, "uploadDeadline"),
        coverImageUrl: uploadedCover?.url,
        coverImagePublicId: uploadedCover?.publicId,
        themeColor:
          selectedTheme === "custom"
            ? customThemeValue(customPrimary, customAccent)
            : selectedTheme,
        requireGuestOtp: data.has("requireGuestOtp"),
      });
      if (!response.ok) {
        throw new Error(await readError(response));
      }
      setCreated((await response.json()) as CreatedEvent);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Събитието не можа да бъде създадено.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function generateDescription() {
    if (!formRef.current) return;
    const data = new FormData(formRef.current);
    const title = String(data.get("title") ?? "").trim();
    if (title.length < 2) {
      setError("Въведи име на събитието, преди да генерираш послание.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    try {
      const response = await eventsService.generateEventCopyResponse({
        title,
        eventType: String(data.get("eventType") ?? "other"),
        location: String(data.get("location") ?? "").trim() || undefined,
      });
      if (!response.ok) throw new Error(await readError(response));
      const result = (await response.json()) as { description: string };
      setDescription(result.description);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "AI посланието не може да бъде генерирано.",
      );
    } finally {
      setIsGenerating(false);
    }
  }

  if (created) {
    const publicUrl =
      typeof window === "undefined"
        ? created.publicUrl
        : `${window.location.origin}/event/${created.publicId}`;
    return (
      <div className="space-y-6">
      <section className="surface-card grid gap-8 rounded-[2rem] p-6 sm:p-9 lg:grid-cols-[1fr_260px]">
        <div className="flex flex-col justify-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-2xl text-emerald-700">
            ✓
          </span>
          <p className="mt-6 text-xs font-bold tracking-[0.16em] text-[#5aa9d6] uppercase">
            Готово
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            {created.title}
          </h2>
          <p className="mt-3 max-w-xl text-[#173b57]/60">
            Събитието е създадено. Сподели линка или QR кода с гостите.
          </p>
          <p className="mt-5 break-all rounded-xl bg-[#173b57]/5 px-4 py-3 text-sm">
            {publicUrl}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`${basePath}/${created.publicId}`}
              className="primary-action"
            >
              Отвори събитието
            </Link>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-xl">
          {qrCode ? (
            <Image
              src={qrCode}
              alt="QR код на събитието"
              width={300}
              height={300}
              unoptimized
              className="w-full"
            />
          ) : (
            <div className="aspect-square animate-pulse rounded-xl bg-[#eaf6ff]" />
          )}
        </div>
      </section>
      <EventQuizBuilder publicId={created.publicId} />
      </div>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
    >
      <div
        className="surface-card space-y-9 rounded-[2rem] p-6 transition-colors duration-300 sm:p-9"
        style={{
          color: previewTheme.primary,
          background: `linear-gradient(155deg, #ffffff 45%, ${previewTheme.accent}18)`,
        }}
      >
        <FormSection
          number="01"
          title="Основна информация"
          description="Най-важното, което гостите ще видят."
        >
          <Field label="Име на събитието" required hint="До 150 символа">
            <input
              name="title"
              required
              maxLength={150}
              className="field-input"
              placeholder="Напр. Сватбата на Мария и Иван"
            />
          </Field>
          <fieldset>
            <legend className="mb-3 text-sm font-semibold">Тип събитие</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {EVENT_TYPES.map(([value, icon, label], index) => (
                <label key={value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="eventType"
                    value={value}
                    defaultChecked={index === 0}
                    className="peer sr-only"
                  />
                  <span className="flex items-center gap-2 rounded-xl border border-[#173b57]/12 bg-white/55 px-3 py-3 text-sm font-semibold transition peer-checked:border-[#5aa9d6] peer-checked:bg-[#5aa9d6]/12 peer-checked:text-[#173b57]">
                    <span aria-hidden="true">{icon}</span>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Дата и начален час" required>
              <input
                name="startAt"
                type="datetime-local"
                required
                className="field-input"
              />
            </Field>
            <Field label="Локация" required>
              <input
                name="location"
                required
                maxLength={255}
                className="field-input"
                placeholder="Напр. Зала Опал, Русе"
              />
            </Field>
          </div>
        </FormSection>

        <FormSection
          number="02"
          title="Изглед за гостите"
          description="Направи публичната страница лична и разпознаваема."
        >
          <Field label="Послание към гостите" hint="Незадължително">
            <textarea
              name="description"
              rows={4}
              maxLength={10000}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="field-input resize-none"
              placeholder="Споделете любимите си моменти от нашия специален ден…"
            />
            <button
              type="button"
              onClick={() => void generateDescription()}
              disabled={isGenerating}
              className="secondary-action mt-3 disabled:cursor-wait disabled:opacity-60"
            >
              {isGenerating ? "Генериране…" : "✨ Генерирай с AI"}
            </button>
          </Field>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">Заглавна снимка</p>
              <span className="text-xs text-[#173b57]/45">
                JPG, PNG или WebP · до 20 MB
              </span>
            </div>
            <label className="group relative block cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-[#173b57]/15 bg-white/45 transition hover:border-[#5aa9d6]">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setCover(file);
                  setCoverPreview(file ? URL.createObjectURL(file) : null);
                }}
              />
              {coverPreview ? (
                <div className="relative aspect-[16/7]">
                  <Image
                    src={coverPreview}
                    alt="Преглед на заглавната снимка"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <span className="absolute inset-0 grid place-items-center bg-[#173b57]/0 text-sm font-semibold text-white opacity-0 transition group-hover:bg-[#173b57]/45 group-hover:opacity-100">
                    Смени снимката
                  </span>
                </div>
              ) : (
                <div className="grid min-h-40 place-items-center p-6 text-center">
                  <div>
                    <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[#5aa9d6]/12 text-xl text-[#5aa9d6]">
                      ↑
                    </span>
                    <p className="mt-3 text-sm font-semibold">
                      Избери или пусни снимка тук
                    </p>
                    <p className="mt-1 text-xs text-[#173b57]/45">
                      Препоръчителен формат 16:9
                    </p>
                  </div>
                </div>
              )}
            </label>
          </div>
          <fieldset>
            <legend className="text-sm font-semibold">Цветова тема</legend>
            <p className="mt-1 text-xs text-[#173b57]/45">
              Темата определя цветовете на страницата, която виждат гостите.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {COLOR_THEMES.map(([value, primary, accent, label]) => (
                <label key={value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="themeColor"
                    value={value}
                    checked={selectedTheme === value}
                    onChange={() => setSelectedTheme(value)}
                    className="peer sr-only"
                  />
                  <span className="flex items-center gap-3 rounded-xl border border-[#173b57]/12 bg-white/55 px-3 py-3 text-sm font-semibold transition peer-checked:border-[#5aa9d6] peer-checked:ring-2 peer-checked:ring-[#5aa9d6]/20">
                    <span className="flex -space-x-1">
                      <span
                        className="h-5 w-5 rounded-full ring-2 ring-white"
                        style={{ backgroundColor: primary }}
                      />
                      <span
                        className="h-5 w-5 rounded-full ring-2 ring-white"
                        style={{ backgroundColor: accent }}
                      />
                    </span>
                    {label}
                  </span>
                </label>
              ))}
            </div>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#173b57]/10 bg-white/55 p-4">
              <input
                type="checkbox"
                checked={selectedTheme === "custom"}
                onChange={(event) =>
                  setSelectedTheme(event.target.checked ? "custom" : "ocean")
                }
                className="mt-0.5 h-4 w-4 accent-[#173b57]"
              />
              <span>
                <span className="block text-sm font-semibold">
                  Персонална палитра
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#173b57]/50">
                  Избери собствен основен и акцентен цвят за събитието.
                </span>
              </span>
            </label>
            {selectedTheme === "custom" && (
              <div className="mt-3 grid gap-3 rounded-2xl border border-[#173b57]/10 bg-white/55 p-4 sm:grid-cols-2">
                <ColorPicker label="Основен цвят" value={customPrimary} onChange={setCustomPrimary} />
                <ColorPicker label="Акцентен цвят" value={customAccent} onChange={setCustomAccent} />
              </div>
            )}
          </fieldset>
        </FormSection>

        <FormSection
          number="03"
          title="Период за качване"
          description="Определи докога гостите могат да изпращат снимки."
        >
          {canConfigureGuestOtp && (
            <label className="flex cursor-pointer gap-3 rounded-2xl border border-[#173b57]/12 bg-white/55 p-4">
              <input
                name="requireGuestOtp"
                type="checkbox"
                className="mt-1 h-4 w-4 accent-[#173b57]"
              />
              <span>
                <span className="block text-sm font-semibold">
                  Код за достъп по имейл
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#173b57]/55">
                  Когато е включено, гостите потвърждават имейла си с 6-цифрен
                  код.
                </span>
              </span>
            </label>
          )}
          <Field
            label="Краен срок за качване"
            hint="Може да се промени по-късно"
          >
            <input
              name="uploadDeadline"
              type="datetime-local"
              className="field-input"
            />
          </Field>
        </FormSection>

        {error && (
          <p
            role="alert"
            className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="primary-action w-full py-4 disabled:cursor-wait disabled:opacity-60"
          style={{
            background: `linear-gradient(135deg, ${previewTheme.primary}, ${previewTheme.accent})`,
          }}
        >
          {isSubmitting
            ? cover && progress < 100
              ? `Качване на снимката · ${progress}%`
              : "Създаване…"
            : "Създай събитието →"}
        </button>
      </div>

      <aside className="surface-card rounded-[2rem] p-5 lg:sticky lg:top-24">
        <div
          className="mb-6 overflow-hidden rounded-2xl p-5 text-white transition-colors duration-300"
          style={{
            background: `linear-gradient(145deg, ${previewTheme.primary}, ${previewTheme.accent})`,
          }}
        >
          <p className="text-xs font-bold tracking-[0.16em] text-white/65 uppercase">
            Преглед на темата
          </p>
          <p className="mt-3 text-xl font-semibold">Твоето събитие</p>
          <p className="mt-2 text-sm text-white/75">
            Така ще изглеждат основните цветове за гостите.
          </p>
          <span
            className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold"
            style={{ color: previewTheme.primary }}
          >
            Акцентен бутон
          </span>
        </div>
        <p className="text-xs font-bold tracking-[0.16em] text-[#5aa9d6] uppercase">
          Добра форма
        </p>
        <h2 className="mt-2 text-xl font-semibold">Кратко и ясно</h2>
        <ul className="mt-5 space-y-4 text-sm text-[#173b57]/60">
          <Tip>Използвай име, което гостите ще разпознаят веднага.</Tip>
          <Tip>Заглавната снимка задава настроението на страницата.</Tip>
          <Tip>След създаването ще получиш готов QR код за споделяне.</Tip>
        </ul>
      </aside>
    </form>
  );
}

function FormSection({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-[#173b57]/10 pb-9 last:border-0 last:pb-0">
      <div className="mb-6 flex gap-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#173b57] text-xs font-bold text-white">
          {number}
        </span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-0.5 text-sm text-[#173b57]/50">{description}</p>
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
function Field({
  label,
  required = false,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-sm font-semibold">
        <span>
          {label}
          {required && <span className="ml-1 text-[#5aa9d6]">*</span>}
        </span>
        {hint && (
          <span className="text-xs font-normal text-[#173b57]/40">{hint}</span>
        )}
      </span>
      {children}
    </label>
  );
}
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 text-emerald-500">✓</span>
      <span>{children}</span>
    </li>
  );
}
function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center gap-3 text-sm font-semibold">
      <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-14 cursor-pointer rounded-lg border-0 bg-transparent p-0" />
      <span>{label}<span className="mt-0.5 block font-mono text-xs font-normal uppercase opacity-45">{value}</span></span>
    </label>
  );
}
function optionalValue(data: FormData, key: string) {
  const value = data.get(key);
  return typeof value === "string" && value ? value : undefined;
}
function optionalDate(data: FormData, key: string) {
  const value = optionalValue(data, key);
  return value ? new Date(value).toISOString() : undefined;
}
async function readError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    return Array.isArray(body.message)
      ? body.message.join(" ")
      : (body.message ?? `Грешка ${response.status}`);
  } catch {
    return `Събитието не можа да бъде създадено (код ${response.status}).`;
  }
}
