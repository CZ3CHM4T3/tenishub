import { redirect } from "next/navigation";

// Dashboard areálu (demo) je zatím pryč — vrátíme ho, až budeme dělat profily areálů.
// Areály jsou k nalezení na mapě.
export default function ArealPage() {
  redirect("/mapa?type=club");
}
