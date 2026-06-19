import { SiteHeader } from "@/components/SiteHeader";

export const metadata = {
  title: "Soukromí a údaje specialistů — TenisHub.cz",
  description: "Jak TenisHub nakládá s údaji trenérů, fyzioterapeutů, kondičních trenérů a areálů a jak si profil převzít nebo nechat odstranit.",
};

export default function SoukromiPage() {
  return (
    <div className="legal-page">
      <SiteHeader />

      <div className="wrap legal-wrap">
        <h1>Soukromí a profily specialistů</h1>
        <p className="lead">
          TenisHub je veřejný rozcestník tenisových služeb. Aby vás hráči a rodiče našli na jednom místě,
          zakládáme u některých trenérů, fyzioterapeutů, kondičních trenérů a areálů tzv. <b>neověřené profily</b>
          z veřejně dostupných informací. Níže vysvětlujeme, jak s tím nakládáme — a jak nad svým profilem
          získáte plnou kontrolu.
        </p>

        <h2>Jaké údaje u neověřeného profilu uvádíme</h2>
        <p>
          Pouze základní údaje, které jste sami veřejně zveřejnili jako poskytovatel služby:
          jméno (pod kterým službu nabízíte), typ služby, město a případně odkaz na váš veřejný web.
          <b> Nedoplňujeme žádný vymyšlený popis, fotky ani hodnocení.</b> Profil je záměrně „prázdný",
          dokud si ho nepřevezmete.
        </p>

        <h2>Proč to děláme (právní základ)</h2>
        <p>
          Vedení veřejného oborového katalogu opíráme o <b>oprávněný zájem</b> (čl. 6 odst. 1 písm. f) GDPR) —
          stejně jako fungují mapové a firemní katalogy. Týká se to lidí a subjektů, kteří se veřejně nabízejí
          jako poskytovatelé tenisových služeb. Vždy můžete proti zpracování vznést námitku a profil necháme skrýt.
        </p>

        <h2>Převzetí profilu</h2>
        <p>
          Na svém profilu klikněte na <b>„Tohle jsem já — převzít profil"</b>. Po ověření vám profil přiřadíme
          a budete si moct sami spravovat veškerý obsah (popis, ceník, kontakty, kalendář).
        </p>

        <h2>Odstranění / námitka (opt-out)</h2>
        <p>
          Nechcete tu být, nebo je v profilu chyba? Na profilu klikněte na <b>„Nahlásit / odstranit"</b> —
          k tomu nepotřebujete účet. Žádost vyřídíme co nejdříve a profil skryjeme. Napsat nám můžete i přímo
          na <a href="mailto:info@tenishub.cz">info@tenishub.cz</a>.
        </p>

        <h2>Vaše práva</h2>
        <p>
          Máte právo na přístup ke svým údajům, jejich opravu, výmaz, omezení zpracování a právo vznést námitku.
          Stačí nám napsat na <a href="mailto:info@tenishub.cz">info@tenishub.cz</a>.
        </p>

        <p className="legal-note">
          Toto je informační shrnutí, ne úplné znění zásad zpracování osobních údajů. Plné znění zveřejníme
          před ostrým spuštěním webu.
        </p>
      </div>
    </div>
  );
}
