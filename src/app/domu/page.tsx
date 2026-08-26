import type { Metadata } from "next";
import DomuClient from "./DomuClient";

export const metadata: Metadata = { title: "Můj TenisHub", robots: { index: false } };

export default function DomuPage() {
  return <DomuClient />;
}
