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

export const metadata: Metadata = {
  title: {
    default: "TenisHub.cz — celý český tenis na jednom místě",
    template: "%s | TenisHub.cz",
  },
  description:
    "Najdi a rezervuj trenéry, kurty, akademie, fyzio i kondiční trenéry po celé ČR. Sparring, turnaje a komunita — nebo získej klienty a naplň kurty.",
  metadataBase: new URL("https://tenishub.cz"),
  keywords: [
    "tenis", "tenisový trenér", "tenisové kurty", "rezervace kurtu",
    "tenisová akademie", "sparring partner", "fyzioterapeut tenistů", "kondiční trenér tenis",
  ],
  openGraph: {
    siteName: "TenisHub.cz",
    locale: "cs_CZ",
    type: "website",
    title: "TenisHub.cz — celý český tenis na jednom místě",
    description:
      "Trenéři, kurty, akademie, fyzio i komunita. Najdi, rezervuj, zaplať — nebo získej klienty a naplň kurty.",
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
    "Celý český tenis na jednom místě — trenéři, kurty, akademie, fyzio, kondice a komunita.",
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
      </body>
    </html>
  );
}
