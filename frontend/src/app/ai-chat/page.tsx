import { AiChat } from "@/features/ai/components/ai-chat";

export default function AiChatPage() {
  return (
    <main className="admin-canvas min-h-screen text-[#173b57]">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
        <AiChat />
      </div>
    </main>
  );
}
