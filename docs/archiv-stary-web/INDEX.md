# Starý web tenishub.cz (WordPress) — migrační checklist

Kompletní obsah starého webu, ať se nic neztratí při překlopení na nový.
Starý web **zůstává běžet**, dokud nový nespustíme — nic teď nemizí.
Zdroj pravdy = WordPress admin (Stránky/Příspěvky). Tady je seznam + stav migrace.

Kontaktní/legal údaje (z GDPR stránky): **Jiří Machek, info@tenishub.cz, Krajníkova 630, 252 29 Dobřichovice.**

## Stránky (18)

| URL | Co to je | Stav na novém webu |
|---|---|---|
| `/` | Homepage | ✅ nová homepage |
| `/o-nas/` | O nás | ✅ /o-nas |
| `/mapa-sluzeb/` | Mapa služeb | ✅ /mapa |
| `/profily-treneri/` | Profily trenérů | ✅ /trener/[id] + katalog |
| `/komunita/` | Komunita | ✅ /forum, /clanky, /poradna… |
| `/pro-rodice/` | Pro rodiče | ✅ /rodic |
| `/trenersky-koutek/` | Trenérský koutek | 🟡 obsah přenést |
| `/ze-sveta-tenisu/` | Ze světa tenisu | 🟡 rubrika článků |
| `/blog/` | Blog | ✅ /clanky (přenést obsah) |
| `/kalendar-akci/` | Kalendář akcí | ✅ /turnaje |
| `/zeptat-se/` | Zeptat se | ✅ /poradna |
| `/dotazy-premium/` | Prémiové dotazy | ✅ /poradna (HUB+) |
| `/registrace/` | Registrace | ✅ /prihlaseni |
| `/muj-ucet/` | Můj účet | ✅ /ucet |
| `/clenska-sekce/` | Členská sekce | ✅ HUB+ gating |
| `/uspesna-registrace/` | Po registraci | ✅ řeší auth flow |
| `/zmena-hesla/` | Změna hesla | ✅ /obnova |
| **`/zasady-ochrany-osobnich-udaju/`** | **GDPR — PLACENÉ** | 🔴 přenést + AKTUALIZOVAT (nové funkce) |
| **`/podminky-clenstvi-tenishub-cz/`** | **Podmínky členství — PLACENÉ** | 🔴 přenést + AKTUALIZOVAT |

## Články / příspěvky (12) — obsah pro nový /clanky

1. Babytenis – základní pravidla a formát hry
2. Pravidla minitenisu – první krok dětí k velkému tenisu
3. Střední kurt – přechod mezi minitenisem a babytenisem
4. Pravidla velkého tenisu (dospělí)
5. Základní pravidla tenisu – přehled pro hráče i trenéry
6. Jak přihlásit dítě na tenisový turnaj v ČR
7. Jak se chovat na turnajích a mistrácích
8. Jak reagovat na agresivního rodiče na turnaji
9. Jak reagovat na cílené podvádění dětí během zápasu
10. Jak na přestup nebo hostování v tenise – praktický průvodce pro rodiče
11. Úvod k blogu „Rodiče rodičům"
12. Rodiče rodičům, díl 1: Jak začít s tenisem, když rodiče sami tenis neznají

**Stav:** 🔴 přenést (12 článků). Doporučení: nekopírovat 1:1, ale **osvěžit a rozšířit** kvůli SEO (delší, aktuální, s nadpisy a FAQ) — z každého uděláme silnější článek.

## Jak přenést PLACENÉ legals bezpečně (viz vysvětlení v chatu)
- Zkopírovat z WordPress adminu (Stránky → editovat → vše zkopírovat) a poslat mi → uložím do repa.
- Nové legals ale musí pokrýt i NOVÉ funkce (rezervace, platby, zprávy, napojení na svaz, analytika) → aktualizovat, ideálně přes stejného právníka.
