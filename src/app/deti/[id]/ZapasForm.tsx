"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminChildEntry({
  childId,
  cup,
  kind,
}: {
  childId: string;
  cup: "pro" | "hobby";
  kind: "match" | "dochazka";
}) {
  const router = useRouter();
  const supabase = createClient();
  const [openF, setOpenF] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // match
  const [souper, setSouper] = useState("");
  const [gp, setGp] = useState("");
  const [gpr, setGpr] = useState("");
  // dochazka
  const [nazev, setNazev] = useState("Lekce tenis");
  const [stav, setStav] = useState("absolvovano");
  // společné
  const [datum, setDatum] = useState("");

  async function save() {
    setBusy(true);
    setErr(null);
    let error;
    if (kind === "match") {
      if (!souper.trim()) {
        setErr("Zadej soupeře.");
        setBusy(false);
        return;
      }
      ({ error } = await supabase.from("zapasy").insert({
        dite_id: childId,
        souper: souper.trim(),
        gemy_pro: parseInt(gp || "0", 10),
        gemy_proti: parseInt(gpr || "0", 10),
        cup,
        ...(datum ? { datum } : {}),
      }));
    } else {
      ({ error } = await supabase.from("dochazka").insert({
        dite_id: childId,
        nazev: nazev.trim() || "Lekce",
        stav,
        ...(datum ? { datum } : {}),
      }));
    }
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setSouper("");
    setGp("");
    setGpr("");
    setOpenF(false);
    router.refresh();
  }

  if (!openF) {
    return (
      <button className="btn btn-out" style={{ marginTop: ".8rem" }} onClick={() => setOpenF(true)}>
        {kind === "match" ? "+ Zapsat zápas" : "+ Zapsat docházku"}
      </button>
    );
  }

  return (
    <div className="entry-form">
      <div className="entry-row">
        <label>
          Datum
          <input className="field2" type="date" value={datum} onChange={(e) => setDatum(e.target.value)} />
        </label>
        {kind === "match" ? (
          <>
            <label style={{ flex: 2 }}>
              Soupeř
              <input className="field2" type="text" value={souper} placeholder="Jméno soupeře" onChange={(e) => setSouper(e.target.value)} />
            </label>
            <label style={{ maxWidth: 90 }}>
              Gemy pro
              <input className="field2" type="number" min={0} value={gp} onChange={(e) => setGp(e.target.value)} />
            </label>
            <label style={{ maxWidth: 90 }}>
              Gemy proti
              <input className="field2" type="number" min={0} value={gpr} onChange={(e) => setGpr(e.target.value)} />
            </label>
          </>
        ) : (
          <>
            <label style={{ flex: 2 }}>
              Název
              <input className="field2" type="text" value={nazev} onChange={(e) => setNazev(e.target.value)} />
            </label>
            <label>
              Stav
              <select className="field2" value={stav} onChange={(e) => setStav(e.target.value)}>
                <option value="absolvovano">Absolvováno</option>
                <option value="omluveno">Omluveno</option>
                <option value="zmeskano">Zmeškáno</option>
                <option value="nahrada">Náhrada</option>
              </select>
            </label>
          </>
        )}
      </div>
      {err && <p style={{ color: "#ff8a8a", fontSize: ".82rem", margin: ".2rem 0" }}>{err}</p>}
      <div className="row2" style={{ marginTop: ".6rem" }}>
        <button className="btn btn-green" onClick={save} disabled={busy}>
          {busy ? "Ukládám…" : "Uložit"}
        </button>
        <button className="btn btn-out" onClick={() => setOpenF(false)} disabled={busy}>
          Zrušit
        </button>
      </div>
    </div>
  );
}
