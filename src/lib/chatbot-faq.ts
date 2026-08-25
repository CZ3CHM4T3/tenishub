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
    a: "Ano — najít trenéra na mapě a připojit dítě do klubu je zdarma, i základní pokrok uvidíš. Členství HUB+ odemyká rezervace, zprávy, Moje cesta a všechny nástroje." },
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

  // ── tenisové rady pro rodiče (Tenísek jako pomocník, ne prodavač) ──
  { q: "Od kolika let může dítě začít s tenisem?", keys: ["od kolika let", "kolik let", "vek zacit", "kdy zacit", "jak stary", "od kdy tenis"],
    a: "Zpravidla od 4–5 let přes minitenis (menší kurt, měkčí míče). Začít se ale dá v jakémkoli věku — důležitější než věk je dobrý trenér a radost ze hry." },
  { q: "Co je minitenis?", keys: ["minitenis", "mini tenis", "maly tenis"],
    a: "Minitenis je zmenšený tenis pro děti (cca 5–7 let): menší kurt, nižší síť, lehčí a měkčí míče a kratší rakety. Dítě si hraje jako dospělí, jen ve svém měřítku." },
  { q: "Co je babytenis?", keys: ["babytenis", "baby tenis"],
    a: "Babytenis (zhruba 8–9 let) navazuje na minitenis — hraje se s odlehčenými míči na celý kurt přes běžnou síť. Je to krok k velkému tenisu." },
  { q: "Jakou raketu pro dítě?", keys: ["raketa", "raketu", "jaka raketa", "velikost rakety", "detskou raketu", "palcu"],
    a: "Podle výšky a věku: cca 4 roky = 17 palců (43 cm), 5–6 let = 19 palců (48 cm), 7 let = 21 palců (53 cm), 8 let = 23 palců (58 cm). Po zvládnuté technice a výšce ~150 cm přijde odlehčená dospělá raketa. Poradí i trenér." },
  { q: "Kolik stojí tenis pro dítě?", keys: ["kolik stoji tenis", "cena treninku", "kolik za trenink", "naklady tenis", "cena lekce", "drahy tenis"],
    a: "Skupinový trénink vychází obvykle od ~150 Kč/hodina, měsíčně tak od ~1000 Kč; individuál je dražší. K tomu raketa (stovky až nižší tisíce) a míče. Konkrétní ceny uvidíš u profilů trenérů." },
  { q: "Jak často má dítě trénovat?", keys: ["jak casto", "kolikrat tydne", "frekvence", "kolik treninku"],
    a: "Na začátek stačí 1–2× týdně kvůli radosti a základům; kdo chce růst rychleji, přidává. Klíčová je pravidelnost a chuť, ne přetížení." },
  { q: "Individuální nebo skupinový trénink?", keys: ["individualni", "skupinovy", "skupina", "sam nebo", "individual"],
    a: "Pro malé děti je fajn začít ve skupině mezi vrstevníky (zábava, motivace). Kdo chce cíleně růst, přidá individuál — trenér se věnuje jen jednomu dítěti." },
  { q: "Jak poznám dobrého trenéra?", keys: ["dobry trener", "poznat trenera", "kvalita trenera", "vybrat trenera"],
    a: "Sleduj, jak klub pracuje s mládeží a jak hrají děti po roce dvou, zda má trenér kvalifikaci a jak k dětem přistupuje. Pomůžou recenze a ověřený odznak trenéra." },
  { q: "Kdy může dítě na velký kurt?", keys: ["velky kurt", "cely kurt", "prechod na kurt", "normalni kurt"],
    a: "Zhruba kolem 9–10 let po babytenisu, když zvládá techniku a pohyb. Není kam spěchat — přechod řídí trenér podle dítěte." },
  { q: "Od kdy může hrát turnaje?", keys: ["turnaje od kdy", "prvni turnaj", "turnaje deti", "kdy turnaj", "zavodit"],
    a: "Turnaje jednotlivců se hrají už od žákovských kategorií; přihlašuje se dle termínové listiny ČTS. Kalendář a přihlášky chystáme přímo na TenisHubu." },
  { q: "Co když dítě nechce hrát nebo ztrácí radost?", keys: ["nechce hrat", "ztraci radost", "nebavi", "nechce trenovat", "vyhoreni", "demotivace"],
    a: "Nejčastěji je za tím moc tlaku nebo nuda. Zkuste hravější formu, kamarády, případně jiného trenéra — a mluvte o tom. Když si nevíte rady, pomůže konzultace nebo videorozbor." },
  { q: "Jak dítě motivovat?", keys: ["motivace", "motivovat", "podporovat dite", "jak povzbudit"],
    a: "Chvalte snahu, ne jen výsledek; dopřejte kamarády a malé cíle. Přesně proto máme strom dovedností a Sparing Cup — dítě vidí pokrok a má se na co těšit." },
  { q: "Antuka nebo hala?", keys: ["antuka", "hala", "povrch", "v zime", "kryty kurt"],
    a: "V teple se hraje venku (nejčastěji antuka), v zimě v hale. Pro děti není povrch zásadní — hlavně ať se hraje pravidelně celý rok." },
  { q: "Co dítě potřebuje na první trénink?", keys: ["prvni trenink", "co s sebou", "co potrebuje", "vybaveni"],
    a: "Sportovní oblečení a boty na kurt/do haly, pití a raketu (zpočátku ji často půjčí i trenér). Nic drahého na začátku řešit nemusíte." },
  { q: "Je lepší začít brzy?", keys: ["zacit brzy", "cim driv", "pozde na tenis", "musi zacit brzo"],
    a: "Brzký start pomáhá s koordinací, ale zázraky nedělá — spousta dobrých hráčů začala později. Důležitější je dlouhodobá radost a kvalitní vedení." },
  { q: "Levák nebo pravák?", keys: ["levak", "pravak", "ktera ruka", "leva ruka"],
    a: "Dítě hraje rukou, která mu je přirozená — trenér to pozná rychle. Leváci mívají v tenise výhodu, přepínat na sílu se nemá." },
  { q: "Jaké jsou věkové kategorie?", keys: ["vekove kategorie", "kategorie", "mladsi zaci", "starsi zaci", "dorost", "zaci"],
    a: "Zjednodušeně: mini (6–7), baby (8–9), mladší žáci (10–12), starší žáci (13–14) a dorost (15–18). U nás se kategorie dítěti nastaví sama podle věku." },
  { q: "Potřebuje dítě kondici k tenisu?", keys: ["kondice", "kondicni", "fyzicka", "sila", "fyzio", "zraneni", "boli"],
    a: "Ze začátku stačí všestranný pohyb a hravost; specializovaná kondice přichází s vyšší zátěží. Při bolestech nebo po zranění pomůže sportovní fyzioterapeut se zkušeností s tenisty." },
  { q: "Jak dlouho trvá, než se dítě naučí hrát?", keys: ["jak dlouho", "za jak dlouho", "kdy bude umet", "jak rychle"],
    a: "Základy zvládne za pár měsíců, slušně zahraje během roku dvou pravidelného tréninku. Tempo je individuální — proto je fajn vidět pokrok krok po kroku." },
  { q: "Můžu být na tréninku s dítětem?", keys: ["divat se", "na trenink s ditetem", "muzu se divat", "pritomnost rodice"],
    a: "Záleží na trenérovi a klubu — někdy je lepší nechat dítě soustředit se. Zeptejte se trenéra přímo; na TenisHubu mu napíšete zprávu zdarma." },
  { q: "Co je ČTS?", keys: ["cts", "cesky tenisovy svaz", "svaz"],
    a: "ČTS = Český tenisový svaz, zastřešuje soutěže, žebříčky a registrace hráčů. Chystáme napojení, aby výsledky a turnaje byly i u vás na TenisHubu." },
  { q: "Jsou trenéři ověření?", keys: ["overeni trenéri", "provereni", "garance trenera", "kdo je na mape", "duveryhodnost"],
    a: "Do katalogu dáváme reálné trenéry a kluby; ověřený odznak dostávají ti, které prověříme. U profilů najdeš recenze, ať se rozhodneš s klidem." },
  { q: "Nabízíte tenis i pro dospělé?", keys: ["dospeli", "dospely", "pro dospele", "hraju sam"],
    a: "Web teď cílíme hlavně na děti, jejich rodiče a trenéry. Řadu trenérů z mapy ale najdeš i pro dospělé — napiš jim přímo." },
  { q: "Jak se stanu ověřeným trenérem?", keys: ["overeny trener", "chci odznak", "verifikace", "jak overit profil"],
    a: "V trenérském účtu si spravuješ kartu a požádáš o ověření — my ji projdeme a udělíme odznak. Ověření se nekupuje, je to ruční prověrka." },
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
