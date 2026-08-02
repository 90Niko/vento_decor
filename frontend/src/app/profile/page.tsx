"use client";

import { useEffect, useState } from "react";
import { getApiUrl } from "@/shared/api/client";

interface Profile {
  name: string;
  email: string;
  role: "ADMIN" | "CREATOR";
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void fetch(`${getApiUrl()}/auth/me`, {
      credentials: "include",
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Профилът не може да бъде зареден.");
        const result = (await response.json()) as { creator: Profile };
        setProfile(result.creator);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "Възникна грешка.");
        }
      });
    return () => controller.abort();
  }, []);

  return (
    <main className="admin-canvas min-h-screen px-5 py-10 text-[#173b57] sm:px-8">
      <section className="surface-card mx-auto w-full max-w-2xl rounded-[2rem] p-7 sm:p-10">
        <p className="text-xs font-bold tracking-[0.16em] text-[#5aa9d6] uppercase">
          Моят профил
        </p>
        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.05em]">
          Информация за профила
        </h1>
        {error ? (
          <p className="mt-7 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>
        ) : !profile ? (
          <div className="mt-8 space-y-3">
            <div className="h-16 animate-pulse rounded-2xl bg-[#173b57]/5" />
            <div className="h-16 animate-pulse rounded-2xl bg-[#173b57]/5" />
            <div className="h-16 animate-pulse rounded-2xl bg-[#173b57]/5" />
          </div>
        ) : (
          <dl className="mt-8 divide-y divide-[#173b57]/10">
            <ProfileDetail label="Име" value={profile.name} />
            <ProfileDetail label="Имейл" value={profile.email} />
            <ProfileDetail
              label="Тип профил"
              value={profile.role === "ADMIN" ? "Администратор" : "Creator"}
            />
          </dl>
        )}
      </section>
    </main>
  );
}

function ProfileDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 py-5 sm:grid-cols-[10rem_1fr] sm:items-center">
      <dt className="text-sm font-semibold text-[#173b57]/50">{label}</dt>
      <dd className="font-semibold break-all">{value}</dd>
    </div>
  );
}
