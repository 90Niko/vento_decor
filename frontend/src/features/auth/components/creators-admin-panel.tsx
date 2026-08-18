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
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

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
    setOpenMenuId(null);
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
        <div className="flex min-h-10 items-center justify-end gap-2">
          {openMenuId === creator.id && (
            <div className="event-actions-menu flex items-center gap-2 rounded-full bg-[#173b57]/5 p-1.5">
              <button
                type="button"
                disabled={pendingId === creator.id}
                onClick={() => void toggle(creator)}
                aria-label={creator.isActive ? `Блокирай ${creator.name}` : `Активирай ${creator.name}`}
                title={creator.isActive ? "Блокирай профила" : "Активирай профила"}
                className={`grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm transition disabled:cursor-wait disabled:opacity-40 ${creator.isActive ? "text-[#173b57]/60 hover:bg-[#173b57] hover:text-white" : "text-emerald-600 hover:bg-emerald-600 hover:text-white"}`}
              >
                {creator.isActive ? <BlockIcon /> : <ActivateIcon />}
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={() => setOpenMenuId((current) => current === creator.id ? null : creator.id)}
            aria-expanded={openMenuId === creator.id}
            aria-label={`Действия за ${creator.name}`}
            title="Действия"
            className={`grid h-10 w-10 place-items-center rounded-full transition ${openMenuId === creator.id ? "rotate-90 bg-[#173b57] text-white" : "bg-[#173b57]/5 text-[#173b57]/55 hover:bg-[#173b57]/10 hover:text-[#173b57]"}`}
          >
            <MoreIcon />
          </button>
        </div>
      </div>)}
    </div>
  </section>;
}

function MoreIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></svg>;
}

function BlockIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" /><path d="m6.4 6.4 11.2 11.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function ActivateIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
