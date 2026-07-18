import Link from "next/link";
import { BrandLockup } from "@/shared/components/brand-lockup";

export default function Home() {
  return (
    <main className="page-canvas min-h-screen pb-20 text-[#173b57]">
      <div className="page-container relative">
        <header className="sticky top-3 z-30 pt-3 sm:top-5 sm:pt-5">
          <div className="surface-card flex items-center justify-between rounded-2xl px-3.5 py-3 sm:rounded-[1.4rem] sm:px-5">
            <BrandLockup subtitle="Галерия за красиви моменти" />
            <Link href="/login" className="secondary-action px-4 py-2.5 text-xs sm:text-sm">
              Вход за създатели
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </header>

        <section className="grid min-h-[calc(100vh-7rem)] items-center gap-10 py-16 sm:py-24 lg:grid-cols-[minmax(0,1.15fr)_minmax(330px,0.65fr)] lg:gap-16">
          <div className="reveal-up">
            <p className="eyebrow">Спомените на едно място</p>
            <h1 className="mt-6 max-w-3xl text-5xl leading-[0.98] font-semibold tracking-[-0.055em] text-balance sm:text-7xl lg:text-[5.4rem]">
              Всеки красив момент заслужава своя галерия.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#173b57]/68 sm:text-lg sm:leading-8">
              Създай събитие, сподели личния му линк и събери снимките на всички гости в една подредена галерия.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className="primary-action">
                Създай профил
                <span aria-hidden="true">→</span>
              </Link>
              <Link href="/login" className="secondary-action">
                Вече имам профил
              </Link>
            </div>
            <p className="mt-5 text-xs leading-5 text-[#173b57]/52">
              Гостите не се регистрират — те качват снимки през линка на конкретното събитие.
            </p>
          </div>

          <div className="surface-card reveal-up relative overflow-hidden rounded-[2rem] p-6 sm:p-8 [animation-delay:120ms]">
            <div className="absolute top-0 right-0 h-36 w-36 translate-x-10 -translate-y-10 rounded-full bg-[#5aa9d6]/35 blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold tracking-[0.16em] text-[#5aa9d6] uppercase">
                  Как работи
                </p>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#173b57] text-white">
                  ✦
                </span>
              </div>
              <div className="mt-10 space-y-3">
                <Feature
                  number="01"
                  title="Създай събитие"
                  text="Получи личен линк за своите гости."
                />
                <Feature
                  number="02"
                  title="Сподели поканата"
                  text="Гостите влизат и потвърждават своя имейл."
                />
                <Feature
                  number="03"
                  title="Събери моментите"
                  text="Всички снимки пристигат в общата галерия."
                />
              </div>
            </div>
          </div>
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
    <div className="group flex gap-4 rounded-2xl border border-[#173b57]/8 bg-white/55 p-4 transition hover:border-[#5aa9d6]/30 hover:bg-white/80">
      <span className="mt-0.5 text-xs font-bold text-[#5aa9d6]">{number}</span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-sm text-[#173b57]/68">{text}</p>
      </div>
    </div>
  );
}
