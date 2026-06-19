"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Globální scroll-reveal: prvky s `.rv` naletí, jakmile se dostanou do viewportu.
// Vlastní scroll-kontrola (spolehlivá ve všech prohlížečích) — žádná závislost na
// IntersectionObserveru. Běží na každé stránce i po prokliku (usePathname).
export function ScrollReveal() {
  const pathname = usePathname();
  useEffect(() => {
    let pending = Array.from(document.querySelectorAll<HTMLElement>(".rv:not(.in)"));
    if (!pending.length) return;
    let raf = 0;

    const reveal = () => {
      const h = window.innerHeight || document.documentElement.clientHeight;
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top < h * 0.9) { el.classList.add("in"); return false; }
        return true;
      });
      if (!pending.length) detach();
    };
    const onScroll = () => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; reveal(); }); };
    function detach() { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); }

    reveal(); // odhal hned to, co je už v záběru
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => { detach(); if (raf) cancelAnimationFrame(raf); };
  }, [pathname]);
  return null;
}
