import { AdminEventsDashboard } from "@/features/events/components/admin/admin-events-dashboard";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { BrandLockup } from "@/shared/components/brand-lockup";

export default function AdminEventsPage() {
  return (
    <main className="admin-canvas min-h-screen text-[#173b57]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px]">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[#173b57]/10 bg-white/60 px-5 py-7 backdrop-blur-xl lg:flex">
          <BrandLockup subtitle="Администрация" />
          <nav className="mt-12 space-y-2" aria-label="Админ навигация">
            <NavItem href="#overview" label="Общ преглед" active icon={<DashboardIcon />} />
            <NavItem href="#events" label="Събития" icon={<CalendarIcon />} />
            <NavItem href="/admin/events/new" label="Създай събитие" icon={<PlusIcon />} />
          </nav>
          <div className="mt-auto rounded-2xl bg-[#173b57] p-4 text-white">
            <p className="text-xs font-bold tracking-[0.14em] text-[#8ed3f4] uppercase">Vento tip</p>
            <p className="mt-2 text-sm leading-5 text-white/75">
              Сподели QR кода на видно място, за да събереш повече моменти.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-[#173b57]/10 bg-[#f4fbff]/80 backdrop-blur-xl">
            <div className="flex h-[76px] items-center justify-between px-5 sm:px-8 lg:px-10">
              <div className="lg:hidden"><BrandLockup subtitle="Администрация" /></div>
              <div className="hidden lg:block">
                <p className="text-sm font-semibold">Админ дашборд</p>
                <p className="mt-0.5 text-xs text-[#173b57]/50">Управление на събития и галерии</p>
              </div>
              <div className="flex items-center gap-3">
                <LogoutButton />
              </div>
            </div>
          </header>

          <div className="px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
            <section id="overview" className="mb-8 scroll-mt-28">
              <p className="text-xs font-bold tracking-[0.16em] text-[#5aa9d6] uppercase">Общ преглед</p>
              <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Добре дошъл във Vento</h1>
                  <p className="mt-2 text-sm text-[#173b57]/55 sm:text-base">
                    Следи всички събития, гости и споделени моменти на едно място.
                  </p>
                </div>
                <p className="rounded-full border border-[#173b57]/10 bg-white/60 px-4 py-2 text-xs font-semibold text-[#173b57]/60">
                  {new Intl.DateTimeFormat("bg-BG", { day: "numeric", month: "long", year: "numeric" }).format(new Date())}
                </p>
              </div>
            </section>
            <AdminEventsDashboard />
          </div>
        </div>
      </div>
    </main>
  );
}

function NavItem({ href, label, icon, active = false }: { href: string; label: string; icon: React.ReactNode; active?: boolean }) {
  return <a href={href} className={`flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition ${active ? "bg-[#173b57] text-white shadow-lg shadow-[#173b57]/15" : "text-[#173b57]/60 hover:bg-[#173b57]/5 hover:text-[#173b57]"}`}><span>{icon}</span>{label}</a>;
}
function DashboardIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7" /><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7" /><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7" /><rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" strokeWidth="1.7" /></svg>; }
function CalendarIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>; }
function PlusIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
