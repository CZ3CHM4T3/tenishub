// Vlastní ikona píšťalky (Tabler tuhle verzi nemá). Klasická trenérská píšťalka z profilu:
// náustek vpravo, kulaté tělo s dírkou, zvukové čárky. API jako lucide/tabler (size, style).
export function WhistleIcon({ size = 24, style }: { size?: number; style?: Record<string, string> }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={style}>
      {/* náustek (trubička) */}
      <path d="M12.5 8.5H19a1.5 1.5 0 0 1 1.5 1.5v1.5h-8" />
      {/* tělo píšťalky */}
      <circle cx="9" cy="14.5" r="5" />
      {/* dírka */}
      <circle cx="9" cy="14.5" r="1.6" />
      {/* zvuk */}
      <path d="M21.5 6.5l1-1M22.5 9.5h1" />
    </svg>
  );
}
