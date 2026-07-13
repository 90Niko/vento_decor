import Link from "next/link";
import { EventGallery } from "./event-gallery";
import { BrandLockup } from "../../../brand-lockup";

interface EventDetailsPageProps {
  params: Promise<{ publicId: string }>;
}

export default async function EventDetailsPage({ params }: EventDetailsPageProps) {
  const { publicId } = await params;

  return (
    <main className="page-canvas min-h-screen pb-20 text-[#173b57]">
      <div className="page-container relative max-w-7xl">
        <header className="sticky top-3 z-30 mb-10 pt-3 sm:top-5 sm:pt-5">
          <div className="surface-card flex flex-wrap items-center justify-between gap-3 rounded-2xl px-3.5 py-3 sm:rounded-[1.4rem] sm:px-5">
            <BrandLockup
              href="/admin/events"
              subtitle="Галерия на събитието"
            />
          <Link
            href="/admin/events"
              className="secondary-action px-4 py-2.5 text-xs sm:text-sm"
          >
            ← Всички събития
          </Link>
          </div>
        </header>

        <EventGallery publicId={publicId} />
      </div>
    </main>
  );
}
