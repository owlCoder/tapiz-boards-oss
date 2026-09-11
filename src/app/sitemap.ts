import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3004";
  return [
    { url: base, changeFrequency: "monthly", priority: 1.0 },
    { url: `${base}/login`, changeFrequency: "yearly", priority: 0.8 },
    { url: `${base}/changelog`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${base}/status`, changeFrequency: "daily", priority: 0.4 },
  ];
}
