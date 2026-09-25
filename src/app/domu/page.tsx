import { redirect } from "next/navigation";

// „/domu" (starý členský rozcestník) zrušen — členský domov je Profil.
export default function DomuPage() {
  redirect("/ucet?tab=profil");
}
