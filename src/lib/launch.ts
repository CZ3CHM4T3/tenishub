// ============================================================
// JEDEN PŘEPÍNAČ SPUŠTĚNÍ PROJEKTU.
//
// Než spustíme platby, členská tlačítka po webu vedou na /pristup (předběžný
// přístup / waitlist). Až budeme spouštět a bude napojená platba (GoPay/Stripe):
//   → přepni PAYMENTS_LIVE na true.
// Tím se /pristup přepne z waitlistu na NÁKUP členství a všechna členská CTA
// začnou vést k platbě. Nic víc měnit nemusíš.
// ============================================================
export const PAYMENTS_LIVE = false;

// Kam vede „chci členství" tlačítko podle stavu.
export const MEMBER_HREF = PAYMENTS_LIVE ? "/clenstvi#koupit" : "/pristup";
export const MEMBER_LABEL = PAYMENTS_LIVE ? "Koupit členství" : "Chci předběžný přístup";
