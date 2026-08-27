"use client";

// Náhledová perspektiva pro adminy — díváme se na web očima rodiče/trenéra/návštěvníka.
// Uloženo v localStorage; platí jen pro reálné adminy (jinak se ignoruje).
export type ViewAs = "admin" | "navstevnik" | "rodic" | "trener" | "sparring" | "vyplet" | "fyzio" | "fitness";
const KEY = "th_viewas";
const VALID: ViewAs[] = ["admin", "navstevnik", "rodic", "trener", "sparring", "vyplet", "fyzio", "fitness"];

export function getViewAs(): ViewAs {
  if (typeof window === "undefined") return "admin";
  try {
    const v = localStorage.getItem(KEY) as ViewAs | null;
    return v && VALID.includes(v) ? v : "admin";
  } catch { return "admin"; }
}

export function setViewAs(v: ViewAs) {
  try { localStorage.setItem(KEY, v); } catch { /* */ }
}
