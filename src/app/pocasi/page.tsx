import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { WeatherWeek } from "@/components/WeatherWeek";

export const metadata: Metadata = { title: "Počasí na týden | TenisHub", robots: { index: false } };

export default function PocasiPage() {
  return (
    <div className="acct-page">
      <SiteHeader />
      <div className="wrap acct-wrap" style={{ maxWidth: 820 }}>
        <h1 className="acct-h1">Počasí na týden</h1>
        <p className="member-note" style={{ marginTop: "-0.4rem" }}>Podle města bydliště z tvého profilu — ať víš, kdy vzít dítě na kurt a kdy do haly.</p>
        <WeatherWeek />
      </div>
    </div>
  );
}
