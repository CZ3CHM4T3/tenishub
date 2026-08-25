import type { Metadata } from "next";
import ZdrojeClient from "./ZdrojeClient";

export const metadata: Metadata = {
  title: "Zdroje — kde se dozvědět víc o tenise",
  description: "Tipy na podcasty, články, videa a weby o tenise. Nejsme jediný zdroj — dobrý tenisový rodič i trenér čerpá z víc míst.",
};

export default function ZdrojePage() {
  return <ZdrojeClient />;
}
