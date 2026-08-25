// Znalostní báze pro průvodce „Tenísek" — jednoduché párování dle klíčových slov,
// žádný placený AI model. Rozšiřitelné: stačí přidat další položku do FAQ.

export type Qa = { q: string; keys: string[]; a: string; link?: { label: string; href: string } };

export const FAQ: Qa[] = [
  { q: "Co je TenisHub?", keys: ["co je", "tenishub", "o co jde", "co to je", "co delate", "projekt"],
    a: "TenisHub je online tenisový klub pro rodiče a jejich děti. Trenér vede svůj klub, rodič připojí dítě a sleduje jeho pokrok — strom dovedností, level a Sparing Cup. Vše přehledně na jednom místě." },
  { q: "Jak to funguje?", keys: ["jak to funguje", "jak funguje", "princip", "postup", "jak zacit"],
    a: "Tři kroky: 1) Najdi trenéra a jeho klub (nebo tě trenér pozve odkazem). 2) Připoj se a přidej svoje dítě. 3) Sleduj kariéru dítěte — dovednosti, level a Sparing Cup.", link: { label: "Najít trenéra", href: "/mapa" } },
  { q: "Kolik stojí členství?", keys: ["kolik", "cena", "stoji", "cenik", "clenstvi cena", "penize", "platit", "kč", "kc"],
    a: "Zakládající cena je 99 Kč měsíčně a zamkne se ti na celý první rok. Po roce se překlápí na běžných 199 Kč. Platit můžeš měsíčně nebo ročně předem.", link: { label: "Členství", href: "/clenstvi" } },
  { q: "Je něco zdarma?", keys: ["zdarma", "free", "zadarmo", "neplatit", "bez placeni"],
    a: "Ano — najít trenéra na mapě a připojit dítě do klubu je zdarma, i základní pokrok uvidíš. Členství HUBmember odemyká rezervace, zprávy, Moje cesta a všechny nástroje." },
  { q: "Jak najdu trenéra?", keys: ["najdu trenera", "hledat trenera", "trener", "kde trener", "mapa"],
    a: "Klikni na Mapu služeb — najdeš trenéry a kluby po celé ČR, filtruješ podle města a dojezdu.", link: { label: "Mapa služeb", href: "/mapa" } },
  { q: "Co je strom dovedností / kariéra dítěte?", keys: ["strom", "dovednosti", "kariera", "level", "pokrok", "skill"],
    a: "Každý trenér má svůj strom dovedností. Dítě postupně odemyká uzly, sbírá zkušenosti a leveluje svého tenistu — vidíš přesně, co už zvládlo a co ho čeká." },
  { q: "Co je Sparing Cup?", keys: ["sparing cup", "sparring cup", "cup", "pohar", "zebricek deti"],
    a: "Sparing Cup je žebříček/pohár mezi dětmi v klubu. Motivace, zdravá rivalita a radost z hraní — a důvod, proč u trenéra zůstat." },
  { q: "Co je Moje cesta?", keys: ["moje cesta", "denik", "sezona", "planovac", "kalendar hrace"],
    a: "Moje cesta je sezonní průvodce hráče: kalendář tréninků a turnajů, cíle, statistiky ze zápasů a ohlédnutí. Skvělé hlavně pro závodní rodiče." },
  { q: "Jak přidám dítě?", keys: ["pridat dite", "moje deti", "registrovat dite", "zalozit dite"],
    a: "Po přihlášení běž do sekce Moje děti a přidej dítě (jméno, datum narození, program). Věková kategorie se nastaví sama. Ideálně se napřed připoj k trenérovi přes jeho zvací odkaz." },
  { q: "Jsem trenér, jak začnu?", keys: ["jsem trener", "trener zacit", "chci trenovat", "klub zalozit", "trenerske"],
    a: "Trenérský účet zakládáme na pozvání. Napiš nám a rozjedeme ti vlastní klub — pozveš rodiče, postavíš strom dovedností a staráš se o svěřence.", link: { label: "Napsat nám", href: "/#zeptejte-se" } },
  { q: "Co je sparring?", keys: ["sparring", "sparingpartner", "s kym hrat", "parak", "partner na hrani"],
    a: "Sparring ti pomůže najít parťáka na zahrání podle úrovně a místa. Nabídku si můžeš prohlédnout zdarma.", link: { label: "Sparring", href: "/sparring" } },
  { q: "Články a rady?", keys: ["clanky", "vedet vic", "knihovna", "navody", "rady", "informace", "tipy"],
    a: "V sekci Vědět víc najdeš návody a rady pro rodiče i trenéry. Ukázky jsou zdarma, celá knihovna pro členy. Tipy odjinud jsou ve Zdrojích.", link: { label: "Vědět víc", href: "/clanky" } },
  { q: "Jak zruším členství?", keys: ["zrusit clenstvi", "zrusit", "vypovedet", "ukoncit clenstvi", "odhlasit"],
    a: "Členství zrušíš kdykoli ve svém účtu — žádné skryté platby ani závazky." },
  { q: "Jsou data dětí v bezpečí?", keys: ["bezpeci", "soukromi", "gdpr", "data deti", "ochrana udaju"],
    a: "Ano. Profily nejsou veřejné, data dětí vidí jen rodič a jeho trenér. Víc na stránce Soukromí.", link: { label: "Soukromí", href: "/soukromi" } },
  { q: "Videorozbor?", keys: ["videorozbor", "video", "rozbor", "analyza videa"],
    a: "Videorozbor je samostatná placená služba (mimo členství) — pošleš video a dostaneš expertní rozbor techniky.", link: { label: "Videorozbor", href: "/videorozbor" } },
  { q: "Kde působíte?", keys: ["kde pusobite", "praha", "brno", "mesto", "region", "cela cr", "kraj"],
    a: "Po celé ČR — trenéři a kluby přidáváme region po regionu. Na Mapě služeb uvidíš, kdo je poblíž tebe." },
  { q: "Jak se zaregistruji?", keys: ["registrace", "registrovat", "zalozit ucet", "prihlasit se", "ucet"],
    a: "Klikni na Přihlásit se → Registrace. Máš-li od trenéra zvací odkaz, použij ho — rovnou tě to zapojí do jeho klubu.", link: { label: "Registrace", href: "/prihlaseni?tab=reg" } },
  { q: "Zapomněl jsem heslo", keys: ["heslo", "zapomnel heslo", "obnova hesla", "reset hesla", "nemohu se prihlasit"],
    a: "Na přihlašovací stránce klikni na odkaz Zapomněl jsi heslo a pošleme ti e-mail na obnovu." },
  { q: "Turnaje a žebříčky?", keys: ["turnaje", "zebricek", "cts", "svaz", "souteze"],
    a: "V komunitě máme kalendář turnajů a chystáme napojení na žebříčky svazu. Sleduj sekci Turnaje." },
  { q: "Jak vás kontaktuji?", keys: ["kontakt", "napsat", "zeptat", "dotaz", "email", "napsat vam", "poradit"],
    a: "Nejrychleji přes okno Zeptejte se nás na hlavní stránce — odpovídá člověk, ne robot (kromě mě 🎾).", link: { label: "Zeptejte se nás", href: "/#zeptejte-se" } },
];

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

export function matchFaq(input: string): Qa | null {
  const t = norm(input);
  if (!t) return null;
  let best: { qa: Qa; score: number } | null = null;
  for (const qa of FAQ) {
    let score = 0;
    for (const k of qa.keys) if (t.includes(norm(k))) score += norm(k).split(" ").length;
    if (score > 0 && (!best || score > best.score)) best = { qa, score };
  }
  return best?.qa ?? null;
}

export const QUICK: string[] = [
  "Jak to funguje?",
  "Kolik stojí členství?",
  "Je něco zdarma?",
  "Jak najdu trenéra?",
  "Co je Sparing Cup?",
];
