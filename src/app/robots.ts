import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

// Indexaci pouštíme JEN na ostré doméně (tenishub.cz). Staging (tenishub.vercel.app
// a Preview deploye) zůstává pro Google skrytý automaticky podle hostitele —
// není potřeba nic přepínat. NEXT_PUBLIC_ALLOW_INDEX=true je ruční override.
const PROD_HOSTS = ["tenishub.cz", "www.tenishub.cz"];

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = ((await headers()).get("host") || "").toLowerCase();
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://tenishub.cz";
  const allow = PROD_HOSTS.includes(host) || process.env.NEXT_PUBLIC_ALLOW_INDEX === "true";

  if (!allow) {
    return { rules: [{ userAgent: "*", disallow: "/" }] };
  }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/ucet", "/api"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
