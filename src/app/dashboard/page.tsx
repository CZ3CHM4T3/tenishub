import type { Metadata } from "next";
import ProvozDashboard from "./ProvozDashboard";

export const metadata: Metadata = { title: "Provozní dashboard", robots: { index: false, follow: false } };

export default function Page() {
  return <ProvozDashboard />;
}
