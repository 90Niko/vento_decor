"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { getApiUrl } from "@/shared/api/client";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const suggestions = [
  { icon: "✦", label: "План за събитие", prompt: "Направи ми подробен план за елегантна сватба с 80 гости." },
  { icon: "✎", label: "Текст за покана", prompt: "Напиши топъл и модерен текст за покана за рожден ден." },
  { icon: "◌", label: "Идеи за декор", prompt: "Дай ми 5 модерни идеи за декор на лятно събитие." },
  { icon: "⌁", label: "Програма за гости", prompt: "Създай забавна програма за гостите на фирмено събитие." },
];

export function AiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  async function submitMessage(content: string) {
    const cleanContent = content.trim();
    if (!cleanContent || isSending) return;

    const nextMessages = [
      ...messages,
      { role: "user" as const, content: cleanContent },
    ];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsSending(true);
    if (textareaRef.current) textareaRef.current.style.height = "52px";

    try {
      const response = await fetch(`${getApiUrl()}/ai/chat`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-20) }),
      });
      if (!response.ok) throw new Error(await readError(response));
      const result = (await response.json()) as { message: string };
      setMessages((current) => [
        ...current,
        { role: "assistant", content: result.message },
      ]);
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

  function sendMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage(input);
  }

  async function copyMessage(content: string, index: number) {
    await navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    window.setTimeout(() => setCopiedIndex(null), 1600);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setMessages([]);
          setError(null);
          setInput("");
          textareaRef.current?.focus();
        }}
        className="fixed top-24 right-4 z-[100] flex items-center gap-2 rounded-2xl bg-[#173b57] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_35px_rgb(23_59_87/30%)] transition hover:-translate-y-1 hover:bg-[#397ca9] hover:shadow-[0_16px_40px_rgb(23_59_87/35%)] sm:right-8"
        title="Започни нов разговор"
      >
        <span className="grid h-6 w-6 place-items-center rounded-lg bg-white/15 text-lg leading-none">
          +
        </span>
        Нов чат
      </button>

      <section className="ai-chat-shell relative flex min-h-[76vh] flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 shadow-[0_32px_100px_rgb(23_59_87/15%)] backdrop-blur-2xl">
      <div className="pointer-events-none absolute -top-24 -right-20 h-64 w-64 rounded-full bg-[#8ed3f4]/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-[#f6d6e5]/30 blur-3xl" />

      <div className="relative flex items-center justify-between border-b border-[#173b57]/8 px-5 py-4 sm:px-7">
        <div className="flex items-center gap-3.5">
          <div className="ai-orb relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-[#173b57] to-[#5aa9d6] text-lg text-white shadow-lg shadow-[#5aa9d6]/25">
            ✦
            <span className="absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-[-0.025em] sm:text-xl">
                Vento AI
              </h1>
              <span className="rounded-full bg-[#eaf6ff] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#3788b8] uppercase">
                Grok
              </span>
            </div>
            <p className="text-xs text-[#173b57]/48">Онлайн · твоят event асистент</p>
          </div>
        </div>
        <div className="h-10 w-24 shrink-0" aria-hidden="true" />
      </div>

      <div className="relative flex-1 space-y-5 overflow-y-auto px-4 py-6 sm:px-7 sm:py-8">
        {messages.length === 0 ? (
          <div className="ai-welcome mx-auto flex min-h-[48vh] max-w-2xl flex-col items-center justify-center text-center">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-3xl bg-[#8ed3f4]/15" />
              <div className="relative grid h-20 w-20 place-items-center rounded-3xl border border-white bg-gradient-to-br from-[#eaf6ff] to-white text-3xl shadow-xl shadow-[#5aa9d6]/15">
                ✦
              </div>
            </div>
            <p className="mt-7 text-xs font-bold tracking-[0.18em] text-[#5aa9d6] uppercase">
              Твоята идея започва тук
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              Какво ще създадем днес?
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-[#173b57]/52 sm:text-base">
              От първата идея до последния детайл — попитай ме за организация,
              декор, покани или незабравима програма.
            </p>
            <div className="mt-8 grid w-full grid-cols-2 gap-2.5 sm:grid-cols-4">
              {suggestions.map((suggestion, index) => (
                <button
                  key={suggestion.label}
                  type="button"
                  onClick={() => void submitMessage(suggestion.prompt)}
                  className="ai-suggestion group rounded-2xl border border-[#173b57]/8 bg-white/65 p-3 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#5aa9d6]/35 hover:bg-white hover:shadow-lg hover:shadow-[#5aa9d6]/10"
                  style={{ animationDelay: `${120 + index * 70}ms` }}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-[#eaf6ff] text-[#3788b8] transition group-hover:scale-110 group-hover:bg-[#173b57] group-hover:text-white">
                    {suggestion.icon}
                  </span>
                  <span className="mt-3 block text-xs font-semibold sm:text-[13px]">
                    {suggestion.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`ai-message group flex items-end gap-2.5 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" ? (
                <div className="mb-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#173b57] to-[#5aa9d6] text-xs text-white">
                  ✦
                </div>
              ) : null}
              <div className="relative">
                <div
                  className={`max-w-[82vw] whitespace-pre-wrap rounded-2xl px-4 py-3.5 text-sm leading-6 sm:max-w-xl ${
                    message.role === "user"
                      ? "rounded-br-md bg-gradient-to-br from-[#173b57] to-[#24577d] text-white shadow-lg shadow-[#173b57]/12"
                      : "rounded-bl-md border border-[#173b57]/6 bg-white/85 text-[#173b57] shadow-sm"
                  }`}
                >
                  {message.content}
                </div>
                {message.role === "assistant" ? (
                  <button
                    type="button"
                    onClick={() => void copyMessage(message.content, index)}
                    className="mt-1.5 text-[11px] font-semibold text-[#173b57]/35 opacity-0 transition hover:text-[#5aa9d6] group-hover:opacity-100"
                  >
                    {copiedIndex === index ? "Копирано ✓" : "Копирай"}
                  </button>
                ) : null}
              </div>
            </div>
          ))
        )}
        {isSending ? (
          <div className="ai-message flex items-end gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-[#173b57] to-[#5aa9d6] text-xs text-white">
              ✦
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-[#173b57]/6 bg-white/85 px-4 py-4 shadow-sm">
              <span className="ai-typing-dot h-1.5 w-1.5 rounded-full bg-[#5aa9d6]" />
              <span className="ai-typing-dot h-1.5 w-1.5 rounded-full bg-[#5aa9d6]" />
              <span className="ai-typing-dot h-1.5 w-1.5 rounded-full bg-[#5aa9d6]" />
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>

      <form onSubmit={sendMessage} className="relative border-t border-[#173b57]/8 bg-white/55 p-3 backdrop-blur-xl sm:p-5">
        {error ? (
          <p className="mb-3 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {error}
          </p>
        ) : null}
        <div className="flex items-end gap-2 rounded-[1.35rem] border border-[#173b57]/12 bg-white p-2 shadow-[0_10px_35px_rgb(23_59_87/8%)] transition focus-within:border-[#5aa9d6]/60 focus-within:shadow-[0_12px_40px_rgb(90_169_214/16%)]">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              event.currentTarget.style.height = "52px";
              event.currentTarget.style.height = `${Math.min(event.currentTarget.scrollHeight, 140)}px`;
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            rows={1}
            maxLength={4000}
            placeholder="Сподели идея или задай въпрос…"
            className="h-[52px] min-h-[52px] flex-1 resize-none bg-transparent px-3 py-3.5 text-sm leading-6 outline-none placeholder:text-[#173b57]/32"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="group grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[#173b57] to-[#397ca9] text-white shadow-lg shadow-[#173b57]/15 transition hover:-translate-y-0.5 hover:shadow-xl disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-35"
            aria-label="Изпрати"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m5 12 14-7-4.5 14-2.8-5.2L5 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="m11.7 13.8 3.2-3.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-[#173b57]/32">
          Vento AI може да допуска грешки · Enter за изпращане · Shift + Enter за нов ред
        </p>
      </form>
      </section>
    </>
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
