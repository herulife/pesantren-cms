import type { MetadataRoute } from "next";

const BASE_URL = "https://darussunnahparung.com";

// Curated list of public, indexable pages (admin/portal/audit pages excluded).
const STATIC_PATHS = [
  "",
  "/profil",
  "/sambutan",
  "/program",
  "/psb",
  "/psb-daftar",
  "/teachers",
  "/videos",
  "/news",
  "/gallery",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return STATIC_PATHS.map((path) => ({
    url: BASE_URL + path,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
}
