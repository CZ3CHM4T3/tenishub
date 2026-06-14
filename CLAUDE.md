# TENISHUB — projekt (kontext pro Claude)

Samostatný projekt **#3**, oddělený od MS GEM a Pohyb doma. Majitel = **Jan** (není programátor —
vysvětlovat lidsky, dělat věci za něj, nastavení/SQL posílat jako hotové bloky).

## O co jde
Vzít web **tenishub.cz** (online tenisový klub: katalog specialistů, obsah, komunita, freemium)
a udělat z něj **největší český web pro všechny uživatele tenisových služeb** tak, aby pro každý
segment dávalo smysl platit členství kvůli funkcím, co mu usnadní práci a život.

## Klíčové dokumenty
- `docs/STRATEGIE-TenisHub.md` — analýza webu, poradní tým (6 expertů) a kompletní strategie + roadmapa.
- `docs/FUNKCE-podle-role.md` — co dělá každá role a proč zaplatí.
- `docs/*.html` — schválené mockupy (navrh-design, mapa, profil-trener, dashboard-areal) + grafika/loga.

## Aplikace (Next.js)
- Web se staví **v rootu projektu** jako reálná Next.js appka (stejný stack jako POHYBDOMA):
  **Next 15 App Router + TypeScript + Tailwind v4**, `src/` layout, `lucide-react`, Leaflet (mapa).
- Spuštění: `npm run dev` → http://localhost:3000. Build: `npm run build`. (Pozn.: `.claude/launch.json` má
  `autoPort: true` — když 3000 drží jiný projekt, dev naskočí na náhodném portu.)
- Hotové stránky (vše překlopené z mockupů, obsah server-rendered kvůli SEO):
  - **homepage** `src/app/page.tsx` — hero s velkým logem (`src/components/LogoMark.tsx`) napravo od nadpisu,
    rozcestník rolí (proklik: trenér→/trener, klub→/areal, rodič/hráč→/mapa, fyzio→/trener).
  - **mapa** `src/app/mapa/` — Leaflet + CARTO, 6 typů služeb (trenér, klub/areál, fitness, fyzio, akademie,
    **sparring partner**), filtr místa a dojezdu km/min, popupy → /trener nebo /areal.
  - **profil trenéra** `src/app/trener/` — kalendář volných hodin + tok rezervace (zpráva → rezervace → platba → hotovo, GoPay).
  - **dashboard areálu** `src/app/areal/` — mřížka obsazenosti kurtů (klik = rezervace), „Obsaď volný kurt teď".
- **Font:** **Montserrat** na celém webu, **self-hostovaný** přes `@fontsource/montserrat` (import řezů v layout.tsx).
  NEPOUŽÍVAT next/font/google — síť na Google Fonts je v prostředí blokovaná (curl/SSL selže), next/font pak tiše
  použije jen fallback. Proměnná `--font-jakarta` v globals :root (název historický) míří na Montserrat.
- **Plástev:** 3D metalické dlaždice (gradient + stín), bílé proužky všude (i u středu), hover = zvětšení „dopředu"
  (scale, transform-box fill-box), kurzorová parallax (hive-inner transform), jemný obrys ČR za pláství (cz-outline path).
- **Search bar** funkční: výběr města (`src/lib/cities.ts`, 20 měst) + dotaz → `/mapa?city=&q=`; MapExplorer to čte z URL.
- **Staty** specialistů/areálů = reálné počty z DB (count), nasčítané (Counter). Ikony rolí = `src/lib/cities` pozn.: čeká výběr Tabler ikon.
- **Logo:** `public/logo-gg.png` — Janův zelenozlatý originál (zelené šrafy + zlaté T, TENIS zlatě, HUB zeleně),
  vyříznuté na průhledné (sharp flood-fill, zdroj `logo-src.png`). V bílé liště homepage. Footer = textový `Wordmark`.
