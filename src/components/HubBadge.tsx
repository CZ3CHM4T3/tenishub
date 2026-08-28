import { Sparkles } from "lucide-react";

// Jednotný štítek HUB+ pro celý web. Používej všude, kde je něco součástí členství.
export function HubBadge({ className = "" }: { className?: string }) {
  return (
    <span className={`hub-badge ${className}`}>
      <Sparkles size={11} /> HUB+
    </span>
  );
}
