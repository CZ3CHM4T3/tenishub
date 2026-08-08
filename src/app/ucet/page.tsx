import type { Metadata } from "next";
import AccountPage from "./AccountPage";

export const metadata: Metadata = {
  title: "Můj účet",
  description: "Tvůj profil, HUBmember a rezervace přehledně na jednom místě.",
};

export default function UcetPage() {
  return <AccountPage />;
}
