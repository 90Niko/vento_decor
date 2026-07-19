"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { eventsService } from "@/features/events/services/events.service";
import type { AdminEventDetails } from "@/features/events/types/events";

export function EditEventForm({ publicId }: { publicId: string }) {
  const router = useRouter();
  const [event, setEvent] = useState<AdminEventDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void eventsService.getAdminEventResponse(publicId).then(async (response) => {
      if (!response.ok) return setError("Събитието не може да бъде заредено.");
      setEvent((await response.json()) as AdminEventDetails);
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
      themeColor: String(data.get("themeColor") ?? "ocean"),
    });
    setSaving(false);
    if (!response.ok) return setError("Промените не могат да бъдат запазени.");
    router.push(`/admin/events/${publicId}`);
    router.refresh();
  }

  if (error && !event) return <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>;
  if (!event) return <p className="p-8 text-center">Зареждане…</p>;

  return (
    <form onSubmit={submit} className="surface-card space-y-6 rounded-[2rem] p-6 sm:p-9">
      <Field label="Име на събитието"><input name="title" required maxLength={150} defaultValue={event.title} className="field-input" /></Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Тип"><select name="eventType" defaultValue={event.eventType} className="field-input"><option value="wedding">Сватба</option><option value="birthday">Рожден ден</option><option value="baptism">Кръщене</option><option value="prom">Бал</option><option value="corporate">Корпоративно</option><option value="other">Друго</option></select></Field>
        <Field label="Локация"><input name="location" required defaultValue={event.location ?? ""} className="field-input" /></Field>
        <Field label="Начало"><input name="startAt" type="datetime-local" defaultValue={toLocal(event.startAt)} className="field-input" /></Field>
        <Field label="Краен срок за качване"><input name="uploadDeadline" type="datetime-local" defaultValue={toLocal(event.uploadDeadline)} className="field-input" /></Field>
      </div>
      <Field label="Описание"><textarea name="description" rows={5} defaultValue={event.description ?? ""} className="field-input resize-none" /></Field>
      <Field label="Цветова тема"><select name="themeColor" defaultValue={event.themeColor} className="field-input"><option value="ocean">Океан</option><option value="rose">Роза</option><option value="sage">Градински чай</option><option value="lavender">Лавандула</option><option value="terracotta">Теракота</option><option value="midnight">Полунощ</option></select></Field>
      {error && <p className="rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
      <button disabled={saving} className="primary-action w-full py-4 disabled:opacity-50">{saving ? "Запазване…" : "Запази промените"}</button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold">{label}</span>{children}</label>;
}
function toLocal(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
