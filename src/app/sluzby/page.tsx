import type { Metadata } from "next";
import SluzbyRozcestnik from "./SluzbyRozcestnik";

export const metadata: Metadata = { title: "Vaše služby | TenisHub", robots: { index: false } };

// Členský rozcestník všech služeb (přistání po přihlášení).
export default function SluzbyPage() {
  return <SluzbyRozcestnik />;
}
