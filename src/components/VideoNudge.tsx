"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function VideoNudge() {
  const [shown, setShown] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShown(true), 2600);
    return () => clearTimeout(t);
  }, []);

  if (closed) return null;
  return (
    <Link href="/videorozbor" className={`videonudge${shown ? " in" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/videorozbor-1.png" alt="" className="videonudge-ph" />
      <span>
        <b>Nebaví vaše dítě tenis?</b>
        <span>Poradíme proč — videorozbor &amp; konzultace →</span>
      </span>
      <button
        className="videonudge-x"
        aria-label="Zavřít"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setClosed(true); }}
      >×</button>
    </Link>
  );
}
