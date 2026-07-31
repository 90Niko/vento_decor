"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authService } from "@/features/auth/services/auth.service";

export function LogoutButton({ iconOnly = true }: { iconOnly?: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    setPending(true);
    try {
      await authService.logout();
    } finally {
      router.replace("/");
      router.refresh();
      setPending(false);
    }
  }

  return (
    <button
      onClick={logout}
      disabled={pending}
      className={
        iconOnly
          ? "secondary-action grid h-10 w-10 place-items-center p-0"
          : "secondary-action px-4 py-2.5 text-xs sm:text-sm"
      }
      aria-label={pending ? "Излизане" : "Изход"}
      title={pending ? "Излизане…" : "Изход"}
    >
      {iconOnly ? (
        pending ? (
          <svg className="animate-spin" width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M20 12a8 8 0 1 1-2.34-5.66" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M10 5H5v14h5M14 8l4 4-4 4m4-4H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )
      ) : pending ? (
        "Излизане…"
      ) : (
        "Изход"
      )}
    </button>
  );
}
