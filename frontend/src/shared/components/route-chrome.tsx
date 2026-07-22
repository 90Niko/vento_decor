"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteFooter } from "./site-footer";

export function RouteChrome() {
  const pathname = usePathname();

  if (pathname === "/") return <SiteFooter />;

  const isAdmin = pathname.startsWith("/admin");
  const isCreator = pathname.startsWith("/dashboard");
  if (!isAdmin && !isCreator) return null;

  const root = isAdmin ? "/admin/events" : "/dashboard/events";
  const items = isAdmin
    ? [
        { href: root, label: "Събития", icon: <EventsIcon /> },
        { href: `${root}/new`, label: "Създай", icon: <PlusIcon />, primary: true },
        { href: `${root}#creators`, label: "Creators", icon: <PeopleIcon /> },
      ]
    : [
        { href: root, label: "Събития", icon: <EventsIcon /> },
        { href: `${root}/new`, label: "Създай", icon: <PlusIcon />, primary: true },
        { href: "/", label: "Начало", icon: <HomeIcon /> },
      ];

  return (
    <>
      <div className="h-24 md:hidden" aria-hidden="true" />
      <nav
        aria-label={isAdmin ? "Мобилна admin навигация" : "Мобилна creator навигация"}
        className="fixed right-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] left-3 z-50 grid grid-cols-3 items-end rounded-[1.4rem] border border-white/80 bg-white/90 px-2 py-2 shadow-[0_18px_55px_rgb(23_59_87/24%)] backdrop-blur-xl md:hidden"
      >
        {items.map((item) => {
          const active = item.href === root && pathname === root;
          return (
            <Link
              key={item.label}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-bold transition active:scale-95 ${
                item.primary
                  ? "mx-auto -mt-6 h-16 w-16 bg-[#173b57] text-white shadow-[0_10px_26px_rgb(23_59_87/30%)]"
                  : active
                    ? "bg-[#5aa9d6]/12 text-[#173b57]"
                    : "text-[#173b57]/52 hover:bg-[#173b57]/5 hover:text-[#173b57]"
              }`}
            >
              <span className={item.primary ? "text-white" : "text-[#5aa9d6]"}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

function EventsIcon() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><path d="M8 13h3m2 0h3m-8 4h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
function PlusIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>; }
function PeopleIcon() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.8" /><path d="M3.5 19c.5-4 2.5-6 5.5-6s5 2 5.5 6M16 5.5a3 3 0 0 1 0 5.5m1.5 2c2 .7 3 2.7 3 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>; }
function HomeIcon() { return <svg width="21" height="21" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m3 11 9-8 9 8M5.5 9.5V21h13V9.5M9.5 21v-7h5v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