- **PALETA (aktuální směr): hodně BÍLÉ + zelená/zlatá jako akcenty** (sladěné s logem: --green #2c4a3b, --gold #bf9a47).
  Homepage hero i lišta jsou BÍLÉ (ne tmavě zelené); zelené zůstaly jen akcentní sekce (testimonialy, CTA, footer).
  Tokeny v globals :root. Sub-stránky (mapa/profil/areál) mají zatím starší zelené lišty — překlopit taky.
- **Hero = „plástev služeb"** `src/components/ServiceHive.tsx` — logo (`logo-gg.png`) ve středovém šestiúhelníku,
  kolem 6 buněk s vlastní tlumenou barvou (Trenér zelená, Rodič zlatá hobby/závodní, Hráč modrá amatér/závodní,
  Sparring clay, Areály teal, Fyzio rose). Každá buňka má vlastní ikonu (foreignObject; Trenér = vlastní WhistleIcon
  v `src/components/icons.tsx`, Hráč = Tabler IconRun — pozor, @tabler/icons-react NEMÁ IconWhistle).
  Klik na buňku = vyjede menu funkcí role (`FUNCS`, hotové × „brzy"), ne přímá navigace.
- **Mapa ČR pod pláství:** realistická 68bodová hranice (`CZ_BORDER`, z reálných souřadnic vč. všech výběžků),
  vykreslená 2× zvětšená kolem středu plástve — `transform="translate(-280,-280) scale(2)"`, viewBox -465 -145 1490 895.
  Plástev mapu nepřekrývá, sedí v jejím středu. 6 velkých pinů služeb (barva+ikona role, ~53px, pulz).
- **Menu dlaždice = ZDARMA vs ČLENSTVÍ:** `FUNCS` má `{free, member}`; member položky mají zlatý odznak HUB+.
  Princip (Janovo rozhodnutí): objevování/být vidět zdarma; rezervace, zprávy, nástroje = členství.
  Název: **HUB+** (pracovně schváleno, možná ještě „člen" — snadno přejmenovat: hm-badge, AuthNav, texty účtu).

## Auth + členství + admin (hotovo v kódu)
- **SQL: `supabase/clenstvi.sql`** — memberships tabulka, profiles.is_admin + email, is_admin() fce, RLS
  (členství vidí majitel+admin; profily už NEJSOU veřejně čitelné — obsahují e-maily). Jan musí spustit.
- **Middleware** `src/middleware.ts` (obnova session). **/prihlaseni** (login+registrace, CZ chyby),
  **/ucet** (profil, členství HUB+ od–do, auto-prodloužení toggle, aktivace 30 dní demo, rezervace, odhlášení),
  **/admin** (jen is_admin: tabulka uživatelů, stav HUB+, od/do, +30 dní, stop auto, ukončit).
- **AuthNav** v liště homepage (Přihlásit/Můj účet dle stavu). **Rezervace+zprávy na /trener jsou gated**:
  nepřihlášený → modal login; bez členství → modal HUB+; člen → rezervace se UKLÁDÁ do bookings.
- Supabase má defaultně ZAPNUTÉ potvrzení e-mailu → pro vývoj vypnout (Authentication → Sign In/Up → Confirm email OFF).
- Testovací účet: test.hrac@tenishub.cz / test123456 (nepotvrzený; smazat v Auth → Users).
- Jan→admin: po registraci spustit UPDATE z konce clenstvi.sql (doplnit e-mail).
- **`supabase/admini.sql`**: handle_new_user dělá adminem auto e-maily schroffelh@seznam.cz + machekjirka@gmail.com,
  nastaví is_admin i existujícím, a admin vidí všechny bookings (RLS). Spustit po clenstvi.sql.
- **Admin `/admin`** rozšířen: statistiky stránky (účty, aktivní HUB+, členství/měsíc MRR, rezervace, tržby, počty
  specialistů/areálů) + tabulka uživatelů s členstvím (+30 dní/+rok/stop auto/ukončit) + tabulka rezervací & plateb.
- HUB+ funkce: ke každé roli (ServiceMap FUNCS i homepage PERSONAS plus[]) přidáno „Články a FAQ návody".
- **CLAIMABLE PROFILY (blank profil + převzetí + opt-out) — `supabase/claimable.sql`:** model pro adresář
  bez souhlasu (jako Google Maps/Firmy.cz, právní základ = oprávněný zájem). specialists+venues mají `status`
  (unclaimed|claimed|hidden) + `source`; RLS skrývá `hidden` před veřejností (admin vidí vše). Kontakty pro
  oslovení jdou do NEVEŘEJNÉ `provider_outreach` (jen admin) — veřejně se ukazuje jen jméno/typ/město/web.
  `claim_requests` („Tohle jsem já" → schválí admin přes RPC `approve_claim` → nastaví owner_id+claimed+verified);
  `removal_requests` (opt-out, insert smí i ANON bez účtu → admin RPC `resolve_removal` skryje profil).
  **Pravidlo dat:** do DB jen reálné subjekty, co se SAMY veřejně inzerují jako poskytovatelé; žádný fake obsah
  (bio/fotky/recenze se NEVYMÝŠLEJÍ). `/trener/[id]` u `unclaimed` ukáže banner „neověřeno" + tlačítka
  převzít/nahlásit, skryje kalendář/kontakt/recenze; u reálných profilů NEpoužívá demo fallbacky (jen co je v DB).
  Admin `/admin` má sekce „Žádosti o převzetí" a „Opt-out". GDPR stránka **`/soukromi`** (odkaz v patičce).
- **Sběr dat:** WebSearch/WebFetch FUNGUJÍ (běží serverově, mimo blokovanou lokální síť) — reálná data lze sehnat.
  `supabase/unclaimed-providers.sql` = první dávka ~19 reálných trenérů/škol z veř. adresáře vaseliga.cz +
  vlastních webů (Praha/Brno/Plzeň/HK), status unclaimed, kontakty v provider_outreach. Rozšiřitelné dalšími městy.
- POZOR na PORTY: TenisHub musí běžet na :3000 (Supabase Site URL + session cookie). Když 3000 drží jiný projekt
  (beyskool) a dev naskočí jinam, přihlášení „zmizí" → /ucet vyhodí na /prihlaseni. Řešení: uvolnit 3000 pro TenisHub.
- **Profily per-id z DB:** `/trener/[id]` (TrenerProfile přijímá prop `spec` — bez ní jede demo model na /trener)
  a `/areal/[id]` (venue + courts). Mapa popupy i marquee na homepage linkují na konkrétní id; sparring popup bez odkazu.
  POZOR: data se načítají KLIENTSKY — server-side fetch na Supabase v tomhle prostředí selhává („fetch failed"
  v Next dev, samostatný Node i prohlížeč fungují). Po nasazení na Vercel zvážit překlopení na SSR kvůli SEO.
- Rezervace z /trener/[id] ukládá specialist_id + reálnou cenu (price_from) do bookings.
- **Sparring `/sparring`** — procházení nabídek zdarma (z DB), „Přidat inzerát" + „Mám zájem" = HUB+ gated.
  Inzerát se ukládá do sparring_offers (vč. lat/lng z CITIES → objeví se i na mapě). Karty v ServiceMap i buddy
  popup na mapě vedou na /sparring.
- **Recenze** na /trener/[id]: načítají se z DB (reviews where specialist_id), přidání = přihlášený uživatel
  (rating 1–5 + text → insert s author_name). DB trigger `recompute_specialist_rating` přepočítá rating+count.
  `supabase/recenze-sparring.sql`: přidává reviews.author_name + sparring_offers.author_name (profily nejsou
  veřejné) a ten trigger. Demo /trener (bez id) má pořád natvrdo 3 recenze.
- **Obnova hesla:** /prihlaseni má „Zapomněl jsi heslo?" → resetPasswordForEmail s redirectem na **/obnova**
  (tam detekce recovery session + nastavení nového hesla). POZOR: redirect míří na location.origin —
  funguje na localhost:3000 (= Site URL v Supabase); na jiném portu/doméně nutno přidat do Auth Redirect URLs.
- **Lišta:** pevný padding (animace paddingu = „plavání" při scrollu — neřešit přes .solid padding).
  Logo ve středu větší (180px). Lišta KRÉMOVÁ (#F4EFE2), menu tučné (700), „Přihlásit se" = bordered tlačítko.
  (Janův výběr z 3 konceptů: A souhvězdí / B větvení / C plástev → zvolil C.) Možné rozšíření: „drag" roztáčení + karty dole.
- **Hero vystředěný:** nadpis „TENIS – vše na jednom místě!" (TENIS zlatě), sub, search+staty na střed, plástev POD tím.
- **Sekce „Pro koho":** opraveno mizení panelu (odebráno `rv` z `.persona-panel` — observer ho po remountu neoznačil).
  Každá persona má barvu (`PERSONA_COLOR`, sladěné s pláství) → barevné taby + barevný panel (okraj, ikona, promise).
  Panel = **srovnávací tabulka Zdarma vs HUB+** (`plan-table`; persony mají `free[]`/`plus[]`; placené ve free
  sloupci šedě „—"), CTA: Vytvořit účet zdarma + Chci HUB+.
- **Recenze = pomalý pás** (`testi-strip`, 80s marquee) hned pod lištou; velký testimonial carousel zrušen.
  Hero padding-top snížen na 2.5rem (pás zabírá místo nahoře).
- **Footer má odkaz Administrace** (→ /admin; nepřihlášeného přesměruje na /prihlaseni).
- **Fyzio × Fitness rozděleno** (Janovo zadání: dvě dost odlišné služby). ServiceMap má teď **7 služeb**
  (trenér, rodič, hráč, sparring, areály, **fyzio** HeartPulse #864a59, **fitness** Dumbbell #4a5b86) — v SERVICES, FUNCS i pinech.
  `.svc-cards` grid = `repeat(7,1fr)` (responzivně 4/2). Homepage PERSONAS i PERSONA_COLOR mají oddělené
  fyzio (Fyzioterapeut) + fitness (Fitness trenér) → 9 person. **Živý feed ODSTRANĚN** z homepage
  (FEED_POOL/AGOS/state/interval pryč; footer „Sparring" → /sparring).
- **Hero = varianta B: `src/components/ServiceMap.tsx`** (ServiceHive SMAZÁN). Mapa ČR má **REÁLNÉ piny**
  (`REAL_POINTS` [lat,lng,idx], žádné vymyšlené!) — ~107 bodů projektovaných z GPS přes afinní transformaci
  `projX/projY` (kalibrováno na 12 krajských měst, sedí ~2px). idx: 0 trenér/škola, 4 areál, 5 fyzio, 6 fitness.
  Spotřebitelské role (rodič/hráč/sparring) nemají piny → hover na jejich kartu rozsvítí CELOU mapu (`CONSUMER`).
  Data jsou „bake" snapshot stejné sady jako v unclaimed-providers.sql (lze přepnout na live fetch z DB).
  Pod mapou 6 karet služeb (3D feel: gradient, stín, ikona v pastelové bublině). OBOUSMĚRNÁ interakce:
  hover pin → karta `.hl` (vystoupí vpřed); hover karta → všechny piny služby `.lit` (halo v barvě, scale)
  = „celorepubliková péče". Klik na kartu → menu Zdarma/HUB+ (FUNCS přestěhováno do ServiceMap).
  Pozn.: React hover v testech = mouseover/mouseout (mouseenter dispatch nefunguje).
- **Redesign (dynamický):** animovaný hero (jemné orby), search bar, živé statistiky
  (count-up + tikající online/návštěvy), **marquee specialistů z reálných dat**, persona explorer (dropdown na klik),
  kroky, živý feed, **carousel testimonialů**. Žádné emoji — ikony jen `lucide-react`.
- **Ikony:** `lucide-react` (profesionální), ne ručně kreslené. Mapové typy mají vlastní čisté SVG stringy.
- **Lišta (homepage):** funkční dropdown menu (`.nav-item`/`.drop`/`.drop-card`) — „Pro koho" a „Funkce".
- **Lišty jsou BÍLÉ** (homepage `.site` i sub-stránky `.subhdr`) — logo má zelené prvky a na zelené liště
  mizelo. Hero logo je větší (~310px+), statické (bez animace), na světlé záři (jinak ho zelené pozadí pohltí).

## Data (Supabase)
- Klienti: `src/lib/supabase/client.ts` (browser) a `server.ts` (SSR, Next 15 async cookies).
- Klíče v `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) — Jan doplní z Supabase.
- **SQL schéma fáze 1: `supabase/schema.sql`** — tabulky (profiles, specialists, services, venues, courts,
  reviews, sparring_offers, bookings) + RLS (čtení veřejné, zápis vlastník) + ukázková data. Spustit v Supabase SQL Editoru.
- **Klíče nastaveny** v `.env.local` (projekt hvfmqxznguijbqqoxdfd). SQL schéma aplikováno (Jan potvrdil).
- **Mapa `/mapa` napojena na ostrá data** ze Supabase (specialists + venues + sparring_offers; čte přes anon RLS).
  Filtr dle vzdálenosti i typů funguje. Profil/areál zatím jako modely (per-id data = další krok).
- **`supabase/seed-data.sql` ZRUŠEN** (Janovo rozhodnutí: žádný fake obsah na mapě). Soubor je teď prázdný/upozornění
  (měl TRUNCATE → nebezpečný re-run). NESPOUŠTĚT. Na mapě jen REÁLNÉ subjekty, co se samy inzerují.
  - **`supabase/cleanup-demo.sql`** smaže vymyšlené demo z DB (specialists/venues kde `source is null and owner_id is null`;
    sparring kde `profile_id is null`). Reálné `unclaimed` (mají source) i účty uživatelů (mají owner_id) zůstanou.
  - **`supabase/unclaimed-providers.sql`** = reálná celorepubliková data (sběr přes WebSearch/WebFetch ([[websearch-works]])):
    ~36 specialistů (trenéři + tenisové školy=academy, sportovní fyzio Praha+Brno, fitness/kondice) a ~49 reálných
    klubů/areálů ve VŠECH krajích (vč. **TJ Sokol Dobřichovice**, TK Agrofert Prostějov, I.ČLTK Praha/Plzeň, TK Zlín…).
    Vše status `unclaimed`, kontakty (kde známé) v provider_outreach. Souřadnice areálů PŘIBLIŽNÉ (město/čtvrť) — upřesnit po převzetí.
    Venues dostaly sloupec `website`. Sekce 1–9 v souboru; rozšiřitelné dalšími subjekty. Není to vyčerpávající seznam
    všech v ČR (to je průběžný crawl) — pokrývá hlavní města a kraje; autoritativní úplný zdroj = krajské svazy cztenis.cz.
- **TRENÉŘI ↔ AREÁL (bez bordelu na mapě) — `supabase/trainers.sql`:** specialists dostali `venue_id` (FK na venues).
  Princip „jedno místo = jeden pin": trenér s venue_id NEMÁ vlastní pin (MapExplorer ho přeskočí: `if (s.venue_id) return`),
  je vidět v profilu areálu v sekci „Trenéři a tým"; nezávislý trenér (bez venue_id) pin má; v katalogu jsou všichni.
  Zdroj trenérů = veřejné stránky „trenéři/tenisová škola" klubů → rovnou známe areál (auto-přiřazení). Naseedováno
  ~102 trenérů ve 12 klubech: I.ČLTK Praha (12), TC Brno (20), LTC Houštka (17), Agrofert Prostějov (11), TJ Start
  Ostrava-Poruba (10), TK Precheza Přerov (9), TK MILO Olomouc (8), DTJ HK (5), Zlín (5), ŽLTC Brno (2), Loko Plzeň (2),
  Konstruktiva (1). Metoda: WebFetch coach-stránky (přímý fetch >> search summary; hádání /treneri ~50% hit). Pokračovat
  club-by-club (každý klub = najít přesné URL coach-stránky). Centrální registry: ČDST cdst.cz, registr trenérů ČTS.
  `/areal/[id]` (ArealDetailClient) má teď výpis trenérů + unclaimed banner (claim/opt-out přes venue_id) + nevymýšlí rating/popis.
- **RUN ORDER SQL (vše PO schema/clenstvi/admini):** claimable.sql → unclaimed-providers.sql → **trainers.sql** → cleanup-demo.sql.
  **`supabase/RUN-ALL.sql`** = ty 4 slepené v pořadí (Jan spustí najednou). Po editaci kteréhokoli z nich PŘEGENEROVAT.
- **SEO + DEPLOY (rozjeto):** `src/app/robots.ts` (indexace gated `NEXT_PUBLIC_ALLOW_INDEX` — default OFF, ať se staging
  neindexuje) + `src/app/sitemap.ts` (force-dynamic; statické cesty + všechny profily z DB, fetch v try/catch → lokálně
  jen statické). **Middleware zpevněn** (`getUser` v try/catch → výpadek Supabase neshodí web na 500; matcher vyřazuje
  robots.txt/sitemap.xml). Base URL přes `NEXT_PUBLIC_SITE_URL` (fallback tenishub.cz). **`DEPLOY.md`** = návod na Vercel
  (dočasná adresa, env, Supabase Auth URL, RUN-ALL.sql). SSR načítání dat funguje až na Vercelu (lokálně síť blokovaná).
  Další SEO krok: překlopit `/trener/[id]` a `/areal/[id]` na server-fetch (SSR) + generateMetadata + JSON-LD + městské landing stránky.
- **Sekce „Pro koho"** na homepage = persona explorer: 8 person (`PERSONAS` v page.tsx, viz `docs/PORADCI-funkce.md`),
  každá má příslib + 4 funkce + CTA prolinkované na /trener, /mapa, /areal.
- POZOR: nespouštět `npm run build`, když běží `npm run dev` (sdílí `.next` → rozbije dev: „Cannot read
  properties of undefined (reading 'call')"). Když k tomu dojde: stop dev, `rm -rf .next`, znovu `npm run dev`.
- Pozn.: ESLint hlásí „circular structure" (nesoulad verzí eslint-config-next vs next) — kosmetické, build to nezdrží.

## Shrnutí strategie (1 odstavec)
TenisHub dnes stojí na nejslabší monetizaci (placený obsah) a má slabé SEO (web je celý v JavaScriptu).
Cesta k #1: pozice **„operační systém českého tenisu"** — marketplace (rezervace + platby trenérů, kurtů,
fyzio, fitness) + nástroje pro profíky a areály + komunita/obsah/data. Monetizace: stranu, co vydělává
(trenéři, fyzio, fitness, areály, akademie), zpoplatnit víc; rodiče/hráče držet zdarma/levně kvůli likviditě.
Růst přes lokální SEO + areály jako distribuci + komunitu rodičů.

## Segmenty a „proč zaplatí"
- Rodič hobby → pohodlí/důvěra (najít+rezervovat+zaplatit, sparring) — zdarma/levné prémium.
- Rodič závodní → konkurenční výhoda + klid (profil hráče, žebříčky, turnaje, špičkoví specialisté, matchmaking) — nejvyšší ochota platit.
- Trenér → klienti + méně administrativy (leady, kalendář, platby, omluvenky, prodej kurzů) — předplatné / provize.
- Fyzio a fitness trenéři tenistů → noví klienti (profil, leady, prodej programů) — prémiový profil.
- Klub / areál → obsazenost kurtů + viditelnost (rezervační systém, „obsaď kurt", napojení trenérů) — B2B předplatné.

## Tech (návrh, až se bude stavět)
- Stejný osvědčený stack jako ostatní projekty: **Next.js + TypeScript + Tailwind**, **Vercel**, **Supabase**, platby **GoPay**.
- Důraz na **server-side rendering kvůli SEO** (dnešní web ho nemá — kritická slabina).

## Stav (k 11. 6. 2026)
- ✅ Analýza tenishub.cz + strategie s poradním týmem (`docs/STRATEGIE-TenisHub.md`).
- ✅ Webglobe prozkoumán a zdokumentován (viz Doména a hosting níže). Ostrý web = WordPress.
- ✅ Založen Next.js projekt v rootu; hotová **homepage** + **mapa** (`/mapa`) podle mockupů.
- ⏳ Další kroky: profil trenéra a dashboard areálu (mockupy v `docs/`), reálná data (Supabase),
  rezervace + platby (GoPay), lokální SEO. Pozn.: pozor na smazaný cowork kód — stavíme nově.

## Doména a hosting (zjištěno z registru CZ.NIC, 06/2026)
- Doména **tenishub.cz**, registrace 27. 7. 2025, expirace **27. 7. 2028**.
- **Držitel: Jiří Machek** (stejný člověk jako tenisový trenér v MS GEM).
- **Registrátor: Webglobe, s.r.o.** (webglobe.cz).
- Jmenné servery: ns1/ns2/ns3.webglobe.cz → **web i DNS běží na Webglobe** (hosting nejspíš tamtéž).
- DNSSEC zapnuté (řešit jen kdyby se měnily nameservery; viz upřesněný plán níže).
- **Přístup:** stačí získat login do účtu Webglobe (od Jiřího, nebo reset hesla na e-mail účtu).
  Ten účet má pravděpodobně doménu + DNS + hosting + WordPress pohromadě.
- Přepnutí na nový web = změna DNS/nameserverů v Webglobe na Vercel, plně vratné během minut.

### Ověřeno přímo v účtu Webglobe (11. 6. 2026, přihlášen jako machekjirka@gmail.com)
- **Účet je v pořádku:** žádné neuhrazené faktury, žádný kredit; doména i hosting placené do 2028.
- **Hosting:** „Webhosting Plus" (`multi_729786`), tenishub.cz na něm, stav AKTIVNÍ. Expirace 26. 7. 2028.
- **Ostrý web = WordPress.** DB `tenishub_cz` (poznámka „WORDPRESS – tenishub.cz"), MariaDB, ~94,9 MB,
  server `db.dw303.webglobe.com`. (Tj. ne čistá JS appka — WP nejspíš s JS-náročným builderem → slabá SEO.)
- **DNS (spravované u Webglobe):**
  - `@` (root) a `*` → A `185.102.21.214` (web)
  - `imap` / `mail` / `pop3` / `smtp` → A `62.109.151.33` (pošta)
  - MX → `email.webglobe.cz` + `email2/3/4.webglobe.cz`, priorita 10
- **DNSSEC:** AKTIVNÍ (key-signing key, keyid 39820). V panelu je „Deaktivace DNSSEC".
- **NIS2 upozornění:** u registračního kontaktu chybí platné telefonní číslo — doplnit (dělá Jan, je to změna kontaktních údajů).

### Plán přepnutí na Vercel (upřesněno – nejbezpečnější cesta)
- **Nechat DNS u Webglobe** a jen přepsat webové záznamy → DNSSEC se NEřeší (Webglobe zónu znovu podepíše):
  - `@` (root) A → `76.76.21.21` (Vercel)
  - přidat `www` CNAME → `cname.vercel-dns.com`
- **Pošta zůstává beze změny** (MX + imap/mail/pop3/smtp záznamy nesahat).
- Plně vratné během minut (vrátit A zpět na `185.102.21.214`). DNSSEC/nameservery měnit jen kdyby se DNS stěhovalo pryč z Webglobe.

## Bezpečnost / pravidla
- Nesahat na ostrý web tenishub.cz. Nový vývoj stavět vedle, na dočasné adrese, přepnout až po schválení.
