# TenisHub — funkce a využití podle role

Návrh, co každý typ uživatele na platformě dělá a proč se mu vyplatí. Profil trenéra (`profil-trener.html`)
je hotový model — ostatní profily a dashboardy fungují na stejném principu.

---

## NABÍDKA (vydělávají → platí za nástroje a klienty)

### 🎾 Tenisový trenér — *model hotový*
Veřejný profil s hodnocením, kontakty (telefon, e-mail, web) a:
- **Zprávy** — poptávky a komunikace s klienty na jednom místě.
- **Kalendář s volnými hodinami** — open sloty, klient si vybere a rezervuje.
- **Rezervace + platba kartou (Stripe)** — zaplaceno hned, méně neplatičů a stornujících.
- **Recenze a „Ověřený trenér"** odznak — důvěra a vyšší pozice ve vyhledávání.
- Dále: správa klientů a kreditu, omluvenky, prodej vlastních kurzů/videí.
- *Proč platí:* víc klientů + méně administrativy. Předplatné nebo provize z rezervací.

### 🏟️ Klub / areál
- **Rezervační systém kurtů** — mřížka obsazenosti, online rezervace + platba.
- **„Obsaď volný kurt teď"** — last-minute nabídka prázdných okének se slevou.
- **Profil areálu** — vybavení, ceník, fotky, otevírací doba, mapa.
- **Napojení trenérů a specialistů** působících v areálu.
- Statistiky vytíženosti, prémiové umístění na mapě.
- *Proč platí:* plné kurty a noví členové. B2B předplatné.

### 🧑‍⚕️ Fyzioterapeut tenistů
- Profil specialisty + hodnocení, objednání termínů online + platba.
- Poptávky od hráčů a rodičů, kteří řeší zranění/prevenci.
- Autorita přes obsah (články, tipy).
- *Proč platí:* noví klienti z tenisového prostředí. Prémiový profil / leady.

### 💪 Fitness trenér tenistů
- Profil + rezervace + platba, prodej **online programů/balíčků** (kondice pro tenisty).
- Napojení na akademie a kluby (kondiční příprava jejich hráčů).
- *Proč platí:* noví klienti a prodej programů. (Možné propojení s Pohyb doma / MS GEM.)

### 🎓 Akademie / tenisová škola
- Profil + nábor, **přihlášky na kurzy/kempy** s platbou, členská zóna pro rodiče.
- Prodej metodiky a kempových programů ostatním školám.
- *Proč platí:* noví klienti a nástroje pro provoz. B2B předplatné.

---

## POPTÁVKA (vytvářejí hodnotu → držet zdarma/levně kvůli likviditě)

### 👪 Rodič
- **Mapa a vyhledávač** ověřených trenérů, škol, kurtů a fyzio poblíž (radius/dojezd).
- **Rezervace a platba** lekcí i kempů na pár kliků.
- **Přehled dítěte** — rozvrh, platby, kredit, omluvenky (bez SMS).
- Sparring/parťák na zahrání, srozumitelní průvodci (registrace, přestupy).
- *Hodnota:* pohodlí a jistota. Zdarma; levné prémium pro pokročilé funkce.

### 🏆 Rodič závodního hráče
- Vše výše + **profil hráče** (výsledky, žebříček), **plánovač turnajů** a cest.
- Mapa **špičkových specialistů** (fyzio, kondice, mentální kouč, video-analýza).
- Matchmaking sparing partnerů dle úrovně.
- *Hodnota:* konkurenční výhoda a klid. **Nejvyšší ochota platit prémium.**

### 🎾 Hráč
- **Profil hráče**, sparring-matchmaking, turnaje a žebříčky, rezervace kurtů a trenérů.
- Komunita, dotazy, výsledky a statistiky.
- *Hodnota:* hraní, zlepšování, patřit do komunity.

---

## Princip monetizace (shrnutí)
Stranu, co **vydělává** (trenéři, fyzio, fitness, areály, akademie), zpoplatnit víc (předplatné/provize).
Stranu, co tvoří **poptávku** (rodiče, hráči), držet zdarma/levně, aby vznikla likvidita trhu.
Hodnotu držet v **nástrojích a transakcích** (kalendář, rezervace, platby, omluvenky, recenze), ne jen v seznámení.
