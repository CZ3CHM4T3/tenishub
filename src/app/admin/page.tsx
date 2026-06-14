import type { Metadata } from "next";
import AdminPage from "./AdminPage";

export const metadata: Metadata = {
  title: "Administrace",
  description: "Správa uživatelů a členství TenisHub.",
  robots: { index: false, follow: false },
};

export default function Admin() {
  return <AdminPage />;
}
