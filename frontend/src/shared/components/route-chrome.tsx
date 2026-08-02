"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SiteFooter } from "./site-footer";
import { LogoutButton } from "@/features/auth/components/logout-button";

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

  if (pathname.startsWith("/dashboard") || pathname === "/ai-chat") {
    return (
      <BottomNavigation
        pathname={pathname}
        showLogout
        items={[
          {
            href: "/dashboard/events",
            label: "Моите събития",
            icon: <HomeIcon />,
            active: (path) =>
              path.startsWith("/dashboard/events") &&
              path !== "/dashboard/events/new",
          },
          {
            href: "/dashboard/events/new",
            label: "Ново събитие",
            icon: <PlusIcon />,
          },
          { href: "/ai-chat", label: "AI чат", icon: <ChatIcon /> },
        ]}
      />
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

  return <BottomNavigation pathname={pathname} items={items} />;
}

interface NavigationItem {
  href: string;
  label: string;
  icon: ReactNode;
  active?: (pathname: string) => boolean;
}

function BottomNavigation({
  pathname,
  items,
  showLogout = false,
}: {
  pathname: string;
  items: NavigationItem[];
  showLogout?: boolean;
}) {
  return (
    <>
      <div className="h-24" aria-hidden="true" />
      <nav
        aria-label="Основна навигация"
        className="fixed right-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] left-3 z-50 grid h-[4.5rem] items-center rounded-[1.4rem] border border-white/80 bg-white/90 px-4 shadow-[0_18px_55px_rgb(23_59_87/24%)] backdrop-blur-xl md:right-auto md:left-1/2 md:w-[28rem] md:-translate-x-1/2"
        style={{ gridTemplateColumns: `repeat(${items.length + (showLogout ? 1 : 0)}, minmax(0, 1fr))` }}
      >
        {items.map((item) => {
          const active = item.active
            ? item.active(pathname)
            : pathname === item.href;
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
        {showLogout && <LogoutButton navigation />}
      </nav>
    </>
  );
}

function PlusIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>; }
function HomeIcon() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m3 11 9-8 9 8M5.5 9.5V21h13V9.5M9.5 21v-7h5v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
function LoginIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" /><path d="M5 20c.65-4.25 3-6.4 7-6.4s6.35 2.15 7 6.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
function ChatIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 5.5h14v10H9l-4 3v-13Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M9 10.5h.01M12 10.5h.01M15 10.5h.01" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>; }
