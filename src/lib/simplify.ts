// ─────────────────────────────────────────────────────────────
// DOČASNÉ ZJEDNODUŠENÍ WEBU (Janovo rozhodnutí, 8/2026)
// Web se zatím tváří jen jako: RODIČE + DĚTI + TRENÉŘI (pastevci klubů)
// + kluby a sparring. Skryté (NE smazané): fitness, fyzio, vyplétač,
// samostatná role „dospělý hráč".
//
// VŠE JE JEN SKRYTO. Pro návrat sekce stačí odebrat její klíč z množin
// níže (nic se nemazalo — kód, data i stránky zůstávají).
// ─────────────────────────────────────────────────────────────

// Role/persony schované z rozcestníků, menu, homepage.
export const HIDDEN_ROLES = new Set<string>(["hrac", "fyzio", "fitness", "vyplet"]);
export const isHiddenRole = (key: string): boolean => HIDDEN_ROLES.has(key);

// Typy služeb schované na MAPĚ i v kartách služeb (necháváme trenér, areál/klub, sparring).
export const HIDDEN_SERVICE_TYPES = new Set<string>(["fyzio", "fitness"]);
export const isHiddenServiceType = (key: string): boolean => HIDDEN_SERVICE_TYPES.has(key);

// Mapové piny dle indexu (REAL_POINTS/ServiceMap): 5 = fyzio, 6 = fitness.
export const HIDDEN_MAP_IDX = new Set<number>([5, 6]);
export const isHiddenMapIdx = (idx: number): boolean => HIDDEN_MAP_IDX.has(idx);

// Typy na velké mapě /mapa (MapExplorer klíče): fitness, fyzio (physio), vyplétač (stringer).
export const HIDDEN_MAP_TYPEKEYS = new Set<string>(["fitness", "physio", "stringer"]);
export const isHiddenMapType = (key: string): boolean => HIDDEN_MAP_TYPEKEYS.has(key);

// Cesty schované z navigace, patičky a sitemapy (neindexovat).
export const HIDDEN_PATHS = new Set<string>(["/sluzby", "/vypletac"]);
export const isHiddenPath = (path: string): boolean => HIDDEN_PATHS.has(path);
