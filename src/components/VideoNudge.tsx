"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Props = {
  side?: "left" | "right";
  bottom?: number;
  delay?: number;
  photo: string;
  title: string;
  sub: string;
  href?: string;
};

export function VideoNudge({ side = "left", bottom = 18, delay = 2600, photo, title, sub, href = "/videorozbor" }: Props) {
  const [shown, setShown] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShown(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (closed) return null;
  return (
    <Link href={href} className={`videonudge ${side}${shown ? " in" : ""}`} style={{ bottom }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt="" className="videonudge-ph" />
      <span>
        <b>{title}</b>
        <span>{sub}</span>
      </span>
      <button
        className="videonudge-x"
        aria-label="Zavřít"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setClosed(true); }}
      >×</button>
    </Link>
  );
}
