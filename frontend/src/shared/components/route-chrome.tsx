"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteFooter } from "./site-footer";

export function RouteChrome() {
  const pathname = usePathname();

  const isPublicNavigationRoute = ["/", "/login", "/register"].includes(pathname);
  if (isPublicNavigationRoute) {
    return (
      <>
        {pathname === "/" && <SiteFooter />}
        <PublicBottomNavigation pathname={pathname} />
      </>
    );
  }

  return null;
}

function PublicBottomNavigation({ pathname }: { pathname: string }) {
  const items = [
    { href: "/", label: "Начало", icon: <HomeIcon /> },
    { href: "/register", label: "Регистрация", icon: <PlusIcon /> },
    { href: "/login", label: "Вход", icon: <LoginIcon /> },
  ];

  return (
    <>
      <div className="h-24 md:hidden" aria-hidden="true" />
      <nav
        aria-label="Основна мобилна навигация"
        className="fixed right-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] left-3 z-50 grid h-[4.5rem] grid-cols-3 items-center rounded-[1.4rem] border border-white/80 bg-white/90 px-4 shadow-[0_18px_55px_rgb(23_59_87/24%)] backdrop-blur-xl md:hidden"
      >
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={`relative mx-auto grid h-12 w-12 place-items-center transition active:scale-90 ${
                active ? "text-[#173b57]" : "text-[#173b57]/38 hover:text-[#5aa9d6]"
              }`}
            >
              <span className="transition-transform duration-300">{item.icon}</span>
              <span
                aria-hidden="true"
                className={`absolute -bottom-1 h-0.5 rounded-full bg-[#5aa9d6] transition-all duration-300 ${
                  active ? "w-6 opacity-100" : "w-0 opacity-0"
                }`}
              />
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function PlusIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>; }
function HomeIcon() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m3 11 9-8 9 8M5.5 9.5V21h13V9.5M9.5 21v-7h5v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function LoginIcon() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 4h5v16h-5M10 8l4 4-4 4m4-4H3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
