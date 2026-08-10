import type { Metadata, Viewport } from "next";
// Montserrat self-hostovaný (žádný Google fetch — funguje i offline).
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";
import "./globals.css";
import { ScrollReveal } from "@/components/ScrollReveal";
import { SiteFeedback } from "@/components/SiteFeedback";
import { MetaPixel } from "@/components/MetaPixel";

export const metadata: Metadata = {
  title: {
    default: "TenisHub.cz — online tenisový klub pro rodiče a trenéry",
    template: "%s | TenisHub.cz",
  },
  description:
    "Online tenisový klub pro rodiče a děti: najdi trenéra a klub, sleduj kariéru dítěte. Přehled, podpora a kontakty na jednom místě.",
  metadataBase: new URL("https://tenishub.cz"),
  keywords: [
    "tenis", "tenisový trenér", "tenis pro děti", "tenisový klub",
    "tenisová akademie", "sparring partner", "trénink dětí tenis", "kariéra tenisty",
  ],
  openGraph: {
    siteName: "TenisHub.cz",
    locale: "cs_CZ",
    type: "website",
    title: "TenisHub.cz — online tenisový klub pro rodiče a trenéry",
    description:
      "Pomáháme dětem začít, růst a vydržet u tenisu. Najdi trenéra a klub, sleduj kariéru dítěte — vše na jednom místě.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#22382c",
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "TenisHub.cz",
  url: "https://tenishub.cz",
  description:
    "Online tenisový klub pro rodiče a trenéry — najdi trenéra a klub, sleduj kariéru dítěte, komunita a rady na jednom místě.",
  inLanguage: "cs-CZ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs">
      <body>
        {/* bez JS: odhal vše, ať obsah není nikdy skrytý */}
        <noscript><style>{`.rv{opacity:1!important;transform:none!important}`}</style></noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
        {children}
        <ScrollReveal />
        <SiteFeedback />
        <MetaPixel />
      </body>
    </html>
  );
}
