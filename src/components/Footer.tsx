import Link from "next/link";
import { Wordmark } from "@/components/Wordmark";
import { CITIES, citySlug } from "@/lib/cities";

// Globální patička — na všech stránkách (přes layout).
export function Footer() {
  return (
    <footer className="site">
      <div className="wrap">
        <div className="grid">
          <div>
            <Wordmark className="wm-lg" />
            <p style={{ maxWidth: 320, fontSize: ".92rem", marginTop: ".9rem" }}>První český online tenisový klub — rodiče, děti a trenéři pohromadě.</p>
          </div>
          <div><h4>Pro koho</h4><div className="links"><Link href="/rodic">Rodič &amp; dítě</Link><Link href="/pro-trenery">Trenéři a profíci</Link><Link href="/sparring">Sparring</Link></div></div>
          <div><h4>TenisHub</h4><div className="links"><Link href="/clenstvi">Členství</Link><Link href="/o-nas">O nás</Link><Link href="/mapa">Mapa služeb</Link><Link href="/soukromi">Soukromí a profily</Link></div></div>
        </div>
        <div className="foot-cities">
          <h4>Tenis ve městech</h4>
          <div className="foot-city-links">
            {CITIES.map((c) => (
              <Link key={c[0]} href={`/tenis/${citySlug(c[0])}`}>{c[0]}</Link>
            ))}
          </div>
        </div>
        <div className="copy"><span>© 2026 TenisHub.cz</span><span>tenishub.cz</span></div>
      </div>
    </footer>
  );
}
