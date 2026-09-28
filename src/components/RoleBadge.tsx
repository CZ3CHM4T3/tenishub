// Štítek role autora na fóru: rodič (zelená) / trenér (oranžová) / rodič+trenér (mix) /
// admin (výrazně odlišený). Role se plní z DB (forum_role_for) do author_role.
const ROLE: Record<string, { label: string; cls: string }> = {
  admin: { label: "TenisHub tým", cls: "rbadge-admin" },
  trener: { label: "Trenér", cls: "rbadge-trener" },
  rodic_trener: { label: "Rodič + trenér", cls: "rbadge-mix" },
  rodic: { label: "Rodič", cls: "rbadge-rodic" },
};

export function RoleBadge({ role }: { role?: string | null }) {
  const r = role ? ROLE[role] : undefined;
  if (!r) return null;
  return <span className={`rbadge ${r.cls}`}>{r.label}</span>;
}
