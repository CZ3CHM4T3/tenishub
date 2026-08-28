import { BadgeCheck, Star, Crown } from "lucide-react";

// Odznak renomé trenéra (Ověřený / Doporučený / TOP). Neověřený = žádný odznak.
export function RenomeBadge({ level, small }: { level: number; small?: boolean }) {
  if (level <= 0) return null;
  const cfg =
    level >= 3 ? { cls: "rb-top", Icon: Crown, label: "TOP trenér" }
    : level === 2 ? { cls: "rb-dop", Icon: Star, label: "Doporučený" }
    : { cls: "rb-ov", Icon: BadgeCheck, label: "Ověřený" };
  const Icon = cfg.Icon;
  return (
    <span className={`renome-badge ${cfg.cls}${small ? " sm" : ""}`}>
      <Icon size={small ? 11 : 13} /> {cfg.label}
    </span>
  );
}
