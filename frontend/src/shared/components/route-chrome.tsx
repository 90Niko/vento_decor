"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { SiteFooter } from "./site-footer";
import { LogoutButton } from "@/features/auth/components/logout-button";
import { BrandLockup } from "./brand-lockup";

export function RouteChrome() {
  const pathname = usePathname();
  const hasNavigation =
    ["/", "/ai-chat"].includes(pathname) ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin");

  useEffect(() => {
    document.documentElement.classList.toggle(
      "has-fixed-route-navbar",
      hasNavigation,
    );
    return () =>
      document.documentElement.classList.remove("has-fixed-route-navbar");
  }, [hasNavigation]);

  const isPublicNavigationRoute = pathname === "/";
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
        brandHref="/dashboard/events"
        brandSubtitle="Creator dashboard"
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
          { href: "/ai-chat", label: "AI чат", icon: <AiIcon /> },
        ]}
      />
    );
  }

  if (pathname.startsWith("/admin")) {
    return (
      <BottomNavigation
        pathname={pathname}
        showLogout
        brandHref="/admin/events"
        brandSubtitle="Администрация"
        items={[
          {
            href: "/admin/events",
            label: "Всички събития",
            icon: <HomeIcon />,
            active: (path) =>
              path.startsWith("/admin/events") &&
              path !== "/admin/events/new",
          },
          {
            href: "/admin/events/new",
            label: "Ново събитие",
            icon: <PlusIcon />,
          },
          { href: "/ai-chat", label: "AI чат", icon: <AiIcon /> },
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

  return <BottomNavigation pathname={pathname} items={items} brandHref="/" brandSubtitle="Галерии за красиви моменти" />;
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
  brandHref,
  brandSubtitle,
}: {
  pathname: string;
  items: NavigationItem[];
  showLogout?: boolean;
  brandHref: string;
  brandSubtitle: string;
}) {
  return (
    <>
      <div className="h-24 md:hidden" aria-hidden="true" />
      <div
        className="route-navbar-background fixed inset-x-0 top-0 z-40 hidden h-[76px] border-b shadow-[0_8px_30px_rgb(23_59_87/8%)] backdrop-blur-xl md:block"
        aria-hidden="true"
      />
      <nav
        aria-label="Основна навигация"
        className="route-navbar fixed right-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] left-3 z-50 grid h-[4.5rem] items-center bg-transparent px-4 md:top-2 md:right-6 md:bottom-auto md:left-auto md:h-[3.75rem] md:w-[22rem] lg:right-10"
        style={{ gridTemplateColumns: `repeat(${items.length + (showLogout ? 1 : 0)}, minmax(0, 1fr))` }}
      >
        <div className="fixed top-2 left-6 hidden h-[3.75rem] items-center md:flex lg:left-10">
          <BrandLockup href={brandHref} subtitle={brandSubtitle} />
        </div>
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
              className={`route-nav-link relative mx-auto grid h-12 w-12 place-items-center transition active:scale-90 ${
                active ? "route-nav-active" : ""
              }`}
            >
              <span className="transition-transform duration-300">{item.icon}</span>
              <span
                aria-hidden="true"
                className={`route-nav-indicator absolute -bottom-1 h-0.5 rounded-full transition-all duration-300 ${
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
function AiIcon() { return <span className="sidebar-ai-icon relative grid h-9 w-9 place-items-center rounded-xl bg-[#5aa9d6]/12 text-[#3788b8]"><span className="sidebar-ai-halo absolute inset-0 rounded-xl border border-[#5aa9d6]/45" /><svg className="sidebar-ai-spark relative" width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m12 2.75 1.45 4.15a5.75 5.75 0 0 0 3.65 3.65L21.25 12l-4.15 1.45a5.75 5.75 0 0 0-3.65 3.65L12 21.25l-1.45-4.15a5.75 5.75 0 0 0-3.65-3.65L2.75 12l4.15-1.45a5.75 5.75 0 0 0 3.65-3.65L12 2.75Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="m19 3 .45 1.3a1.8 1.8 0 0 0 1.25 1.25L22 6l-1.3.45a1.8 1.8 0 0 0-1.25 1.25L19 9l-.45-1.3a1.8 1.8 0 0 0-1.25-1.25L16 6l1.3-.45a1.8 1.8 0 0 0 1.25-1.25L19 3Z" fill="currentColor" /></svg><span className="sidebar-ai-dot absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full border border-white bg-emerald-400" /></span>; }
