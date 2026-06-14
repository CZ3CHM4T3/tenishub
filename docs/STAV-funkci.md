# TenisHub — stav funkcí (co funguje vs co dodělat)

Aktualizováno při redesignu. Legenda: ✅ funguje · 🟡 prototyp (vizuální, neukládá) · ❌ chybí.

## ✅ Reálně funkční / klikatelné
- **Navigace** — header dropdowny („Pro koho", „Funkce") na klik; všechny odkazy vedou na /mapa, /trener, /areal.
- **Plástev služeb** (hero) — klik na buňku naviguje (Trenér→/trener, Rodič/Hráč/Sparring→/mapa, Areály→/areal, Fyzio→/trener).
- **Mapa `/mapa`** — REÁLNÁ data ze Supabase (specialisté + areály + sparring). Funguje: filtr typů, filtr vzdálenosti
  (km/min slider), výběr města, počítadlo nálezů, popupy s prolinkem na profil/areál. ✅ čtení z DB přes anon RLS.
- **Sekce „Pro koho"** — přepínání 8 person, barevné odlišení, CTA vedou na funkční stránky.
- **Marquee specialistů** — reálná data z DB.
- **Carousel testimonialů**, **dropdown menu**, **live počítadla** (animace) — UI funguje.

## 🟡 Prototyp (vizuálně funguje, ale NEUKLÁDÁ / je natvrdo)
- **Profil trenéra `/trener`** — kalendář volných hodin (klik na slot) + tok *zpráva → rezervace → platba → hotovo*.
  Vše je jen vizuál: data natvrdo, rezervace se nikam nezapíše, platba je fake.
- **Dashboard areálu `/areal`** — mřížka kurtů (klik na volné okno označí „Vy"), „Obsaď kurt teď". Neukládá se.
- **Hero search bar** — tlačítko vede na /mapa, ale samo nehledá podle textu/města.

## ❌ Chybí — nutno zprovoznit
1. **Přihlášení / registrace (auth)** — „Přihlásit se" a „Vstoupit zdarma" nikam nevedou. Žádné účty (Supabase Auth).
2. **Profil per-záznam** — existuje jen JEDEN vzorový trenér a areál; klik z mapy vede vždy na stejný vzor,
   ne na konkrétní záznam z DB. (Potřeba `/trener/[id]`, `/areal/[id]` načítané z DB.)
3. **Reálná rezervace** — zápis rezervace lekce/kurtu do DB (tabulka `bookings`) + kalendář z DB.
4. **Platby (GoPay)** — reálná platební brána místo fake modalu.
5. **Recenze** — přidávání recenzí (zápis do `reviews`).
6. **Sparring** — vytváření nabídek parťáků (zápis do `sparring_offers`).
7. **Reálné vyhledávání** v search baru (fulltext + místo) napojené na mapu/výsledky.
8. **Členství / prémium** — placené funkce, předplatné.
9. **Reálné statistiky** místo vymyšlených čísel; **komunita/feed** z reálných událostí.

## Doporučené pořadí zprovoznění
1) Auth (přihlášení) → 2) profily per-id z DB → 3) rezervace do DB → 4) platby GoPay → 5) recenze/sparring → 6) prémium.
