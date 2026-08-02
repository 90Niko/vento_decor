"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BrandLockup } from "@/shared/components/brand-lockup";
import { authService, readAuthError } from "@/features/auth/services/auth.service";

type AuthMode = "login" | "register";

export function AuthPage({ mode }: { mode: AuthMode }) {
  const isRegister = mode === "register";
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    const data = new FormData(form);
    try {
      const response = await authService.authenticate(mode, {
        name: isRegister ? String(data.get("name") ?? "") : undefined,
        email: String(data.get("email") ?? ""),
        password: String(data.get("password") ?? ""),
      });
      if (!response.ok) {
        setMessage(await readAuthError(response));
        return;
      }
      const result = (await response.json()) as { creator: { role: "ADMIN" | "CREATOR" } };
      router.replace(result.creator.role === "ADMIN" ? "/admin/events" : "/dashboard/events");
      router.refresh();
    } catch {
      setMessage("Няма връзка със сървъра. Опитай отново.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-canvas relative grid min-h-screen place-items-center overflow-hidden px-4 py-10 text-[#173b57] sm:px-6">
      <div aria-hidden="true" className="auth-orb auth-orb-one" />
      <div aria-hidden="true" className="auth-orb auth-orb-two" />

      <Link
        href="/"
        className="absolute top-5 right-5 z-20 grid h-11 w-11 place-items-center rounded-full border border-[#173b57]/10 bg-white/65 text-xl shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:bg-white sm:top-7 sm:right-7"
        aria-label="Към началната страница"
      >
        ×
      </Link>

      <section className="relative z-10 w-full max-w-[32rem]">
        <div className="mb-7 flex justify-center">
          <BrandLockup subtitle="Галерии за красиви моменти" />
        </div>

        <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/82 shadow-[0_28px_90px_rgb(23_59_87/14%)] backdrop-blur-2xl">
          <div className="border-b border-[#173b57]/8 px-6 pt-7 sm:px-9 sm:pt-9">
            <div className="pb-7 text-center">
              <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                {isRegister ? "Регистрация" : "Вход"}
              </h1>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#173b57]/60">
                {isRegister
                  ? "Създавай събития и събирай всички снимки на едно място."
                  : "Влез, за да продължиш към своите събития и галерии."}
              </p>
            </div>
          </div>

          <div className="px-6 py-7 sm:px-9 sm:py-8">
            <form
              key={mode}
              onSubmit={handleSubmit}
              className={`auth-form-slide min-h-[22rem] space-y-5 ${
                isRegister ? "auth-form-slide-from-right" : "auth-form-slide-from-left"
              }`}
            >
              {isRegister && (
                <AuthField label="Име и фамилия" htmlFor="name">
                  <input
                    id="name"
                    name="name"
                    autoComplete="name"
                    minLength={2}
                    required
                    className="field-input"
                    placeholder="Мария Иванова"
                  />
                </AuthField>
              )}

              <AuthField label="Имейл адрес" htmlFor="email">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="field-input"
                  placeholder="name@example.com"
                />
              </AuthField>

              <AuthField label="Парола" htmlFor="password">
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isRegister ? "new-password" : "current-password"}
                    minLength={8}
                    required
                    className="field-input pr-20"
                    placeholder="Поне 8 символа"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute top-1/2 right-4 -translate-y-1/2 text-xs font-bold text-[#173b57]/52 transition hover:text-[#173b57]"
                  >
                    {showPassword ? "Скрий" : "Покажи"}
                  </button>
                </div>
              </AuthField>

              <div className="flex items-center justify-between gap-4 text-sm">
                <label className="flex cursor-pointer items-center gap-2.5 text-[#173b57]/65">
                  <input
                    type="checkbox"
                    required={isRegister}
                    className="h-4 w-4 accent-[#173b57]"
                  />
                  {isRegister ? "Приемам условията" : "Запомни ме"}
                </label>
                {!isRegister && (
                  <button type="button" className="font-bold text-[#5a9ec5] transition hover:text-[#173b57]">
                    Забравена парола?
                  </button>
                )}
              </div>

              {message && (
                <p role="status" className="rounded-2xl bg-[#5aa9d6]/13 px-4 py-3 text-sm leading-6">
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="primary-action w-full py-4 disabled:cursor-not-allowed disabled:opacity-55"
              >
                {isSubmitting
                  ? "Моля, изчакай…"
                  : isRegister
                    ? "Създай профил"
                    : "Влез в профила"}
                {!isSubmitting && <span aria-hidden="true">→</span>}
              </button>

              <p className="text-center text-sm text-[#173b57]/58">
                {isRegister ? "Вече имаш профил?" : "Нямаш профил?"}{" "}
                <Link
                  href={isRegister ? "/login" : "/register"}
                  className="font-bold text-[#173b57] underline decoration-[#5aa9d6] decoration-2 underline-offset-4"
                >
                  {isRegister ? "Влез" : "Регистрирай се"}
                </Link>
              </p>
            </form>
          </div>
        </div>

        <p className="mt-5 text-center text-xs leading-5 text-[#173b57]/48">
          Защитен достъп за създатели на събития
        </p>
      </section>
    </main>
  );
}

function AuthField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2.5 block text-sm font-bold">
        {label}
      </label>
      {children}
    </div>
  );
}
