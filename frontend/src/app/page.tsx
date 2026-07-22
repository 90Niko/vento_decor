import Link from "next/link";
import { BrandLockup } from "@/shared/components/brand-lockup";

export default function Home() {
  return (
    <main className="page-canvas min-h-screen pb-20 text-[#173b57]">
      <div className="page-container relative">
        <header className="sticky top-3 z-30 pt-3 sm:top-5 sm:pt-5">
          <div className="surface-card flex items-center rounded-2xl px-3.5 py-3 sm:rounded-[1.4rem] sm:px-5">
            <BrandLockup subtitle="Галерия за красиви моменти" />
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
            <p className="mt-7 text-xs leading-5 text-[#173b57]/52">
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
              <div className="relative mt-10">
                <div
                  aria-hidden="true"
                  className="absolute top-7 bottom-7 left-[1.4rem] w-px bg-gradient-to-b from-[#5aa9d6] via-[#5aa9d6]/45 to-[#173b57]/15"
                />
                <Feature
                  number="01"
                  title="Създай събитие"
                  text="Получи личен линк за своите гости."
                  first
                />
                <Feature
                  number="02"
                  title="Сподели поканата"
                  text="Изпрати линка или постави QR кода на видно място."
                />
                <Feature
                  number="03"
                  title="Събери моментите"
                  text="Гостите влизат с име и качват снимките си в общата галерия."
                  last
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="eyebrow">Всички гледни точки</p>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-balance sm:text-6xl">
              Една галерия, създадена от всички гости.
            </h2>
            <p className="mt-5 max-w-xl leading-7 text-[#173b57]/65">
              Всеки добавя своите моменти през телефона си, а ти получаваш цялата история на събитието на едно място.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              {[
                "Сватби",
                "Рождени дни",
                "Фирмени събития",
                "Семейни празници",
              ].map((occasion) => (
                <span key={occasion} className="rounded-full border border-[#173b57]/10 bg-white/65 px-4 py-2 text-xs font-semibold text-[#173b57]/65">
                  {occasion}
                </span>
              ))}
            </div>
          </div>

          <GalleryPreview />
        </section>

        <section className="py-16 sm:py-24">
          <div className="mb-8 max-w-2xl">
            <p className="eyebrow">Лесно за всички</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
              Без излишни стъпки
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Benefit icon="↗" title="Един линк" text="Споделяш веднъж и всички гости влизат на едно място." />
            <Benefit icon="◎" title="Без регистрация" text="Гостът въвежда име и започва да качва веднага." />
            <Benefit icon="✦" title="Твой контрол" text="Управляваш събитията и снимките от личния си dashboard." />
          </div>
        </section>

        <section className="mb-16 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#173b57,#275f83_58%,#5aa9d6)] px-6 py-10 text-center text-white shadow-[0_28px_80px_rgb(23_59_87/18%)] sm:mb-24 sm:px-10 sm:py-14">
          <p className="text-xs font-bold tracking-[0.18em] text-[#8ed3f4] uppercase">Следващият момент започва тук</p>
          <h2 className="mx-auto mt-4 max-w-3xl text-3xl font-semibold tracking-[-0.045em] text-balance sm:text-5xl">
            Създай място за спомените от твоето събитие.
          </h2>
          <div className="mt-8 flex justify-center">
            <Link href="/register" className="rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#173b57] transition hover:-translate-y-0.5 hover:bg-[#eaf6ff]">
              Започни сега →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function GalleryPreview() {
  const moments = [
    { label: "Първият танц", guest: "Мария", gradient: "from-[#173b57] via-[#356f91] to-[#8ed3f4]", symbol: "♪" },
    { label: "Наздраве", guest: "Иван", gradient: "from-[#d59a7b] via-[#f2c9ad] to-[#f7e6d5]", symbol: "✦" },
    { label: "Нашите хора", guest: "Елена", gradient: "from-[#5d7e6f] via-[#91b19e] to-[#d8e6dc]", symbol: "♡" },
  ];

  return (
    <div className="surface-card overflow-hidden rounded-[2rem] p-4 sm:p-6">
      <div className="flex items-center justify-between px-1 pb-4">
        <div><p className="text-sm font-semibold">Анна & Никола</p><p className="mt-0.5 text-xs text-[#173b57]/45">24 споделени момента</p></div>
        <span className="rounded-full bg-[#173b57] px-3 py-1.5 text-[10px] font-bold tracking-[0.12em] text-white uppercase">Live gallery</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {moments.map((moment, index) => (
          <article key={moment.label} className={`relative min-h-40 overflow-hidden rounded-2xl bg-gradient-to-br ${moment.gradient} p-4 text-white ${index === 0 ? "col-span-2 aspect-[2/1] sm:aspect-[2.25/1]" : "aspect-[4/5]"}`}>
            <span className="absolute inset-0 grid place-items-center text-6xl text-white/30 sm:text-7xl" aria-hidden="true">{moment.symbol}</span>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/55 to-transparent p-4 pt-10">
              <p className="text-sm font-semibold">{moment.label}</p>
              <div className="mt-1 flex items-center justify-between text-[11px] text-white/75"><span>от {moment.guest}</span><span>♡ {index + 3}</span></div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Benefit({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <article className="rounded-[1.5rem] border border-[#173b57]/8 bg-white/60 p-5 transition hover:-translate-y-1 hover:border-[#5aa9d6]/30 hover:bg-white/85 sm:p-6">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#173b57] text-sm text-white" aria-hidden="true">{icon}</span>
      <h3 className="mt-5 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#173b57]/60">{text}</p>
    </article>
  );
}

function Feature({
  number,
  title,
  text,
  first = false,
  last = false,
}: {
  number: string;
  title: string;
  text: string;
  first?: boolean;
  last?: boolean;
}) {
  return (
    <div className={`group relative flex gap-4 ${last ? "pb-0" : "pb-5"}`}>
      <div className="relative z-10 flex w-11 shrink-0 justify-center">
        <span
          className={`grid h-11 w-11 place-items-center rounded-full border text-[11px] font-bold transition duration-300 group-hover:scale-105 ${
            first
              ? "border-[#173b57] bg-[#173b57] text-white shadow-[0_8px_20px_rgb(23_59_87/22%)]"
              : last
                ? "border-[#5aa9d6] bg-[#5aa9d6] text-white shadow-[0_8px_20px_rgb(90_169_214/24%)]"
                : "border-[#5aa9d6]/30 bg-[#f7fcff] text-[#5aa9d6]"
          }`}
        >
          {number}
        </span>
      </div>
      <div className="min-w-0 flex-1 rounded-2xl border border-[#173b57]/8 bg-white/60 px-5 py-4 transition duration-300 group-hover:translate-x-1 group-hover:border-[#5aa9d6]/35 group-hover:bg-white/90 group-hover:shadow-[0_12px_28px_rgb(23_59_87/8%)]">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">{title}</p>
          {!last && <span className="text-sm text-[#5aa9d6]" aria-hidden="true">↓</span>}
          {last && <span className="text-sm text-[#5aa9d6]" aria-hidden="true">✓</span>}
        </div>
        <p className="mt-1.5 text-sm leading-6 text-[#173b57]/68">{text}</p>
      </div>
    </div>
  );
}
