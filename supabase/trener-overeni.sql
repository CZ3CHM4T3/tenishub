-- Ověření trenéra: čestné prohlášení o pravosti licence/údajů.
-- Checklist v /klub (KlubOvereni) odškrtává podmínky automaticky; když jsou
-- všechny splněné (jméno, fotka, adresa, web, ≥1 hodnocení, prohlášení),
-- nastaví se specialists.verified = true a trenér má odznak ✓ všude.
alter table public.specialists add column if not exists license_declared boolean not null default false;
