import type { Metadata } from "next";
import MojeCesta from "./MojeCesta";

export const metadata: Metadata = {
  title: "Moje cesta — sezónní průvodce | TenisHub",
  description: "Naplánuj celou tenisovou sezónu: tréninky, turnaje, kondici i volno. Cíle a statistiky na jednom místě.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <MojeCesta />;
}
