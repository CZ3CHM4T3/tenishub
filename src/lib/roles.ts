// Obsah pro jednotlivé role — použito na /pro-koho?role=KEY (role-specifická stránka).
export type RoleFeat = { label: string; soon?: boolean };
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
    key: "hrac", label: "Hráč", tagline: "hraj, zlepšuj se, sparring", color: "#3b5666", fill: "#E5ECF1", icon: "hrac", photo: "/role-hrac.jpg", provider: false,
    find: { label: "Najít s kým hrát", href: "/sparring" },
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
    key: "trener", label: "Trenér", tagline: "klienti a méně administrativy", color: "#7C4DD6", fill: "#EEEDFE", icon: "trener", photo: "/role-trener.jpg", provider: true,
    find: { label: "Najít trenéra na mapě", href: "/mapa?type=coach" },
    free: [
      { label: "Vizitka v katalogu" },
      { label: "Být k nalezení na mapě" },
      { label: "Veřejné recenze" },
    ],
    plus: [
      { label: "Kalendář a online rezervace" },
      { label: "Platby předem (GoPay)", soon: true },
      { label: "Správa klientů a omluvenky", soon: true },
      { label: "Ověřený odznak a top pozice", soon: true },
    ],
  },
  sparring: {
    key: "sparring", label: "Sparring partner", tagline: "najdi, s kým si zahrát", color: "#8a5640", fill: "#F2E6DF", icon: "sparring", photo: "/role-sparring.jpg", provider: false,
    find: { label: "Najít parťáka / přidat inzerát", href: "/sparring" },
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
    key: "areal", label: "Areály & kluby", tagline: "obsazenost kurtů + viditelnost", color: "#2f5d57", fill: "#E0EBE9", icon: "areal", photo: "/role-areal.jpg", provider: true,
    find: { label: "Najít kurt na mapě", href: "/mapa?type=club" },
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
    key: "fyzio", label: "Fyzioterapeut", tagline: "noví klienti z tenisu", color: "#864a59", fill: "#F2E5E9", icon: "fyzio", photo: "/role-fyzio.jpg", provider: true,
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
    key: "fitness", label: "Kondiční trenér", tagline: "kondiční příprava tenistů", color: "#4a5b86", fill: "#E8ECF4", icon: "fitness", photo: "/role-fitness.jpg", provider: true,
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
    key: "vyplet", label: "Vyplétač", tagline: "servis raket", color: "#5a6470", fill: "#E6E9ED", icon: "vyplet", photo: "/role-vyplet.jpg", provider: true,
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
