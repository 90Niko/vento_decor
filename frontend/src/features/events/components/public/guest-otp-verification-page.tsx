"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { eventsService } from "@/features/events/services/events.service";
import {
  guestOtpKey,
  guestSessionKey,
} from "./event-entry";

interface PendingGuestOtp {
  name: string;
  email: string;
  devCode?: string;
}

interface GuestRegistration {
  guest: { id: number; name: string };
  token: string;
}

export function GuestOtpVerificationPage({ publicId }: { publicId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState<PendingGuestOtp | null>(null);
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const guest = readPendingGuestOtp(publicId);
    if (!guest) {
      router.replace(`/event/${publicId}`);
      return;
    }
    queueMicrotask(() => {
      setPending(guest);
      if (guest.devCode) setCode(guest.devCode);
    });
  }, [publicId, router]);

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pending || code.length !== 6) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const response = await eventsService.verifyGuestOtpResponse(
        publicId,
        pending.email,
        code,
      );
      if (!response.ok) throw new Error("Кодът е грешен или е изтекъл. Опитай отново.");

      const registration = (await response.json()) as GuestRegistration;
      sessionStorage.setItem(
        guestSessionKey(publicId),
        JSON.stringify({ token: registration.token, name: registration.guest.name }),
      );
      sessionStorage.removeItem(guestOtpKey(publicId));
      router.replace(`/event/${publicId}/upload`);
    } catch (requestError) {
      setError(toBulgarianError(requestError, "Кодът не можа да бъде потвърден."));
      setIsSubmitting(false);
    }
  }

  async function resendCode() {
    if (!pending) return;
    setIsResending(true);
    setError(null);
    try {
      const response = await eventsService.requestGuestOtpResponse(
        publicId,
        pending.name,
        pending.email,
      );
      if (!response.ok) throw new Error("Кодът не можа да бъде изпратен отново.");
      setNotice("Нов код беше изпратен на твоята електронна поща.");
    } catch (requestError) {
      setError(toBulgarianError(requestError, "Кодът не можа да бъде изпратен отново."));
    } finally {
      setIsResending(false);
    }
  }

  if (!pending) {
    return <main className="page-canvas grid min-h-screen place-items-center text-[#173b57]/68">Подготвяме потвърждението…</main>;
  }

  return (
    <main className="page-canvas grid min-h-screen place-items-center px-4 py-10 text-[#173b57]">
      <section className="surface-card w-full max-w-lg rounded-[2rem] p-7 sm:p-10">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#5aa9d6]/25 text-xl">✉</span>
        <p className="eyebrow mt-7">Потвърждение по електронна поща</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">Провери пощата си</h1>
        <p className="mt-3 text-sm leading-6 text-[#173b57]/68">
          Изпратихме 6-цифрен код за достъп на посочения от вас адрес на електронна поща: <strong className="text-[#173b57]">{pending.email}</strong>.
        </p>

        <form onSubmit={verifyCode} className="mt-7">
          <label htmlFor="otp-code" className="text-sm font-bold">Еднократен код</label>
          <input
            id="otp-code"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="______"
            value={code}
            onChange={(event) => {
              setCode(event.target.value.replace(/\D/g, ""));
              setError(null);
            }}
            autoFocus
            required
            aria-invalid={error ? "true" : undefined}
            className={`field-input mt-3 bg-white text-center text-xl tracking-[0.45em] placeholder:text-[#173b57]/30 ${
              error ? "border-red-500 ring-2 ring-red-500/20" : ""
            }`}
          />
          {error && <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">{error}</p>}
          {notice && <p className="mt-3 rounded-xl bg-[#5aa9d6]/15 px-4 py-3 text-sm">{notice}</p>}
          <button type="submit" disabled={isSubmitting || code.length !== 6} className="primary-action mt-5 w-full py-4 disabled:cursor-wait disabled:opacity-60">
            {isSubmitting ? <LoadingLabel text="Потвърждаване…" /> : "Продължи към качването"}
          </button>
        </form>

        <div className="mt-5 flex justify-between gap-4 text-sm font-semibold">
          <button type="button" onClick={() => router.back()} className="text-[#173b57]/68 hover:text-[#173b57]">Смени електронната поща</button>
          <button type="button" onClick={() => void resendCode()} disabled={isResending} className="rounded-full px-3 py-1.5 text-[#5aa9d6] transition hover:bg-[#5aa9d6]/15 hover:text-[#173b57] disabled:opacity-50">
            {isResending ? <LoadingLabel text="Изпращане…" compact /> : "Изпрати кода отново"}
          </button>
        </div>
      </section>
    </main>
  );
}

function LoadingLabel({ text, compact = false }: { text: string; compact?: boolean }) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <span className={`${compact ? "h-3.5 w-3.5" : "h-4 w-4"} animate-spin rounded-full border-2 border-current border-t-transparent`} aria-hidden="true" />
      {text}
    </span>
  );
}

function toBulgarianError(error: unknown, fallback: string): string {
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return "Няма връзка със сървъра. Провери интернет връзката си и опитай отново.";
  }
  return error instanceof Error ? error.message : fallback;
}

function readPendingGuestOtp(publicId: string): PendingGuestOtp | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(guestOtpKey(publicId));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<PendingGuestOtp>;
    return typeof parsed.name === "string" && typeof parsed.email === "string"
      ? {
          name: parsed.name,
          email: parsed.email,
          devCode: typeof parsed.devCode === "string" ? parsed.devCode : undefined,
        }
      : null;
  } catch {
    sessionStorage.removeItem(guestOtpKey(publicId));
    return null;
  }
}
