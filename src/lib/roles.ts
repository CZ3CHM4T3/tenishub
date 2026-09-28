// Obsah pro jednotlivé role — použito na /pro-koho?role=KEY (role-specifická stránka).
export type RoleFeat = { label: string; soon?: boolean };
// „Proč se to vyplatí" — karty s ikonou, nadpisem a popisem (stejný styl jako /rodic).
export type RoleWhy = { icon: string; title: string; desc: string };
export type Role = {
  key: string;
  label: string;
  tagline: string;
  color: string;
  fill: string;
  icon: "trener" | "rodic" | "hrac" | "sparring" | "areal" | "fyzio" | "fitness" | "vyplet";
  photo: string;                // fotka do hlavičky role
  provider: boolean;            // poskytovatel služby (jinak spotřebitel)
  find: { label: string; href: string };
  why?: RoleWhy[];              // 4 karty „proč" (ikona + nadpis + popis)
  free: RoleFeat[];
  plus: RoleFeat[];
};

export const ROLE_ORDER = ["rodic", "hrac", "trener", "sparring", "areal", "fyzio", "fitness", "vyplet"];

export const ROLES: Record<string, Role> = {
  rodic: {
    key: "rodic", label: "Rodič & dítě", tagline: "najít, hlídat cestu, poradit", color: "#7c6018", fill: "#F2EAD6", icon: "rodic", photo: "/svet-rodic.png", provider: false,
    find: { label: "Najít trenéra nebo kurt", href: "/mapa" },
    free: [
      { label: "Najít trenéra, kurt i fyzio na mapě" },
      { label: "Profily, ceníky a recenze" },
      { label: "Napsat trenérovi (zprávy)" },
      { label: "Prohlížet sparring nabídky" },
      { label: "Veřejné žebříčky a články" },
    ],
    plus: [
      { label: "Moje cesta — celá sezóna dítěte" },
      { label: "Rezervace a platby na pár kliků" },
      { label: "Profil hráče, výsledky a žebříček" },
      { label: "Plánovač turnajů + tréninkový checklist" },
      { label: "Připomínky lekcí a plateb", soon: true },
    ],
  },
  hrac: {
    key: "hrac", label: "Hráč", tagline: "hraj, zlepšuj se, sparring", color: "#3b5666", fill: "#E5ECF1", icon: "hrac", photo: "/role-hrac.png", provider: false,
    find: { label: "Najít s kým hrát", href: "/sparring" },
    why: [
      { icon: "search", title: "Najdi kurt i trenéra", desc: "Mapa kurtů, klubů a trenérů poblíž — profily, ceny a recenze na jednom místě." },
      { icon: "handshake", title: "Sparring", desc: "Parťáci podle úrovně a matchmaking — vždy máš s kým hrát." },
      { icon: "gauge", title: "Moje cesta", desc: "Statistiky zápasů, forma a plán sezóny — vidíš, kam se posouváš." },
      { icon: "trophy", title: "Turnaje a ligy", desc: "Přehled turnajů a žebříčků, ať víš, kde nastoupit." },
    ],
    free: [
      { label: "Mapa kurtů a trenérů" },
      { label: "Prohlížet sparring nabídky" },
      { label: "Profily a recenze" },
      { label: "Veřejné žebříčky" },
    ],
    plus: [
      { label: "Rezervace kurtů a lekcí" },
      { label: "Sparring matchmaking podle úrovně" },
      { label: "Moje cesta — statistiky a forma" },
      { label: "Video-analýza zápasů", soon: true },
      { label: "Turnaje a ligy", soon: true },
    ],
  },
  trener: {
    key: "trener", label: "Trenér", tagline: "klienti a méně administrativy", color: "#d9822b", fill: "#FBEEDD", icon: "trener", photo: "/role-trener.png", provider: true,
    find: { label: "Najít trenéra na mapě", href: "/mapa?type=coach" },
    why: [
      { icon: "users", title: "Klienti vás najdou", desc: "Profil na mapě i v katalogu — rodiče a hráči vás vyhledají podle místa a recenzí." },
      { icon: "calendar", title: "Míň administrativy", desc: "Kalendář, online rezervace a platby předem — konec domlouvání přes SMS." },
      { icon: "badge", title: "Renomé a důvěra", desc: "Ověřený odznak a renomé, které si vyslužíte růstem klubu — rodiče podle něj filtrují." },
      { icon: "trophy", title: "Nástroje pro klub", desc: "Nástěnka, akce, svěřenci i herní vrstva (strom dovedností, Sparring Cup) na jednom místě." },
    ],
    free: [
      { label: "Vizitka v katalogu" },
      { label: "Být k nalezení na mapě" },
      { label: "Veřejné recenze" },
    ],
    plus: [
      { label: "Kalendář a online rezervace" },
      { label: "Platby předem (Barion)", soon: true },
      { label: "Správa klientů a omluvenky", soon: true },
      { label: "Ověřený odznak a top pozice", soon: true },
    ],
  },
  sparring: {
    key: "sparring", label: "Sparring partner", tagline: "najdi, s kým si zahrát", color: "#8a5640", fill: "#F2E6DF", icon: "sparring", photo: "/role-sparring.png", provider: false,
    find: { label: "Najít parťáka / přidat inzerát", href: "/sparring" },
    why: [
      { icon: "handshake", title: "Najdi parťáka", desc: "Hráči podle úrovně, místa i stylu hry — domluva zápasu přímo přes web." },
      { icon: "map", title: "Ve tvém okolí", desc: "Nabídky i piny na mapě poblíž tebe, ať nejezdíš přes půl republiky." },
      { icon: "gauge", title: "Podle úrovně", desc: "Matchmaking spáruje vyrovnané soupeře — zápas, co má smysl." },
      { icon: "star", title: "Hodnocení po zápase", desc: "Zpětná vazba buduje důvěru v komunitě." },
    ],
    free: [
      { label: "Prohlížet sparring nabídky" },
      { label: "Vidět úroveň, místo a styl hry" },
    ],
    plus: [
      { label: "Vlastní sparring inzerát" },
      { label: "Kontaktovat parťáka přímo" },
      { label: "Matchmaking podle úrovně", soon: true },
      { label: "Hodnocení po zápase", soon: true },
    ],
  },
  areal: {
    key: "areal", label: "Areály & kluby", tagline: "obsazenost kurtů + viditelnost", color: "#2f5d57", fill: "#E0EBE9", icon: "areal", photo: "/role-areal.png", provider: true,
    find: { label: "Najít kurt na mapě", href: "/mapa?type=club" },
    why: [
      { icon: "calendar", title: "Rezervační systém", desc: "Online rezervace kurtů i platby na jednom místě — bez telefonování." },
      { icon: "zap", title: "Obsaď kurt teď", desc: "Vyplňte volná okna a zvyšte vytíženost areálu." },
      { icon: "map", title: "Viditelnost", desc: "Profil areálu na mapě, kontakty, otevírací doba — lidé vás najdou." },
      { icon: "users", title: "Napojení trenérů", desc: "Trenéři u vás = víc lidí na kurtech a stabilní příjem." },
    ],
    free: [
      { label: "Profil areálu na mapě" },
      { label: "Kontakty a otevírací doba" },
    ],
    plus: [
      { label: "Rezervační systém + platby" },
      { label: "Obsaď volný kurt teď" },
      { label: "Statistiky vytíženosti", soon: true },
      { label: "Napojení trenérů", soon: true },
    ],
  },
  fyzio: {
    key: "fyzio", label: "Fyzioterapeut", tagline: "noví klienti z tenisu", color: "#864a59", fill: "#F2E5E9", icon: "fyzio", photo: "/role-fyzio.png", provider: true,
    find: { label: "Najít fyzio na mapě", href: "/mapa?type=physio" },
    free: [
      { label: "Profil fyzia na mapě" },
      { label: "Veřejné recenze" },
    ],
    plus: [
      { label: "Online objednávky termínů" },
      { label: "Poptávky od hráčů (leady)", soon: true },
      { label: "Rehabilitační plány online", soon: true },
      { label: "Ověřený odznak", soon: true },
    ],
  },
  fitness: {
    key: "fitness", label: "Fitness trenér", tagline: "kondiční příprava tenistů", color: "#4a5b86", fill: "#E8ECF4", icon: "fitness", photo: "/role-fitness.png", provider: true,
    find: { label: "Najít kondičního na mapě", href: "/mapa?type=fitness" },
    free: [
      { label: "Profil kondičního trenéra na mapě" },
      { label: "Veřejné recenze" },
    ],
    plus: [
      { label: "Online objednávky tréninků" },
      { label: "Poptávky od hráčů a rodičů", soon: true },
      { label: "Prodej kondičních programů", soon: true },
      { label: "Ověřený odznak", soon: true },
    ],
  },
  vyplet: {
    key: "vyplet", label: "Vyplétač", tagline: "servis raket", color: "#5a6470", fill: "#E6E9ED", icon: "vyplet", photo: "/role-vyplet.png", provider: true,
    find: { label: "Najít vyplétače na mapě", href: "/mapa?type=stringer" },
    free: [
      { label: "Vizitka v katalogu" },
      { label: "Kontakt a ceník výpletů" },
      { label: "Veřejné recenze" },
    ],
    plus: [
      { label: "Pin na mapě + top pozice" },
      { label: "Online objednávka vyplétání", soon: true },
      { label: "Poptávky od hráčů a klubů", soon: true },
      { label: "Ověřený odznak", soon: true },
    ],
  },
};
