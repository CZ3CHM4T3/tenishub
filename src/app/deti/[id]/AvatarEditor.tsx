"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AVATARS, AVBG, avatarSrc, bgSrc, frameOf, type AvatarFrames } from "@/lib/avatar";
import { Pencil } from "lucide-react";

export default function AvatarEditor({
  childId,
  model,
  bg,
  frames,
  bgsOff = [],
  prezdivka,
  anonym = false,
}: {
  childId: string;
  model: string;
  bg: string;
  frames: AvatarFrames;
  bgsOff?: string[];
  prezdivka: string;
  anonym?: boolean;
}) {
  const bgList = AVBG.filter((b) => !bgsOff.includes(b) || b === bg);
  const router = useRouter();
  const [openM, setOpenM] = useState(false);
  const [gender, setGender] = useState<"kluk" | "holka">(
    AVATARS.find((a) => a.slug === model)?.g ?? "kluk"
  );
  const [selModel, setSelModel] = useState(model);
  const [selBg, setSelBg] = useState(bg);
  const [nick, setNick] = useState(prezdivka);
  const [anon, setAnon] = useState<boolean>(anonym);
  const [saving, setSaving] = useState(false);

  const tf = (slug: string) => {
    const f = frameOf(frames, slug);
    return `translate(${f.ox}%, ${f.oy}%) scale(${f.zoom / 100})`;
  };

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const clean = nick.trim() || "Šampion";
    const { error } = await supabase
      .from("deti")
      .update({ avatar_model: selModel, avatar_pozadi: selBg, prezdivka: clean, zebricek_anonym: anon })
      .eq("id", childId);
    setSaving(false);
    if (error) {
      alert("Uložení se nepovedlo: " + error.message);
      return;
    }
    setOpenM(false);
    router.refresh();
  }

  return (
    <>
      <button
        className="btn btn-out"
        style={{ display: "inline-flex", alignItems: "center", gap: ".4rem" }}
        onClick={() => setOpenM(true)}
      >
        <Pencil size={15} /> Upravit postavu
      </button>

      {openM && (
        <div className="cust-ov open" onClick={(e) => e.target === e.currentTarget && setOpenM(false)}>
          <div className="cust-box">
            <button className="mclose" onClick={() => setOpenM(false)}>
              ×
            </button>
            <h3>Uprav svou postavu</h3>

            <div className="cprev">
              <div className="avstage">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="avbg" src={bgSrc(selBg)} alt="" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="avmodel" src={avatarSrc(selModel)} alt="" style={{ transform: tf(selModel) }} />
              </div>
            </div>

            <div className="cl">Přezdívka</div>
            <input
              type="text"
              className="nameinput"
              value={nick}
              maxLength={18}
              placeholder="Tvoje přezdívka"
              onChange={(e) => setNick(e.target.value)}
            />

            <div className="cl">Vyber postavu</div>
            <div className="genderfilter">
              <button className={gender === "kluk" ? "active" : ""} onClick={() => setGender("kluk")}>
                Kluci
              </button>
              <button className={gender === "holka" ? "active" : ""} onClick={() => setGender("holka")}>
                Holky
              </button>
            </div>
            <div className="modelgrid">
              {AVATARS.filter((a) => a.g === gender).map((a) => (
                <button
                  key={a.slug}
                  className={"modelcell" + (a.slug === selModel ? " sel" : "")}
                  onClick={() => setSelModel(a.slug)}
                  title={a.name}
                >
                  <div className="avstage">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className="avmodel" src={avatarSrc(a.slug)} alt={a.name} loading="lazy" decoding="async" style={{ transform: tf(a.slug) }} />
                  </div>
                  <span>{a.name}</span>
                </button>
              ))}
            </div>

            <div className="cl">Pozadí</div>
            <div className="bggrid">
              {bgList.map((b) => (
                <button
                  key={b}
                  className={"bgcell" + (b === selBg ? " sel" : "")}
                  onClick={() => setSelBg(b)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bgSrc(b)} alt="" />
                </button>
              ))}
            </div>

            <div className="cl">Zobrazení v žebříčku</div>
            <div className="anon-switch">
              <button className={!anon ? "active" : ""} onClick={() => setAnon(false)}>Jménem</button>
              <button className={anon ? "active" : ""} onClick={() => setAnon(true)}>Anonymně</button>
            </div>
            <p style={{ color: "#6f88ad", fontSize: ".78rem", marginTop: ".4rem" }}>
              {anon
                ? "V žebříčku Sparing Cupu se ukáže jen „Anonym“ — avatar a body zůstávají."
                : "V žebříčku se ukáže jméno dítěte. Sparing Cup odměňuje toho, kdo nejvíc hraje a vytrvá — jméno je součást té motivace."}
            </p>

            <button className="btn-save-av" onClick={save} disabled={saving} style={{ marginTop: "1rem" }}>
              {saving ? "Ukládám…" : "Uložit postavu"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
