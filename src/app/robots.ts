import type { MetadataRoute } from "next";

// POZOR: na DOČASNÉ (staging) adrese chceme indexaci VYPNUTOU, ať Google
// neindexuje testovací URL. Zapne se až na ostrém webu nastavením
// NEXT_PUBLIC_ALLOW_INDEX=true (ve Vercel env pro produkční doménu).
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://tenishub.cz";
  const allow = process.env.NEXT_PUBLIC_ALLOW_INDEX === "true";

  if (!allow) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/ucet", "/api"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
