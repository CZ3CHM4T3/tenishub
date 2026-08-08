import type { Metadata } from "next";
import DetiClient from "./DetiClient";

export const metadata: Metadata = { title: "Moje děti", robots: { index: false, follow: false } };

export default function Page() {
  return <DetiClient />;
}
