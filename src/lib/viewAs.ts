"use client";

// Náhledová perspektiva pro adminy — díváme se na web očima rodiče/trenéra/návštěvníka.
// Uloženo v localStorage; platí jen pro reálné adminy (jinak se ignoruje).
export type ViewAs = "admin" | "rodic" | "trener" | "navstevnik";
const KEY = "th_viewas";

export function getViewAs(): ViewAs {
  if (typeof window === "undefined") return "admin";
  try {
    const v = localStorage.getItem(KEY);
    return v === "rodic" || v === "trener" || v === "navstevnik" ? v : "admin";
  } catch { return "admin"; }
}

export function setViewAs(v: ViewAs) {
  try { localStorage.setItem(KEY, v); } catch { /* */ }
}
