import type { Metadata } from "next";
import ClankyClient from "./ClankyClient";

export const metadata: Metadata = {
  title: "Knihovna článků a návodů pro tenisové rodiče | TenisHub",
  description: "Praktické návody pro rodiče: jak vybrat trenéra a raketu, první turnaj, výživa, prevence zranění, jak zvládat tlak a motivaci.",
};

export default function Page() {
  return <ClankyClient />;
}
