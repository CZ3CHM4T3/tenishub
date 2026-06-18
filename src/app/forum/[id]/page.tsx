import type { Metadata } from "next";
import ThreadClient from "./ThreadClient";

export const metadata: Metadata = {
  title: "Diskuze | Fórum rodičů — TenisHub",
  description: "Diskuze tenisových rodičů na TenisHubu.",
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ThreadClient id={id} />;
}
