"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authService } from "@/features/auth/services/auth.service";

export function LogoutButton() {
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
    <button onClick={logout} disabled={pending} className="secondary-action px-4 py-2.5 text-xs sm:text-sm">
      {pending ? "Излизане…" : "Изход"}
    </button>
  );
}
