import type { Metadata } from "next";
import ResetForm from "./ResetForm";

export const metadata: Metadata = {
  title: "Nové heslo",
  description: "Nastav si nové heslo k účtu TenisHub.",
  robots: { index: false, follow: false },
};

export default function ObnovaPage() {
  return <ResetForm />;
}
