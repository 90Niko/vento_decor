"use client";

import { useRouter } from "next/navigation";

export default function NotFoundPage() {
  const router = useRouter();

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.replace("/");
  }

  return (
    <main className="page-canvas grid min-h-screen place-items-center px-5 py-12">
      <button type="button" onClick={goBack} className="primary-action px-8 py-4">
        ← Назад
      </button>
    </main>
  );
}
