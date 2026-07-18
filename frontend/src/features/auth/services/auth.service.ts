import { getApiUrl } from "@/shared/api/client";

type AuthPayload = { email: string; password: string; name?: string };

export const authService = {
  authenticate(mode: "login" | "register", payload: AuthPayload) {
    return fetch(`${getApiUrl()}/auth/${mode}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  logout() {
    return fetch(`${getApiUrl()}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  },
};

export async function readAuthError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    return Array.isArray(body.message) ? body.message.join(" ") : body.message ?? "Възникна грешка.";
  } catch {
    return "Възникна грешка. Опитай отново.";
  }
}
