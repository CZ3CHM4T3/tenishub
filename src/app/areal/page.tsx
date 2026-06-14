import type { Metadata } from "next";
import ArealDashboard from "./ArealDashboard";

export const metadata: Metadata = {
  title: "Dashboard areálu — obsazenost a rezervace kurtů",
  description:
    "Správa obsazenosti kurtů, online rezervace a platby a nabídka volných kurtů se slevou. Model dashboardu pro tenisové areály.",
};

export default function ArealPage() {
  return <ArealDashboard />;
}
