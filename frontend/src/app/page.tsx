import Link from "next/link";
import { BrandLockup } from "./brand-lockup";
import { UploadStudio } from "./upload-studio";

export default function Home() {
  return (
    <main className="page-canvas min-h-screen pb-20 text-[#17362d]">
      <div className="page-container relative">
        <header className="sticky top-3 z-30 pt-3 sm:top-5 sm:pt-5">
          <div className="surface-card flex items-center justify-between rounded-2xl px-3.5 py-3 sm:rounded-[1.4rem] sm:px-5">
            <BrandLockup subtitle="Галерия за красиви моменти" />
            <Link href="/admin/events" className="secondary-action px-4 py-2.5 text-xs sm:text-sm">
              <span className="hidden sm:inline">Управление на</span> събития
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </header>

        <section className="grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-[minmax(0,1.15fr)_minmax(330px,0.65fr)] lg:gap-16 lg:py-28">
          <div className="reveal-up">
            <p className="eyebrow">Спомените на едно място</p>
            <h1 className="mt-6 max-w-3xl text-5xl leading-[0.98] font-semibold tracking-[-0.055em] text-balance sm:text-7xl lg:text-[5.4rem]">
              Всеки красив момент заслужава своя галерия.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#60736b] sm:text-lg sm:leading-8">
              Събирай снимки от гостите чрез личен линк и код за сканиране.
              Бързо качване, подредена галерия и спомени, готови за споделяне.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#качване" className="primary-action">
                Качи снимки
                <span aria-hidden="true">↓</span>
              </a>
              <Link href="/admin/events" className="secondary-action">
                Създай събитие
              </Link>
            </div>
          </div>

          <div className="surface-card reveal-up relative overflow-hidden rounded-[2rem] p-6 sm:p-8 [animation-delay:120ms]">
            <div className="absolute top-0 right-0 h-36 w-36 translate-x-10 -translate-y-10 rounded-full bg-[#d7e0bf]/80 blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold tracking-[0.16em] text-[#a45d3f] uppercase">
                  Лесно за всички
                </p>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#17362d] text-white">
                  ✦
                </span>
              </div>
              <div className="mt-10 space-y-3">
                <Feature number="01" title="Създай събитие" text="Получаваш личен линк и код." />
                <Feature number="02" title="Покани гостите" text="Те въвеждат име и качват." />
                <Feature number="03" title="Запази момента" text="Всичко остава в една галерия." />
              </div>
            </div>
          </div>
        </section>

        <section id="качване" className="scroll-mt-28">
          <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Медия център</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
                Добави своите кадри
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#60736b] sm:text-right">
              Избери до 10 снимки наведнъж. Ще ги прегледаш преди изпращане.
            </p>
          </div>
          <UploadStudio />
        </section>
      </div>
    </main>
  );
}

function Feature({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="group flex gap-4 rounded-2xl border border-[#17362d]/8 bg-white/55 p-4 transition hover:border-[#a45d3f]/20 hover:bg-white/80">
      <span className="mt-0.5 text-xs font-bold text-[#a45d3f]">{number}</span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-[#60736b]">{text}</p>
      </div>
    </div>
  );
}
