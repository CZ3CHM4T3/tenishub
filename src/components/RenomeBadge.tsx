// Renomé jako hodnost — skládané lesklé 3D chevrony (nášivky). 1/2/3 = Ověřený/Doporučený/TOP.
// Neověřený (level 0) = nic. `chip` = s popiskem (na profil), jinak jen nášivky (mapa, pás, seznamy).
export function RenomeBadge({ level, chip = false }: { level: number; chip?: boolean }) {
  if (level <= 0) return null;
  const n = Math.min(3, Math.max(1, level));
  const label = level >= 3 ? "TOP trenér" : level === 2 ? "Doporučený" : "Ověřeno";
  const gap = 8;
  const h = (n - 1) * gap + 24; // dost místa, ať se spodní chevron neusekne

  const svg = (
    <svg viewBox={`0 0 44 ${h}`} style={{ width: chip ? 22 : 18, height: "auto", display: "block", overflow: "visible" }} aria-hidden="true">
      <defs>
        <linearGradient id="renGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f4e2ad" /><stop offset="0.5" stopColor="#d9b866" /><stop offset="1" stopColor="#a9832f" /></linearGradient>
        <linearGradient id="renGloss" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.6" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <filter id="renShadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.3" /></filter>
      </defs>
      {Array.from({ length: n }, (_, i) => {
        const y = (n - 1 - i) * gap;
        return (
          <g key={i} transform={`translate(0,${y})`} filter="url(#renShadow)">
            <path d="M3 13 L22 2 L41 13 L41 20 L22 9 L3 20 Z" fill="url(#renGold)" stroke="rgba(0,0,0,.22)" strokeWidth="0.5" />
            <path d="M4 12.4 L22 2 L40 12.4 L40 14.3 L22 4 L4 14.3 Z" fill="url(#renGloss)" />
          </g>
        );
      })}
    </svg>
  );

  if (!chip) return <span className="renome-mini" title={label}>{svg}</span>;
  return <span className="renome-chip">{svg}<b>{label}</b></span>;
}
