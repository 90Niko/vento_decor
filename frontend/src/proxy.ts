import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE = "vento_creator_session";

export function proxy(request: NextRequest) {
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const hasSession = Boolean(session);
  const role = readRole(session);

  if (!hasSession && (request.nextUrl.pathname.startsWith("/admin") || request.nextUrl.pathname.startsWith("/dashboard"))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && ["/login", "/register"].includes(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL(role === "ADMIN" ? "/admin/events" : "/dashboard/events", request.url));
  }

  if (hasSession && request.nextUrl.pathname.startsWith("/admin") && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard/events", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/login", "/register"],
};

function readRole(token: string | undefined): "ADMIN" | "CREATOR" | null {
  try {
    const payload = token?.split(".")[0];
    if (!payload) return null;
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString()) as { role?: string };
    return decoded.role === "ADMIN" ? "ADMIN" : "CREATOR";
  } catch {
    return null;
  }
}
