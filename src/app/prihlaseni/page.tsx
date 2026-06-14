import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "./AuthForm";

export const metadata: Metadata = {
  title: "Přihlášení a registrace",
  description: "Přihlas se ke svému účtu TenisHub nebo si zdarma vytvoř nový.",
};

export default function PrihlaseniPage() {
  return (
    <Suspense>
      <AuthForm />
    </Suspense>
  );
}
