import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const user = req.auth?.user;
  const isAuthPage = nextUrl.pathname === "/login";
  const isPublic =
    isAuthPage ||
    ["/", "/status", "/changelog", "/privacy-policy", "/terms-of-service", "/api/health"].includes(nextUrl.pathname) ||
    // Cron routes authenticate themselves via Bearer CRON_SECRET, not session.
    nextUrl.pathname.startsWith("/api/cron/") ||
    // Public read-only board view via token.
    nextUrl.pathname.startsWith("/board/");

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  // api/auth + api/cron self-authenticate and skip the session proxy.
  matcher: ["/((?!api/auth|api/cron|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
