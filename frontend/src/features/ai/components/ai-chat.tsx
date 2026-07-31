"use client";

import { FormEvent, useRef, useState } from "react";
import { getApiUrl } from "@/shared/api/client";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function AiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
    if (!content || isSending) return;

    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsSending(true);

    try {
      const response = await fetch(`${getApiUrl()}/ai/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-20) }),
      });
      if (!response.ok) {
        throw new Error(await readError(response));
      }
      const result = (await response.json()) as { message: string };
      setMessages((current) => [
        ...current,
        { role: "assistant", content: result.message },
      ]);
      requestAnimationFrame(() => endRef.current?.scrollIntoView({ behavior: "smooth" }));
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "AI асистентът временно не е достъпен.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <section className="flex min-h-[70vh] flex-col overflow-hidden rounded-[2rem] border border-[#173b57]/10 bg-white/80 shadow-[0_24px_80px_rgb(23_59_87/10%)]">
      <div className="border-b border-[#173b57]/10 px-5 py-5 sm:px-7">
        <p className="text-xs font-bold tracking-[0.16em] text-[#5aa9d6] uppercase">
          Grok AI
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">
          Vento AI асистент
        </h1>
        <p className="mt-1 text-sm text-[#173b57]/55">
          Идеи за събития, текстове за покани, програма и организация.
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-6 sm:px-7">
        {messages.length === 0 ? (
          <div className="grid min-h-[40vh] place-items-center text-center">
            <div>
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#eaf6ff] text-2xl">
                ✦
              </div>
              <h2 className="mt-5 text-xl font-semibold">С какво да помогна?</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#173b57]/55">
                Например: „Направи програма за сватба с 80 гости“ или
                „Предложи текст за покана за рожден ден“.
              </p>
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 sm:max-w-[72%] ${
                  message.role === "user"
                    ? "rounded-br-md bg-[#173b57] text-white"
                    : "rounded-bl-md bg-[#eaf6ff] text-[#173b57]"
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        {isSending ? (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-bl-md bg-[#eaf6ff] px-4 py-3 text-sm text-[#173b57]/60">
              AI пише…
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <form onSubmit={sendMessage} className="border-t border-[#173b57]/10 p-4 sm:p-5">
        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
        <div className="flex items-end gap-3 rounded-2xl border border-[#173b57]/15 bg-white p-2 focus-within:border-[#5aa9d6]">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            rows={2}
            maxLength={4000}
            placeholder="Напиши съобщение…"
            className="min-h-12 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-[#173b57]/35"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#173b57] text-white transition hover:bg-[#5aa9d6] disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Изпрати"
          >
            ↑
          </button>
        </div>
      </form>
    </section>
  );
}

async function readError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: string | string[] };
    if (typeof payload.message === "string") return payload.message;
    if (Array.isArray(payload.message)) return payload.message.join(" ");
  } catch {
    // Fall back to a status-based message.
  }
  return `AI заявката е неуспешна (код ${response.status}).`;
}
