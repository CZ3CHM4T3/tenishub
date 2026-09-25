import { redirect } from "next/navigation";

// „/domu" (starý členský rozcestník) sloučen do JEDNÉ „Služby" (rozcestník všech služeb).
export default function DomuPage() {
  redirect("/sluzby");
}
