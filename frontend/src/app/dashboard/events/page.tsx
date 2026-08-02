import Link from "next/link";
import { AdminEventsDashboard } from "@/features/events/components/admin/admin-events-dashboard";

export default function CreatorDashboardPage() {
  return (
    <main className="admin-canvas min-h-screen text-[#173b57]">
      <header className="sticky top-0 z-40 border-b border-[#173b57]/10 bg-[#f4fbff]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1400px] items-center justify-between px-5 sm:px-8">
          <span />
          <div className="flex items-center gap-3">
            <Link href="/ai-chat" className="secondary-action px-4 py-2.5 text-sm">✦ AI чат</Link>
            <Link href="/dashboard/events/new" className="primary-action px-4 py-2.5 text-sm">+ Ново събитие</Link>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-[1400px] px-5 py-10 sm:px-8">
        <h1 className="mb-8 text-4xl font-semibold tracking-[-0.045em]">Моите събития</h1>
        <aside className="mb-8 rounded-2xl bg-[#173b57] p-4 text-white sm:max-w-md">
          <p className="text-xs font-bold tracking-[0.14em] text-[#8ed3f4] uppercase">
            Vento tip
          </p>
          <p className="mt-2 text-sm leading-5 text-white/75">
            Сподели QR кода на видно място, за да събереш повече моменти.
          </p>
        </aside>
        <AdminEventsDashboard basePath="/dashboard/events" />
      </div>
    </main>
  );
}
