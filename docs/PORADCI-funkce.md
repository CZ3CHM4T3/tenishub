# Poradní tým — funkce podle persony („bombová hodnota")

8 person, každá má na webu (sekce „Pro koho" na homepage) svůj panel: **příslib** + 4 funkce + CTA.
Zdroj pravdy pro implementaci je `src/app/page.tsx` (pole `PERSONAS`). Tento dokument je shrnutí debaty týmu.

## Princip
Strana, co **vydělává** (trenér, areál, fyzio/fitness) = nástroje na klienty → platí víc.
Strana **poptávky** (rodiče, hráči, sparring) = pohodlí a komfort → zdarma / levné prémium.
Hodnota napřed, nikdy zeď na vstupu. (Viz monetizační koncept v konverzaci.)

## 1. Tenisový trenér — „Víc klientů, míň papírování."
- Ověřený profil → důvěra a lepší pozice ve vyhledávání
- Kalendář + online rezervace → konec domlouvání přes SMS
- Platba předem (GoPay) → míň stornů a neplatičů
- Správa klientů → omluvenky, kredit, kurzy na jednom místě
- CTA → `/trener`

## 2. Rodič hobby hráče — „Najdi, rezervuj, zaplať — a měj klid."
- Ověření trenéři poblíž (recenze, volné termíny)
- Rezervace na pár kliků (bez telefonování)
- Přehled dítěte (lekce, platby, omluvenky)
- Parťák na zahrání
- CTA → `/mapa`

## 3. Rodič závodního hráče — „Konkurenční výhoda pro tvé dítě." (nejvyšší ochota platit)
- Profil hráče (výsledky, žebříček, vývoj)
- Plánovač turnajů a cest
- Špičkoví specialisté (fyzio, kondice, mentál, video)
- Sparring na úrovni (matchmaking dle výkonnosti)
- CTA → `/mapa`

## 4. Hráč amatér — „Vždycky s kým a kde hrát."
- Sparring matchmaking (úroveň, okolí)
- Rezervace kurtů a trenérů
- Amatérské ligy a výzvy
- Statistiky zápasů
- CTA → `/mapa`

## 5. Hráč závodní — „Celý tvůj tenisový tým na jednom místě."
- Profil + oficiální výsledky/žebříček
- Plánovač turnajů
- Trenér, fyzio i kondice pohromadě
- Video-analýza a statistiky
- CTA → `/mapa`

## 6. Sparring partner — „Nabídni se a hraj víc."
- Sparring profil (úroveň, dostupnost, lokalita)
- Najdou tě v matchmakingu
- Domluv termín i kurt online
- Recenze = reputace
- CTA → `/mapa`

## 7. Klub / areál — „Plné kurty, míň práce." (B2B)
- Rezervační systém + online platby
- „Obsaď kurt teď" (prázdná okna se slevou)
- Profil areálu (viditelnost, ceník, fotky, mapa)
- Statistiky vytíženosti
- CTA → `/areal`

## 8. Fyzio & fitness trenér — „Noví klienti přímo z tenisu."
- Profil specialisty + recenze (autorita)
- Online objednání + platba
- Poptávky od hráčů (zranění, prevence, kondice)
- Prodej programů a balíčků
- CTA → `/trener`
