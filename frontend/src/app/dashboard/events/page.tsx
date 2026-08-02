import { AdminEventsDashboard } from "@/features/events/components/admin/admin-events-dashboard";
import { SiteFooter } from "@/shared/components/site-footer";

export default function CreatorDashboardPage() {
  return (
    <>
    <main className="admin-canvas min-h-screen text-[#173b57]">
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
    <SiteFooter />
    </>
  );
}
