# Nasazení TenisHubu na DOČASNOU adresu (Vercel)

Cíl: dostat web na živou testovací adresu (např. `tenishub-xxxx.vercel.app`), **aniž bychom sahali
na ostrý tenishub.cz**. Plně vratné. Na ostrou doménu přepneme až po schválení.

> Proč Vercel: server-side rendering (kvůli SEO) v lokálu nefunguje (blokovaná síť), na Vercelu ano.
> Teprve naživo se ukáže plný obsah profilů Googlu i alfa testérům.

---

## Co je potřeba mít
- Účet **GitHub** (zdarma) a **Vercel** (zdarma, přihlásí se přes GitHub).
- Supabase už máš nastavené (projekt `hvfmqxznguijbqqoxdfd`).

## 1) Kód na GitHub
Řekni mi „připrav git" a já projekt připravím (inicializuju git + první commit). Pak:
1. Na GitHubu vytvoř nový **prázdný** repozitář (např. `tenishub`), klidně **Private**.
2. Pošlu ti 3 příkazy na zkopírování (`git remote add… / git push…`), nebo to nahraj přes GitHub Desktop.

## 2) Import do Vercelu
1. https://vercel.com → **Add New… → Project** → vyber repozitář `tenishub`.
2. Framework se detekuje jako **Next.js** (nech výchozí).
3. **Environment Variables** — přidej (zkopíruj ze souboru `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL` = (tvá Supabase URL)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (tvůj anon klíč)
   - `NEXT_PUBLIC_ALLOW_INDEX` = `false`  *(nech vypnuté — ať Google neindexuje testovací adresu)*
4. **Deploy**. Za ~1–2 min dostaneš adresu `https://tenishub-xxxx.vercel.app`.
5. (Volitelně po prvním deployi) přidej env `NEXT_PUBLIC_SITE_URL` = ta vercel adresa a redeployni —
   sjednotí odkazy v sitemapě.

## 3) Supabase — povolit přihlášení na nové adrese
V Supabase → **Authentication → URL Configuration**:
- **Site URL**: vlož `https://tenishub-xxxx.vercel.app`
- **Redirect URLs**: přidej `https://tenishub-xxxx.vercel.app/**`
  (jinak by nešlo přihlášení a obnova hesla na nové adrese)

## 4) Data
Pokud jsi ještě nespustil, otevři Supabase → SQL Editor a spusť **`supabase/RUN-ALL.sql`**
(předtím musí být hotové `schema.sql` + `clenstvi.sql` + `admini.sql`). Tím se na mapě objeví reální
trenéři, kluby a fyzio.

## 5) Hotovo
Otevři vercel adresu — web je živý. **Indexace je schválně vypnutá** (testovací fáze).

---

## Až spustíme ostře (později — neřešit teď)
1. V Webglobe DNS přepnout `@` A‑záznam na Vercel + přidat `www` CNAME (viz `CLAUDE.md`, plán přepnutí).
   Pošta zůstává beze změny. Vratné během minut.
2. Ve Vercelu přidat doménu `tenishub.cz`.
3. Env změnit: `NEXT_PUBLIC_ALLOW_INDEX=true` a `NEXT_PUBLIC_SITE_URL=https://tenishub.cz` → redeploy.
   Tím se **zapne indexace** a sitemapa/odkazy ukážou na ostrou doménu.
4. V Supabase Auth přepsat Site URL/Redirect na `https://tenishub.cz`.
