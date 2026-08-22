"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { eventsService } from "@/features/events/services/events.service";
import type { AdminEventDetails } from "@/features/events/types/events";
import { EventQuizBuilder, type ManagerQuiz } from "./event-quiz-builder";
import { customThemeValue, getEventTheme } from "@/features/events/lib/event-theme";
import { ToggleSwitch } from "@/shared/components/toggle-switch";
import { uploadImages } from "@/features/uploads/services/uploads.service";

const COVER_RATIOS = {
  "16:9": 16 / 9,
  "4:3": 4 / 3,
  "1:1": 1,
} as const;

type CoverRatio = keyof typeof COVER_RATIOS;
type CoverFit = "contain" | "cover" | "stretch";

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
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverRatio, setCoverRatio] = useState<CoverRatio>("16:9");
  const [coverWidth, setCoverWidth] = useState(1600);
  const [coverFit, setCoverFit] = useState<CoverFit>("stretch");
  const [coverZoom, setCoverZoom] = useState(1);
  const [coverPositionX, setCoverPositionX] = useState(50);
  const [coverPositionY, setCoverPositionY] = useState(50);

  useEffect(() => {
    void eventsService
      .getAdminEventResponse(publicId)
      .then(async (response) => {
        if (!response.ok)
          return setError("Събитието не може да бъде заредено.");
        const loadedEvent = (await response.json()) as AdminEventDetails;
        const loadedTheme = getEventTheme(loadedEvent.themeColor);
        setEvent(loadedEvent);
        setCoverPreview(loadedEvent.coverImageUrl);
        setSelectedTheme(
          loadedEvent.themeColor.startsWith("custom-")
            ? "custom"
            : loadedEvent.themeColor,
        );
        setCustomPrimary(loadedTheme.primary);
        setCustomAccent(loadedTheme.accent);
      });
  }, [publicId]);

  function handleCoverChange(file: File | null) {
    setCover(file);

    if (!file) {
      setCoverPreview(event?.coverImageUrl ?? null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCoverPreview(typeof reader.result === "string" ? reader.result : null);
    };
    reader.onerror = () => setCoverPreview(event?.coverImageUrl ?? null);
    reader.readAsDataURL(file);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const data = new FormData(e.currentTarget);
    const date = (key: string) => {
      const value = String(data.get(key) ?? "");
      return value ? new Date(value).toISOString() : undefined;
    };
    let uploadedCover: { url: string; publicId: string } | undefined;
    if (cover) {
      const preparedCover = await cropCoverImage(cover, {
        ratio: COVER_RATIOS[coverRatio],
        width: coverWidth,
        fit: coverFit,
        zoom: coverZoom,
        positionX: coverPositionX,
        positionY: coverPositionY,
      });
      const upload = await uploadImages({
        files: [preparedCover],
        uploadPath: "/uploads/images",
        onProgress: () => undefined,
      });
      uploadedCover = upload.images[0];
    }
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
      coverImageUrl: uploadedCover?.url,
      coverImagePublicId: uploadedCover?.publicId,
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
          hasCorrectAnswers: quiz.hasCorrectAnswers,
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
    router.push(basePath);
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
        className="space-y-6 px-0 py-6 sm:p-9"
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
        <div>
          <p className="mb-2 text-sm font-semibold">Заглавна снимка</p>
          <label className="group relative block cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed border-[#173b57]/15 bg-white/45 transition hover:border-[#5aa9d6]">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) =>
                handleCoverChange(event.target.files?.[0] ?? null)
              }
            />
            {coverPreview ? (
              <span
                className="relative block overflow-hidden"
                style={{ aspectRatio: COVER_RATIOS[coverRatio] }}
              >
                <Image
                  src={coverPreview}
                  alt="Преглед на заглавната снимка"
                  fill
                  unoptimized
                  className={
                    coverFit === "contain"
                      ? "scale-110 object-cover blur-xl"
                      : coverFit === "stretch"
                        ? "object-fill"
                        : "object-cover"
                  }
                  style={{
                    objectPosition: `${coverPositionX}% ${coverPositionY}%`,
                    transform:
                      coverFit === "cover" ? `scale(${coverZoom})` : undefined,
                  }}
                />
                {coverFit === "contain" && (
                  <Image
                    src={coverPreview}
                    alt="Цялата заглавна снимка"
                    fill
                    unoptimized
                    className="object-contain"
                  />
                )}
                <span className="absolute inset-0 grid place-items-center bg-[#173b57]/0 text-sm font-semibold text-white opacity-0 transition group-hover:bg-[#173b57]/45 group-hover:opacity-100">
                  Смени снимката
                </span>
              </span>
            ) : (
              <span className="grid min-h-40 place-items-center p-6 text-center text-sm font-semibold">
                Избери снимка
              </span>
            )}
          </label>
          {cover && coverPreview && (
            <span className="mt-4 grid gap-4 p-0 sm:grid-cols-2">
              <Field label="Съотношение">
                <select value={coverRatio} onChange={(event) => setCoverRatio(event.target.value as CoverRatio)} className="field-input">
                  <option value="16:9">16:9 · широко</option>
                  <option value="4:3">4:3 · стандартно</option>
                  <option value="1:1">1:1 · квадрат</option>
                </select>
              </Field>
              <Field label="Краен размер">
                <select value={coverWidth} onChange={(event) => setCoverWidth(Number(event.target.value))} className="field-input">
                  <option value={1200}>1200 px · по-малък файл</option>
                  <option value={1600}>1600 px · препоръчително</option>
                  <option value={2000}>2000 px · високо качество</option>
                </select>
              </Field>
              <Field label="Показване на снимката">
                <select value={coverFit} onChange={(event) => setCoverFit(event.target.value as CoverFit)} className="field-input">
                  <option value="stretch">Разпъване · без празни полета</option>
                  <option value="contain">Цялата снимка · с мек фон</option>
                  <option value="cover">Ръчно позициониране · с изрязване</option>
                </select>
              </Field>
              {coverFit === "cover" && (
                <span className="contents">
                  <RangeControl label="Мащаб" min={1} max={2} step={0.05} value={coverZoom} onChange={setCoverZoom} />
                  <RangeControl label="Хоризонтална позиция" min={0} max={100} step={1} value={coverPositionX} onChange={setCoverPositionX} />
                  <RangeControl label="Вертикална позиция" min={0} max={100} step={1} value={coverPositionY} onChange={setCoverPositionY} />
                </span>
              )}
            </span>
          )}
        </div>
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
            <span className="mt-3 grid gap-3 p-0 sm:grid-cols-2">
              <ColorPicker label="Основен цвят" value={customPrimary} onChange={setCustomPrimary} />
              <ColorPicker label="Акцентен цвят" value={customAccent} onChange={setCustomAccent} />
            </span>
          )}
        </Field>
        <label className="flex cursor-pointer gap-3 py-4">
            <ToggleSwitch
              name="requireGuestOtp"
              defaultChecked={event.requireGuestOtp}
              className="mt-0.5"
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

