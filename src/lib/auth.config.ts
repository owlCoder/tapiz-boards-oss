import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/domain/types";

/**
 * Local dev runs over HTTP; the session cookie must not be `secure` there or
 * the browser drops it. Must match between the main auth config and the
 * proxy (both read the same cookie) — kept here so both share one source.
 */
const useSecureCookies =
  (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "").startsWith("https://") ||
  process.env.NODE_ENV === "production";

/**
 * Edge-safe deo Auth.js konfiguracije — bez bcrypt/mysql2 importa,
 * jer ga koristi proxy (edge runtime).
 */
export const authConfig = {
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt" },
  trustHost: true,
  useSecureCookies,
  providers: [],
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
      }
      // updateSession() posle izmene profila — osveži ime/email u JWT-u bez ponovne prijave.
      if (trigger === "update" && session?.user) {
        if (typeof session.user.name === "string") token.name = session.user.name;
        if (typeof session.user.email === "string") token.email = session.user.email;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      return session;
    },
  },
} satisfies NextAuthConfig;
