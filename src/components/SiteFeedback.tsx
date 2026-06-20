"use client";

// Plovoucí tlačítko „Zpětná vazba" (na všech stránkách) + tichý záznam návštěvy
// pro konverzní trychtýř v adminu. Vše přes anon Supabase klienta (RLS: insert smí kdokoli).
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessageSquarePlus, X, Star, Send, CheckCircle2 } from "lucide-react";

const CATS: [string, string][] = [
  ["pochvala", "Pochvala"], ["chyba", "Něco nefunguje"], ["napad", "Nápad"],
  ["chybi", "Něco mi chybí"], ["jine", "Jiné"],
];

function sessionId(): string {
  try {
    let id = localStorage.getItem("th_sid");
    if (!id) { id = Math.random().toString(36).slice(2) + Date.now().toString(36); localStorage.setItem("th_sid", id); }
    return id;
  } catch { return "anon"; }
}

export function SiteFeedback() {
  const supabase = useMemo(() => createClient(), []);
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState("napad");
  const [rating, setRating] = useState(0);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // tichý záznam návštěvy — jednou za session
  useEffect(() => {
    try {
      if (sessionStorage.getItem("th_v")) return;
      sessionStorage.setItem("th_v", "1");
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from("events").insert({
          kind: "visit", path: location.pathname, session_id: sessionId(), profile_id: user?.id ?? null,
        });
      })();
    } catch { /* nevadí */ }
  }, [supabase]);

  const submit = async () => {
    if (!msg.trim()) return;
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    let name: string | null = null;
    if (user) {
      const { data } = await supabase.from("profiles").select("full_name,email").eq("id", user.id).maybeSingle();
      name = data?.full_name || data?.email || null;
    }
    const { error } = await supabase.from("feedback").insert({
      author_id: user?.id ?? null, author_name: name, rating: rating || null,
      category: cat, message: msg.trim(), page: location.pathname,
    });
    setBusy(false);
    if (error) { alert("Nepodařilo se odeslat: " + error.message); return; }
    setDone(true);
    setMsg(""); setRating(0); setCat("napad");
    setTimeout(() => { setOpen(false); setDone(false); }, 1600);
  };

  return (
    <>
      <button className="fb-fab" onClick={() => setOpen(true)} aria-label="Zpětná vazba">
        <MessageSquarePlus size={18} /> <span>Zpětná vazba</span>
      </button>

      {open && (
        <div className="mc-modal" onClick={() => setOpen(false)}>
          <div className="mc-modal-in" onClick={(e) => e.stopPropagation()}>
            <button className="mc-x" onClick={() => setOpen(false)}><X size={18} /></button>
            {done ? (
              <div className="fb-done"><CheckCircle2 size={40} /><h3>Díky moc!</h3><p className="member-note">Tvoje zpětná vazba nám pomáhá web zlepšovat.</p></div>
            ) : (<>
              <h3><MessageSquarePlus size={20} style={{ verticalAlign: "-4px" }} /> Pomoz nám web zlepšit</h3>
              <p className="member-note" style={{ marginTop: "-0.4rem" }}>Cokoli tě napadne — co se líbí, co chybí, co nefunguje. Stačí pár slov.</p>

              <div className="fb-cats">
                {CATS.map(([k, l]) => (
                  <button key={k} type="button" className={`fb-cat${cat === k ? " on" : ""}`} onClick={() => setCat(k)}>{l}</button>
                ))}
              </div>

              <div className="fb-stars" aria-label="Spokojenost">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" className={`fb-star${rating >= n ? " on" : ""}`} onClick={() => setRating(n === rating ? 0 : n)}>
                    <Star size={22} fill={rating >= n ? "currentColor" : "none"} />
                  </button>
                ))}
                <small>{rating ? `${rating}/5` : "spokojenost (nepovinné)"}</small>
              </div>

              <textarea rows={4} value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Sem napiš, co máš na srdci…" />
              <button className="btn btn-green" disabled={busy || !msg.trim()} onClick={submit} style={{ width: "100%" }}>
                <Send size={15} /> {busy ? "Odesílám…" : "Odeslat"}
              </button>
            </>)}
          </div>
        </div>
      )}
    </>
  );
}
