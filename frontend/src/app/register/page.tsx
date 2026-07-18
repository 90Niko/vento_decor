import type { Metadata } from "next";
import { AuthPage } from "@/features/auth/components/auth-page";

export const metadata: Metadata = {
  title: "Регистрация | Vento Decor",
  description: "Създай своя Vento Decor профил.",
};

export default function RegisterPage() {
  return <AuthPage mode="register" />;
}
