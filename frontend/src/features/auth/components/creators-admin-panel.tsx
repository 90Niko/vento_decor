"use client";

import { useCallback, useEffect, useState } from "react";
import { getApiUrl } from "@/shared/api/client";

interface CreatorItem {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  eventCount: number;
  createdAt: string;
}

export function CreatorsAdminPanel() {
  const [creators, setCreators] = useState<CreatorItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const response = await fetch(`${getApiUrl()}/admin/creators`, { credentials: "include", cache: "no-store" });
    if (!response.ok) throw new Error("Creator профилите не могат да бъдат заредени.");
    setCreators(await response.json() as CreatorItem[]);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load().catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Възникна грешка."),
      );
    });
  }, [load]);

  async function toggle(creator: CreatorItem) {
    setPendingId(creator.id);
    setError(null);
    try {
      const response = await fetch(`${getApiUrl()}/admin/creators/${creator.id}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !creator.isActive }),
      });
      if (!response.ok) throw new Error("Статусът не може да бъде променен.");
      setCreators((items) => items.map((item) => item.id === creator.id ? { ...item, isActive: !item.isActive } : item));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Възникна грешка.");
    } finally { setPendingId(null); }
  }

  return <section id="creators" className="mb-10 scroll-mt-28 rounded-[1.75rem] border border-[#173b57]/10 bg-white/75 p-5 sm:p-7">
    <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold tracking-[.16em] text-[#5aa9d6] uppercase">Admin only</p><h2 className="mt-1 text-2xl font-semibold">Creators</h2></div><span className="text-sm text-[#173b57]/55">{creators.length} профила</span></div>
    {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="mt-5 divide-y divide-[#173b57]/10">
      {creators.length === 0 && !error ? <p className="py-6 text-sm text-[#173b57]/55">Все още няма регистрирани creators.</p> : creators.map((creator) => <div key={creator.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
        <div><p className="font-semibold">{creator.name}</p><p className="text-sm text-[#173b57]/55">{creator.email} · {creator.eventCount} събития</p></div>
        <button type="button" disabled={pendingId === creator.id} onClick={() => void toggle(creator)} className={`rounded-full px-4 py-2 text-sm font-semibold ${creator.isActive ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {creator.isActive ? "Блокирай" : "Активирай"}
        </button>
      </div>)}
    </div>
  </section>;
}
