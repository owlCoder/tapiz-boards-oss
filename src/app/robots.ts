import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/login", "/changelog", "/status", "/privacy-policy", "/terms-of-service"],
      disallow: ["/projects", "/my-work", "/trash", "/admin", "/join", "/api"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
