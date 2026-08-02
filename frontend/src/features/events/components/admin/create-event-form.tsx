"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { eventsService } from "@/features/events/services/events.service";
import type { CreatedEvent } from "@/features/events/types/events";
import { uploadImages } from "@/features/uploads/services/uploads.service";
import { customThemeValue, getEventTheme } from "@/features/events/lib/event-theme";
import { ToggleSwitch } from "@/shared/components/toggle-switch";

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

interface QuizDraftQuestion {
  prompt: string;
  options: string[];
  correctOption: number;
}

const WIZARD_STEPS = [
  "Основно",
  "Място и време",
  "Снимка",
  "Цветове",
  "Достъп",
  "Quiz",
  "Послание",
  "Преглед",
] as const;

export function CreateEventForm({
  basePath = "/admin/events",
}: {
  basePath?: string;
}) {
  const router = useRouter();
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedEvent | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [descriptionTone, setDescriptionTone] = useState<
    "warm" | "playful" | "formal"
  >("warm");
  const [selectedTheme, setSelectedTheme] = useState("ocean");
  const [customPrimary, setCustomPrimary] = useState("#173b57");
  const [customAccent, setCustomAccent] = useState("#5aa9d6");
  const [quizEnabled, setQuizEnabled] = useState(false);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizQuestions, setQuizQuestions] = useState<QuizDraftQuestion[]>([]);
  const [selectedEventType, setSelectedEventType] = useState("wedding");
  const [customEventType, setCustomEventType] = useState("");
  const [wizardStep, setWizardStep] = useState(0);
  const [redirectSeconds, setRedirectSeconds] = useState(5);
  const [review, setReview] = useState({
    title: "",
    location: "",
    startAt: "",
    requireGuestOtp: false,
  });
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
    const root = document.documentElement;
    root.classList.add("live-event-page-theme");
    root.style.setProperty("--active-event-theme-primary", previewTheme.primary);
    root.style.setProperty("--active-event-theme-accent", previewTheme.accent);
    root.style.setProperty(
      "--active-event-theme-background",
      previewTheme.background,
    );
    return () => {
      root.classList.remove("live-event-page-theme");
      root.style.removeProperty("--active-event-theme-primary");
      root.style.removeProperty("--active-event-theme-accent");
      root.style.removeProperty("--active-event-theme-background");
    };
  }, [previewTheme.primary, previewTheme.accent, previewTheme.background]);

  useEffect(() => {
    if (!created) return;
    const publicUrl = `${window.location.origin}/event/${created.publicId}`;
    void QRCode.toDataURL(publicUrl, {
      width: 300,
      margin: 2,
      color: { dark: "#173b57", light: "#ffffff" },
    }).then(setQrCode);
  }, [created]);

  useEffect(() => {
    if (!created) return;
    setRedirectSeconds(5);
    const interval = window.setInterval(
      () => setRedirectSeconds((seconds) => Math.max(0, seconds - 1)),
      1000,
    );
    const timeout = window.setTimeout(
      () => router.replace(`${basePath}/${created.publicId}`),
      5000,
    );
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [basePath, created, router]);

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
        eventType:
          selectedEventType === "other"
            ? customEventType.trim()
            : selectedEventType,
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
      const createdEvent = (await response.json()) as CreatedEvent;
      if (quizEnabled) {
        const quizResponse = await eventsService.updateManagerQuizResponse(
          createdEvent.publicId,
          {
            enabled: true,
            title: quizTitle,
            questions: quizQuestions,
          },
        );
        if (!quizResponse.ok) {
          setCreated(createdEvent);
          throw new Error(
            "Събитието е създадено, но quiz-ът не можа да бъде запазен. Можеш да го настроиш от секцията по-долу.",
          );
        }
      }
      setCreated(createdEvent);
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
        eventType:
          selectedEventType === "other"
            ? customEventType.trim()
            : selectedEventType,
        location: String(data.get("location") ?? "").trim() || undefined,
        startAt: optionalDate(data, "startAt"),
        tone: descriptionTone,
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

  function continueWizard() {
    const stepContainer = formRef.current?.querySelector<HTMLElement>(
      `[data-wizard-step="${wizardStep}"]`,
    );
    const controls = Array.from(
      stepContainer?.querySelectorAll<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >("input, textarea, select") ?? [],
    );
    const invalid = controls.find((control) => !control.checkValidity());
    if (invalid) {
      invalid.reportValidity();
      invalid.focus();
      return;
    }

    const nextStep = Math.min(wizardStep + 1, WIZARD_STEPS.length - 1);
    if (nextStep === WIZARD_STEPS.length - 1 && formRef.current) {
      const data = new FormData(formRef.current);
      setReview({
        title: String(data.get("title") ?? ""),
        location: String(data.get("location") ?? ""),
        startAt: String(data.get("startAt") ?? ""),
        requireGuestOtp: data.has("requireGuestOtp"),
      });
    }
    setWizardStep(nextStep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (created) {
    const publicUrl =
      typeof window === "undefined"
        ? created.publicUrl
        : `${window.location.origin}/event/${created.publicId}`;
    return (
      <section className="success-event-card surface-card relative grid gap-8 overflow-hidden rounded-[2rem] p-6 sm:p-9 lg:grid-cols-[1fr_260px]">
        <div className="success-confetti" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => <span key={index} />)}
        </div>
        <div className="flex flex-col justify-center">
          <span className="success-check grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-700">
            ✓
          </span>
          <p className="mt-6 text-xs font-bold tracking-[0.16em] text-[#5aa9d6] uppercase">
            Готово
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">
            {created.title}
          </h2>
          <p className="mt-3 max-w-xl text-[#173b57]/60">
            Събитието е създадено успешно. Сподели линка или QR кода с гостите.
          </p>
          <p className="mt-5 break-all rounded-xl bg-[#173b57]/5 px-4 py-3 text-sm">
            {publicUrl}
          </p>
          {error && (
            <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`${basePath}/${created.publicId}`}
              className="primary-action"
            >
              Отвори сега
            </Link>
          </div>
          <div className="mt-6 max-w-md">
            <div className="flex justify-between text-xs font-semibold opacity-55">
              <span>Автоматично пренасочване</span>
              <span>{redirectSeconds} сек.</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#173b57]/10">
              <span className="success-redirect-progress block h-full rounded-full bg-emerald-500" />
            </div>
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
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="live-event-theme grid items-start gap-6 transition-colors duration-300 lg:grid-cols-[minmax(0,1fr)_340px]"
      style={
        {
          "--event-theme-primary": previewTheme.primary,
          "--event-theme-accent": previewTheme.accent,
          "--event-theme-background": previewTheme.background,
        } as React.CSSProperties
      }
    >
      <Link
        href={basePath}
        aria-label="Прекрати създаването"
        title="Прекрати създаването"
        className="fixed top-4 right-4 z-[70] grid h-11 w-11 place-items-center rounded-full bg-white/90 text-2xl text-[#173b57] shadow-lg backdrop-blur-xl transition hover:rotate-90 hover:bg-white md:top-24"
      >
        ×
      </Link>
      <div
        className="theme-edit-surface surface-card wizard-form-surface space-y-9 rounded-[2rem] p-6 pb-28 transition-colors duration-300 sm:p-9 md:grid md:grid-cols-1 md:items-start md:gap-7 md:space-y-0 md:pb-9"
        style={{
          color: previewTheme.primary,
          background: `linear-gradient(155deg, #ffffff 45%, ${previewTheme.accent}18)`,
        }}
      >
        <div className="border-b border-[#173b57]/10 pb-6 md:hidden">
          <div className="flex items-center justify-between gap-3 text-xs font-bold">
            <span>{WIZARD_STEPS[wizardStep]}</span>
            <span className="opacity-45">
              {wizardStep + 1} / {WIZARD_STEPS.length}
            </span>
          </div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#173b57]/8">
            <span
              className="block h-full rounded-full transition-all duration-500"
              style={{
                width: `${(wizardStep / (WIZARD_STEPS.length - 1)) * 100}%`,
                backgroundColor: previewTheme.accent,
              }}
            />
          </div>
          <div className="mt-4 hidden grid-cols-8 gap-2 sm:grid">
            {WIZARD_STEPS.map((step, index) => (
              <button
                key={step}
                type="button"
                disabled={index > wizardStep}
                onClick={() => setWizardStep(index)}
                className={`rounded-full px-2 py-2 text-xs font-semibold transition ${
                  index === wizardStep
                    ? "text-white"
                    : index < wizardStep
                      ? "bg-white/70 opacity-70"
                      : "opacity-30"
                }`}
                style={
                  index === wizardStep
                    ? { backgroundColor: previewTheme.primary }
                    : undefined
                }
              >
                {step}
              </button>
            ))}
          </div>
        </div>
        <div data-wizard-step="0" data-active={wizardStep === 0} className="wizard-step-panel">
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
              {EVENT_TYPES.map(([value, icon, label]) => (
                <label key={value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="eventType"
                    value={value}
                    checked={selectedEventType === value}
                    onChange={() => setSelectedEventType(value)}
                    className="peer sr-only"
                  />
                  <span className="flex items-center gap-2 rounded-xl border border-[#173b57]/12 bg-white/55 px-3 py-3 text-sm font-semibold transition peer-checked:border-[#5aa9d6] peer-checked:bg-[#5aa9d6]/12 peer-checked:text-[#173b57]">
                    <span aria-hidden="true">{icon}</span>
                    {label}
                  </span>
                </label>
              ))}
            </div>
            {selectedEventType === "other" && (
              <div className="mt-4">
                <Field label="Вид на събитието" required hint="До 40 символа">
                  <input
                    value={customEventType}
                    onChange={(event) => setCustomEventType(event.target.value)}
                    required
                    minLength={2}
                    maxLength={40}
                    className="field-input"
                    placeholder="Напр. Годеж, юбилей, фирмено парти"
                  />
                </Field>
              </div>
            )}
          </fieldset>
        </FormSection>
        </div>

        <div data-wizard-step="6" data-active={wizardStep === 6} className="wizard-step-panel">
        <FormSection
          number="07"
          title="Детайли за събитието"
          description="Добави послание, място и начален час."
        >
          <Field label="Тон на посланието">
            <select
              value={descriptionTone}
              onChange={(event) =>
                setDescriptionTone(
                  event.target.value as "warm" | "playful" | "formal",
                )
              }
              className="field-input"
            >
              <option value="warm">Топъл и емоционален</option>
              <option value="playful">Забавен и непринуден</option>
              <option value="formal">Елегантен и официален</option>
            </select>
          </Field>
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
        </FormSection>
        </div>

        <div data-wizard-step="1" data-active={wizardStep === 1} className="wizard-step-panel">
        <FormSection
          number="02"
          title="Място и време"
          description="Къде и кога ще се проведе събитието."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Локация" required>
              <input
                name="location"
                required
                maxLength={255}
                className="field-input"
                placeholder="Напр. Зала Опал, Русе"
              />
            </Field>
            <Field label="Дата и начален час" required>
              <input
                name="startAt"
                type="datetime-local"
                required
                className="field-input"
              />
            </Field>
          </div>
        </FormSection>
        </div>

        <div data-wizard-step="2" data-active={wizardStep === 2} className="wizard-step-panel">
        <FormSection
          number="03"
          title="Заглавна снимка"
          description="Избери снимката, която гостите ще виждат първо."
        >
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
        </FormSection>
        </div>

        <div data-wizard-step="3" data-active={wizardStep === 3} className="wizard-step-panel">
        <FormSection
          number="04"
          title="Цветова тема"
          description="Избери цветовете на страницата за гостите."
        >
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
                  <span className="theme-preset-card flex items-center gap-3 rounded-xl border border-[#173b57]/12 bg-white/55 px-3 py-3 text-sm font-semibold transition peer-checked:border-[#5aa9d6] peer-checked:ring-2 peer-checked:ring-[#5aa9d6]/20">
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
              <ToggleSwitch
                checked={selectedTheme === "custom"}
                onChange={(event) =>
                  setSelectedTheme(event.target.checked ? "custom" : "ocean")
                }
                className="mt-0.5"
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
        </div>

        <div data-wizard-step="4" data-active={wizardStep === 4} className="wizard-step-panel">
        <FormSection
          number="05"
          title="Период за качване"
          description="Определи докога гостите могат да изпращат снимки."
        >
          <label className="flex cursor-pointer gap-3 rounded-2xl border border-[#173b57]/12 bg-white/55 p-4">
              <ToggleSwitch
                name="requireGuestOtp"
                className="mt-0.5"
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
        </div>

        <div data-wizard-step="5" data-active={wizardStep === 5} className="wizard-step-panel">
        <FormSection
          number="06"
          title="Quiz за гостите"
          description="Добави кратък quiz, който гостите попълват преди снимките."
        >
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#173b57]/10 bg-white/55 p-4">
            <ToggleSwitch
              checked={quizEnabled}
              onChange={(event) => {
                const enabled = event.target.checked;
                const quizPanel = event.currentTarget.closest<HTMLElement>(
                  '[data-wizard-step="5"]',
                );
                setQuizEnabled(enabled);
                if (enabled && quizQuestions.length === 0) {
                  setQuizQuestions([
                    { prompt: "", options: ["", ""], correctOption: 0 },
                  ]);
                }
                window.requestAnimationFrame(() =>
                  quizPanel?.scrollTo({ top: 0, behavior: "auto" }),
                );
              }}
              className="mt-0.5"
            />
            <span>
              <span className="block text-sm font-semibold">Включи quiz</span>
              <span className="mt-1 block text-xs opacity-55">
                Всеки гост може да го попълни само веднъж.
              </span>
            </span>
          </label>
          {quizEnabled && (
            <div className="space-y-4">
              <Field label="Заглавие на quiz-а" hint="Незадължително">
                <input
                  value={quizTitle}
                  onChange={(event) => setQuizTitle(event.target.value)}
                  maxLength={150}
                  placeholder="Колко добре познаваш домакините?"
                  className="field-input"
                />
              </Field>
              {quizQuestions.map((question, questionIndex) => (
                <article
                  key={questionIndex}
                  className="rounded-2xl border border-[#173b57]/10 bg-white/55 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold opacity-55">
                      Въпрос {questionIndex + 1}
                    </span>
                    {quizQuestions.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setQuizQuestions((questions) =>
                            questions.filter((_, index) => index !== questionIndex),
                          )
                        }
                        className="text-sm font-bold opacity-50 hover:opacity-100"
                      >
                        Премахни
                      </button>
                    )}
                  </div>
                  <input
                    required
                    value={question.prompt}
                    onChange={(event) =>
                      updateQuizQuestion(setQuizQuestions, questionIndex, {
                        prompt: event.target.value,
                      })
                    }
                    maxLength={240}
                    placeholder="Напиши въпроса…"
                    className="field-input mt-3"
                  />
                  <div className="mt-3 space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name={`draft-correct-${questionIndex}`}
                          checked={question.correctOption === optionIndex}
                          onChange={() =>
                            updateQuizQuestion(setQuizQuestions, questionIndex, {
                              correctOption: optionIndex,
                            })
                          }
                          aria-label="Правилен отговор"
                        />
                        <input
                          required
                          value={option}
                          onChange={(event) => {
                            const options = [...question.options];
                            options[optionIndex] = event.target.value;
                            updateQuizQuestion(setQuizQuestions, questionIndex, {
                              options,
                            });
                          }}
                          maxLength={120}
                          placeholder={`Отговор ${optionIndex + 1}`}
                          className="field-input"
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
                                  : question.correctOption > optionIndex
                                    ? question.correctOption - 1
                                    : question.correctOption;
                              updateQuizQuestion(
                                setQuizQuestions,
                                questionIndex,
                                { options, correctOption },
                              );
                            }}
                            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-current/15 text-lg opacity-45 transition hover:opacity-100"
                            aria-label={`Премахни отговор ${optionIndex + 1}`}
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
                        updateQuizQuestion(setQuizQuestions, questionIndex, {
                          options: [...question.options, ""],
                        })
                      }
                      className="secondary-action mt-3 w-full justify-center"
                    >
                      + Добави отговор
                    </button>
                  )}
                </article>
              ))}
              {quizQuestions.length < 10 && (
                <button
                  type="button"
                  onClick={() =>
                    setQuizQuestions((questions) => [
                      ...questions,
                      { prompt: "", options: ["", ""], correctOption: 0 },
                    ])
                  }
                  className="secondary-action w-full justify-center"
                >
                  + Добави въпрос
                </button>
              )}
            </div>
          )}
        </FormSection>
        </div>

        <div data-wizard-step="7" data-active={wizardStep === 7} className="wizard-review-step wizard-step-panel">
          <section>
            <p className="text-xs font-bold tracking-[0.16em] uppercase opacity-50">
              Финална проверка
            </p>
            <h2 className="mt-2 text-3xl font-semibold">Готово за създаване</h2>
            <dl className="mt-7 divide-y divide-[#173b57]/10 rounded-2xl border border-[#173b57]/10 bg-white/55 px-5">
              <ReviewRow label="Събитие" value={review.title} />
              <ReviewRow label="Локация" value={review.location} />
              <ReviewRow
                label="Начало"
                value={review.startAt ? formatReviewDate(review.startAt) : "—"}
              />
              <ReviewRow label="Код за достъп" value={review.requireGuestOtp ? "Включен" : "Изключен"} />
              <ReviewRow label="Quiz" value={quizEnabled ? `${quizQuestions.length} въпроса` : "Изключен"} />
            </dl>
            <p className="mt-5 text-sm leading-6 opacity-55">
              Можеш да се върнеш към предишна стъпка или да създадеш събитието.
            </p>
          </section>
        </div>

        {error && (
          <p
            role="alert"
            className="wizard-form-error rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            {error}
          </p>
        )}
        <div className="fixed inset-x-0 bottom-0 z-60 flex gap-3 bg-white/92 px-4 py-3 shadow-[0_-10px_35px_rgb(23_59_87/14%)] backdrop-blur-xl md:static md:hidden">
          {wizardStep > 0 && (
            <button
              type="button"
              onClick={() => setWizardStep((step) => Math.max(0, step - 1))}
              className="secondary-action flex-1 justify-center py-4"
            >
              ← Назад
            </button>
          )}
          {wizardStep < WIZARD_STEPS.length - 1 ? (
            <button
              type="button"
              onClick={continueWizard}
              className="primary-action flex-1 justify-center py-4"
              style={{
                background: `linear-gradient(135deg, ${previewTheme.primary}, ${previewTheme.accent})`,
              }}
            >
              Продължи →
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="primary-action flex-1 justify-center py-4 disabled:cursor-wait disabled:opacity-60"
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
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="primary-action desktop-submit-action hidden w-full justify-center py-4 disabled:cursor-wait disabled:opacity-60 md:flex"
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

      <aside className="theme-edit-surface surface-card hidden rounded-[2rem] p-5 transition-colors duration-300 lg:sticky lg:top-24 lg:block">
        <div
          className="theme-guest-preview mb-6 overflow-hidden rounded-2xl p-5 text-white transition-colors duration-300"
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
    <section className="wizard-form-section border-b border-[#173b57]/10 pb-9 last:border-0 last:pb-0">
      <div className="wizard-section-heading mb-6 flex gap-4">
        <span className="theme-section-number grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#173b57] text-xs font-bold text-white">
          {number}
        </span>
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="mt-0.5 text-sm text-[#173b57]/50">{description}</p>
        </div>
      </div>
      <div className="wizard-section-fields space-y-5">{children}</div>
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
function updateQuizQuestion(
  setQuestions: React.Dispatch<React.SetStateAction<QuizDraftQuestion[]>>,
  questionIndex: number,
  update: Partial<QuizDraftQuestion>,
) {
  setQuestions((questions) =>
    questions.map((question, index) =>
      index === questionIndex ? { ...question, ...update } : question,
    ),
  );
}
function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-4 sm:grid-cols-[9rem_1fr]">
      <dt className="text-sm font-semibold opacity-45">{label}</dt>
      <dd className="font-semibold">{value || "—"}</dd>
    </div>
  );
}

function formatReviewDate(value: string) {
  return new Intl.DateTimeFormat("bg-BG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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
