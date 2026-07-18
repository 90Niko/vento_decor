"use client";

import Image from "next/image";
import { FormEvent, useEffect, useState } from "react";
import QRCode from "qrcode";
import { eventsService } from "@/features/events/services/events.service";
import { copyToClipboard } from "@/shared/lib/copy-to-clipboard";


interface CreatedEvent {
  id: number;
  publicId: string;
  title: string;
  description: string | null;
  startAt: string | null;
  endAt: string | null;
  location: string | null;
  isActive: boolean;
  publicUrl: string;
  createdAt: string;
  updatedAt: string;
}

function optionalIsoDate(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" && value
    ? new Date(value).toISOString()
    : undefined;
}

async function readError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: unknown };
    if (typeof payload.message === "string") {
      return payload.message;
    }
    if (
      Array.isArray(payload.message) &&
      payload.message.every((item) => typeof item === "string")
    ) {
      return payload.message.join(" ");
    }
  } catch {
    // Use the status-based message for non-JSON responses.
  }

  return `Събитието не беше създадено (код ${response.status}).`;
}

export function AdminEventsPanel({ onCreated }: { onCreated?: () => void }) {
  const [createdEvent, setCreatedEvent] = useState<CreatedEvent | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!createdEvent) {
      return;
    }

    let cancelled = false;
    QRCode.toDataURL(createdEvent.publicUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 360,
      color: {
        dark: "#173b57",
        light: "#ffffff",
      },
    })
      .then((dataUrl) => {
        if (!cancelled) {
          setQrDataUrl(dataUrl);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError("Кодът за сканиране не можа да бъде генериран.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [createdEvent]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setCopied(false);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = formData.get("title");
    const description = formData.get("description");
    const location = formData.get("location");
    const payload = {
      title: typeof title === "string" ? title : "",
      description:
        typeof description === "string" && description
          ? description
          : undefined,
      location:
        typeof location === "string" && location ? location : undefined,
      startAt: optionalIsoDate(formData, "startAt"),
      endAt: optionalIsoDate(formData, "endAt"),
    };

    try {
      const response = await eventsService.createEventResponse(payload);

      if (!response.ok) {
        throw new Error(await readError(response));
      }

      const result = (await response.json()) as CreatedEvent;
      const publicUrl = `${window.location.origin}/event/${result.publicId}`;
      setCreatedEvent({ ...result, publicUrl });
      form.reset();
      onCreated?.();
    } catch (requestError) {
      setError(
        requestError instanceof TypeError
          ? "Няма връзка със сървъра. Провери дали backend-ът работи на порт 3001."
          : requestError instanceof Error
          ? requestError.message
          : "Възникна неочаквана грешка.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPublicUrl = async () => {
    if (!createdEvent) {
      return;
    }

    try {
      await copyToClipboard(createdEvent.publicUrl);
      setCopied(true);
    } catch {
      setError("Линкът не можа да бъде копиран. Маркирай го и го копирай ръчно.");
    }
  };

  return (
    <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(350px,0.92fr)]">
      <form
        onSubmit={handleSubmit}
        className="surface-card rounded-[2rem] p-6 sm:p-8"
      >
        <div className="mb-7">
          <p className="text-xs font-semibold tracking-[0.16em] text-[#5aa9d6] uppercase">
            Ново събитие
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em]">
            Детайли за събитието
          </h2>
        </div>

        <div className="space-y-5">
          <Field label="Заглавие" required>
            <input
              name="title"
              type="text"
              required
              maxLength={150}
              placeholder="Напр. Сватба Иван и Мария"
              className="field-input"
            />
          </Field>

          <Field label="Описание">
            <textarea
              name="description"
              rows={4}
              maxLength={10000}
              placeholder="Кратък текст за гостите..."
              className="field-input resize-none"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Начало">
              <input name="startAt" type="datetime-local" className="field-input" />
            </Field>
            <Field label="Край">
              <input name="endAt" type="datetime-local" className="field-input" />
            </Field>
          </div>

          <Field label="Локация">
            <input
              name="location"
              type="text"
              maxLength={255}
              placeholder="Град, зала или адрес"
              className="field-input"
            />
          </Field>
        </div>

        {error && (
          <p className="mt-5 rounded-2xl bg-[#5aa9d6]/15 px-4 py-3 text-sm font-medium text-[#173b57]" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-7 flex w-full items-center justify-center gap-3 rounded-full bg-[#173b57] px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-[#173b57]/15 transition hover:-translate-y-0.5 hover:bg-[#5aa9d6] disabled:cursor-wait disabled:opacity-60"
        >
          {isSubmitting ? "Създаване…" : "Създай събитие и код за сканиране"}
          {!isSubmitting && <ArrowIcon />}
        </button>
      </form>

      <aside className="rounded-[2rem] bg-[linear-gradient(155deg,#173b57,#5aa9d6)] p-6 text-[#ffffff] shadow-[0_24px_80px_rgba(23,59,87,0.18)] lg:sticky lg:top-28 sm:p-8">
        {!createdEvent ? (
          <div className="flex min-h-[34rem] flex-col items-center justify-center text-center">
            <QrPlaceholderIcon />
            <h2 className="mt-6 text-2xl font-medium tracking-[-0.03em]">
              Кодът за сканиране ще се появи тук
            </h2>
            <p className="mt-3 max-w-xs text-sm leading-6 text-[#eaf6ff]/80">
              Попълни формата, за да получиш уникален публичен линк за твоите гости.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-[#eaf6ff] uppercase">
                  Събитието е създадено
                </p>
                <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">
                  {createdEvent.title}
                </h2>
              </div>
              <span className="rounded-full bg-[#eaf6ff]/15 px-3 py-1.5 text-xs font-semibold text-[#eaf6ff]">
                Активен
              </span>
            </div>

            <div className="mx-auto mt-7 w-full max-w-[20rem] rounded-[1.5rem] bg-[#ffffff] p-4 shadow-2xl">
              {qrDataUrl ? (
                <Image
                  src={qrDataUrl}
                  alt={`Код за сканиране за ${createdEvent.title}`}
                  width={360}
                  height={360}
                  unoptimized
                  className="h-auto w-full rounded-xl"
                />
              ) : (
                <div className="aspect-square animate-pulse rounded-xl bg-[#eaf6ff]" />
              )}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-[#eaf6ff] uppercase">
                Публичен линк
              </p>
              <p className="mt-2 break-all text-sm leading-6 text-white/90">
                {createdEvent.publicUrl}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={copyPublicUrl}
                className="rounded-full border border-white/15 px-4 py-3 text-sm font-semibold transition hover:bg-white/10"
              >
                {copied ? "Копирано" : "Копирай линка"}
              </button>
              {qrDataUrl && (
                <a
                  href={qrDataUrl}
                  download={`vento-decor-${createdEvent.publicId}.png`}
                  className="rounded-full bg-[#eaf6ff] px-4 py-3 text-center text-sm font-semibold text-[#173b57] transition hover:bg-[#5aa9d6]"
                >
                  Свали кода
                </a>
              )}
            </div>

            <dl className="mt-7 grid grid-cols-2 gap-4 border-t border-white/10 pt-6 text-sm">
              <EventDetail label="Начало" value={formatDate(createdEvent.startAt)} />
              <EventDetail label="Локация" value={createdEvent.location ?? "—"} />
            </dl>
          </div>
        )}
      </aside>
    </section>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">
        {label}
        {required && <span className="ml-1 text-[#5aa9d6]">*</span>}
      </span>
      {children}
    </label>
  );
}

function EventDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-[#eaf6ff]/80">{label}</dt>
      <dd className="mt-1 font-medium text-white">{value}</dd>
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("bg-BG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3.75 9h10.5m-4-4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function QrPlaceholderIcon() {
  return (
    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true" className="text-[#eaf6ff]">
      <rect x="6" y="6" width="23" height="23" rx="3" stroke="currentColor" strokeWidth="2" />
      <rect x="43" y="6" width="23" height="23" rx="3" stroke="currentColor" strokeWidth="2" />
      <rect x="6" y="43" width="23" height="23" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M43 43h9v9h-9zm14 0h9v16h-9zm-14 14h9v9h-9zm14 7h9" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <rect x="13" y="13" width="9" height="9" rx="1" fill="currentColor" />
      <rect x="50" y="13" width="9" height="9" rx="1" fill="currentColor" />
      <rect x="13" y="50" width="9" height="9" rx="1" fill="currentColor" />
    </svg>
  );
}