function RangeControl({ label, min, max, step, value, onChange }: { label: string; min: number; max: number; step: number; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block sm:col-span-2">
      <span className="mb-2 flex justify-between text-sm font-semibold">
        <span>{label}</span>
        <span className="font-mono text-xs opacity-50">{label === "Мащаб" ? `${Math.round(value * 100)}%` : `${value}%`}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} className="w-full cursor-pointer accent-[#5aa9d6]" />
    </label>
  );
}

async function cropCoverImage(file: File, options: { ratio: number; width: number; fit: CoverFit; zoom: number; positionX: number; positionY: number }) {
  const source = await loadImage(file);
  const targetWidth = options.width;
  const targetHeight = Math.round(targetWidth / options.ratio);
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Снимката не може да бъде обработена.");

  if (options.fit === "stretch") {
    context.drawImage(source, 0, 0, targetWidth, targetHeight);
  } else if (options.fit === "contain") {
    const backgroundScale = Math.max(targetWidth / source.naturalWidth, targetHeight / source.naturalHeight);
    const backgroundWidth = source.naturalWidth * backgroundScale;
    const backgroundHeight = source.naturalHeight * backgroundScale;
    context.save();
    context.filter = "blur(24px) brightness(0.72)";
    context.drawImage(source, (targetWidth - backgroundWidth) / 2, (targetHeight - backgroundHeight) / 2, backgroundWidth, backgroundHeight);
    context.restore();
    const foregroundScale = Math.min(targetWidth / source.naturalWidth, targetHeight / source.naturalHeight);
    const foregroundWidth = source.naturalWidth * foregroundScale;
    const foregroundHeight = source.naturalHeight * foregroundScale;
    context.drawImage(source, (targetWidth - foregroundWidth) / 2, (targetHeight - foregroundHeight) / 2, foregroundWidth, foregroundHeight);
  } else {
    const scale = Math.max(targetWidth / source.naturalWidth, targetHeight / source.naturalHeight) * options.zoom;
    const cropWidth = targetWidth / scale;
    const cropHeight = targetHeight / scale;
    const sourceX = (source.naturalWidth - cropWidth) * (options.positionX / 100);
    const sourceY = (source.naturalHeight - cropHeight) * (options.positionY / 100);
    context.drawImage(source, sourceX, sourceY, cropWidth, cropHeight, 0, 0, targetWidth, targetHeight);
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Снимката не може да бъде изрязана.")), "image/webp", 0.9);
  });
  const baseName = file.name.replace(/\.[^.]+$/, "") || "cover";
  return new File([blob], `${baseName}-${targetWidth}w.webp`, { type: "image/webp" });
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = document.createElement("img");
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") return reject(new Error("Снимката не може да бъде прочетена."));
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Снимката не може да бъде прочетена."));
      image.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Снимката не може да бъде прочетена."));
    reader.readAsDataURL(file);
  });
}

function toLocal(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
