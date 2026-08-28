// Jednotná barevná identita služeb — STEJNÁ všude na webu (podle cíle/href).
export const SERVICE_COLOR: Record<string, string> = {
  "/moje-cesta": "#7C4DD6", // fialová
  "/sparring": "#8a5640",   // hnědá
  "/turnaje": "#bf9a47",    // zlatá
  "/videorozbor": "#864a59",// vínová
  "/forum": "#2f5d57",      // teal
  "/poradna": "#b5546e",    // růžová
  "/clanky": "#7c6018",     // olivová (Knihovna)
  "/bazar": "#b06a2c",      // oranžová
  "/spolujizda": "#3b8a5a", // zelená
  "/pocasi": "#3b6ea5",     // modrá
  "/mapa": "#2e7d4f",       // klubová zelená
  "/zpravy": "#4a5b86",     // šedomodrá
};

export const serviceColor = (href: string): string => SERVICE_COLOR[href] ?? "#2f5d57";
