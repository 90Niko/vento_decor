import type { Metadata } from "next";
import { AuthPage } from "@/features/auth/components/auth-page";

export const metadata: Metadata = {
  title: "Вход | Vento Decor",
  description: "Влез в своя Vento Decor профил.",
};

export default function LoginPage() {
  return <AuthPage mode="login" />;
}
