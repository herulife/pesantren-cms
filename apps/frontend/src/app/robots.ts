import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/portal",
        "/api",
        "/audit",
        "/audit-hasil",
        "/audit-full",
        "/audit-hacked",
      ],
    },
    sitemap: "https://darussunnahparung.com/sitemap.xml",
    host: "https://darussunnahparung.com",
  };
}
