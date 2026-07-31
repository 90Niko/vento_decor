import { AiChat } from "@/features/ai/components/ai-chat";
import { BrandLockup } from "@/shared/components/brand-lockup";
import { LogoutButton } from "@/features/auth/components/logout-button";

export default function AiChatPage() {
  return (
    <main className="admin-canvas min-h-screen text-[#173b57]">
      <header className="border-b border-[#173b57]/10 bg-[#f4fbff]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-5xl items-center justify-between px-5 sm:px-8">
          <BrandLockup subtitle="AI асистент" />
          <div className="flex items-center gap-3">
            <LogoutButton iconOnly />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-8 sm:py-10">
        <AiChat />
      </div>
    </main>
  );
}
