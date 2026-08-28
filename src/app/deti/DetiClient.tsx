"use client";

// Rodičovská stránka: moje děti v klubu trenéra + přidání dítěte. Vede na /deti/[id] (Kariéra).
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Baby, Plus, X, ArrowRight, Pencil, BadgeCheck, GraduationCap, ClipboardList, Gamepad2, Lock } from "lucide-react";
import { JoinCoach } from "@/components/JoinCoach";
import { AVATARS, avatarByKey } from "@/lib/avatars";
import ClubBoard from "@/components/ClubBoard";
import GameLockPreview from "@/app/klub/GameLockPreview";

type Dite = { id: string; jmeno: string; prezdivka: string; level: number; program: string; coach_id: string | null; avatar: string | null };
type KlubTab = "deti" | "trener" | "nastenka" | "hra";
const KLUB_TABS: { k: KlubTab; label: string; Icon: typeof Baby; lock: boolean }[] = [
  { k: "deti", label: "Děti", Icon: Baby, lock: false },
  { k: "trener", label: "Trenér", Icon: GraduationCap, lock: false },
  { k: "nastenka", label: "Nástěnka", Icon: ClipboardList, lock: true },
  { k: "hra", label: "Pokrok & hra", Icon: Gamepad2, lock: true },
];

export default function DetiClient() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<KlubTab>("deti");
  const [me, setMe] = useState<string>("");
  const [coachId, setCoachId] = useState<string | null>(null);
  const [coachName, setCoachName] = useState<string>("");
  const [isCoach, setIsCoach] = useState(false);
  const [myName, setMyName] = useState("");
  const [deti, setDeti] = useState<Dite[]>([]);
  const [form, setForm] = useState({ open: false, jmeno: "", datum: "", program: "hobby" });
  const [avatarFor, setAvatarFor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/prihlaseni?next=/deti"); return; }
    setMe(user.id);
    const [{ data: d }, { data: cr }, { data: prof }] = await Promise.all([
      supabase.from("deti").select("id,jmeno,prezdivka,level,program,coach_id,avatar").eq("rodic_id", user.id).order("vytvoreno", { ascending: true }),
      supabase.from("coach_roster").select("coach_id").eq("member_id", user.id).eq("status", "active").limit(1).maybeSingle(),
      supabase.from("profiles").select("is_coach,full_name").eq("id", user.id).maybeSingle(),
    ]);
    setIsCoach(!!(prof as { is_coach?: boolean } | null)?.is_coach);
    setMyName((prof as { full_name?: string } | null)?.full_name ?? "");
    setDeti((d as Dite[]) ?? []);
    const cid = (cr as { coach_id: string } | null)?.coach_id ?? null;
    setCoachId(cid);
    if (cid) {
      const { data: sp } = await supabase.from("specialists").select("name").eq("owner_id", cid).limit(1).maybeSingle();
      setCoachName((sp as { name: string } | null)?.name ?? "trenér");
    } else setCoachName("");
    setLoading(false);
  }, [supabase, router]);
  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!form.jmeno.trim()) return;
    setBusy(true);
    const { data: kid, error } = await supabase.from("deti").insert({
      rodic_id: me, coach_id: coachId, jmeno: form.jmeno.trim(),
      datum_narozeni: form.datum || null, program: form.program,
    }).select("id").single();
    if (error) { setBusy(false); alert("Nepodařilo se přidat: " + error.message); return; }
    // zrcadlo do Mojí cesty — rodič nezadává dítě dvakrát (best-effort, nevadí když selže)
    try {
      const { data: pl } = await supabase.from("cesta_players").insert({ owner_id: me, name: form.jmeno.trim() }).select("id").single();
      if (pl?.id && kid?.id) await supabase.from("deti").update({ player_id: pl.id }).eq("id", kid.id);
    } catch { /* dítě je založené, jen se nezrcadlilo do Mojí cesty */ }
    setBusy(false);
    setForm({ open: false, jmeno: "", datum: "", program: "hobby" });
    await load();
  };

  const chooseAvatar = async (kidId: string, key: string) => {
    setAvatarFor(null);
    setDeti((ds) => ds.map((x) => x.id === kidId ? { ...x, avatar: key } : x));
    await supabase.from("deti").update({ avatar: key }).eq("id", kidId);
  };

  if (loading) return <div className="acct-loading">Načítám…</div>;

  return (
    <div className="acct-page">
      <SiteHeader />
      <div className="wrap acct-wrap" style={{ maxWidth: 720 }}>
        <div className="mc-head">
          <h1 className="acct-h1"><Baby size={26} style={{ verticalAlign: "-4px" }} /> Můj klub</h1>
          <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
            {isCoach && <Link href="/klub" className="btn btn-out"><GraduationCap size={16} /> Trenérské rozhraní</Link>}
            {tab === "deti" && <button className="btn btn-green" onClick={() => setForm((f) => ({ ...f, open: true }))}><Plus size={16} /> Přidat dítě</button>}
          </div>
        </div>
        <p className="member-note" style={{ marginTop: "-0.4rem" }}>
          {coachId
            ? <>Vaše děti jsou u trenéra <b>{coachName}</b> — sbírají odznaky, level a postup ve stromu dovedností i Sparring Cupu.</>
            : <>Nejdřív <button type="button" className="lnk-btn" onClick={() => setTab("trener")}>zadejte kód trenéra</button> — pak se odemkne Nástěnka i Pokrok a děti u trenéra začnou sbírat odznaky a level.</>}
        </p>

        {/* PODZÁLOŽKY */}
        <div className="acct-tabs">
          {KLUB_TABS.map((t) => {
            const locked = t.lock && !coachId;
            return (
              <button key={t.k} type="button" className={`acct-tab${tab === t.k ? " on" : ""}${locked ? " dis" : ""}`}
                onClick={() => (locked ? setTab("trener") : setTab(t.k))}>
                <t.Icon size={17} /> {t.label} {locked && <Lock size={12} style={{ opacity: 0.6 }} />}
              </button>
            );
          })}
        </div>

        {/* DĚTI */}
        {tab === "deti" && (
          deti.length === 0 ? (
            <div className="acct-card mc-gate"><Baby size={30} /><h2>Zatím žádné dítě</h2><p>Přidejte první — pak ho napojíte na trenéra a uvidíte jeho pokrok.</p>
              <button className="btn btn-green" onClick={() => setForm((f) => ({ ...f, open: true }))}><Plus size={16} /> Přidat dítě</button>
            </div>
          ) : (
            <div className="klub-list">
              {deti.map((d) => {
                const av = avatarByKey(d.avatar);
                const AvIcon = av.Icon;
                return (
                <div className={`deti-row${coachId ? "" : " deti-row-off"}`} key={d.id}>
                  <button type="button" className="deti-av" style={{ background: av.color }} onClick={() => setAvatarFor(d.id)} aria-label="Změnit avatara">
                    <AvIcon size={22} /><span className="deti-av-edit"><Pencil size={11} /></span>
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b>{d.jmeno}</b>
                    <span>
                      {coachId
                        ? <span className="deti-chip on"><BadgeCheck size={12} /> U trenéra {coachName}</span>
                        : <span className="deti-chip">Zatím bez trenéra</span>}
                      {" "}· {d.program === "pro" ? "závodní" : "hobby"}{coachId ? ` · level ${d.level}` : ""}
                    </span>
                  </div>
                  <Link href={`/deti/${d.id}`} className="dite-cta" style={{ textDecoration: "none" }}>
                    {coachId ? "Kariéra" : "Otevřít"} <ArrowRight size={15} />
                  </Link>
                </div>
                );
              })}
            </div>
          )
        )}

        {/* TRENÉR — napojení kódem (první krok) */}
        {tab === "trener" && (<>
          <JoinCoach />
          {coachId && <p className="member-note">Jste napojení na <b>{coachName}</b>. Nástěnka i Pokrok jsou odemčené.</p>}
        </>)}

        {/* NÁSTĚNKA */}
        {tab === "nastenka" && coachId && <ClubBoard coachId={coachId} authorName={myName} />}

        {/* POKROK & HRA */}
        {tab === "hra" && coachId && (<>
          <GameLockPreview variant="strom" audience="rodic" />
          <GameLockPreview variant="cup" audience="rodic" />
        </>)}
      </div>

      {form.open && (
        <div className="mc-modal" onClick={() => setForm((f) => ({ ...f, open: false }))}>
          <div className="mc-modal-in" onClick={(e) => e.stopPropagation()}>
            <button className="mc-x" onClick={() => setForm((f) => ({ ...f, open: false }))}><X size={18} /></button>
            <h3>Přidat dítě</h3>
            <label>Jméno dítěte<input value={form.jmeno} onChange={(e) => setForm({ ...form, jmeno: e.target.value })} placeholder="Např. Ella" /></label>
            <div className="mc-row2">
              <label>Datum narození<input type="date" value={form.datum} onChange={(e) => setForm({ ...form, datum: e.target.value })} /></label>
              <label>Program<select value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })}><option value="hobby">Hobby</option><option value="pro">Závodní</option></select></label>
            </div>
            <button className="btn btn-green" disabled={busy || !form.jmeno.trim()} onClick={submit}>Přidat</button>
          </div>
        </div>
      )}

      {avatarFor && (
        <div className="mc-modal" onClick={() => setAvatarFor(null)}>
          <div className="mc-modal-in" onClick={(e) => e.stopPropagation()}>
            <button className="mc-x" onClick={() => setAvatarFor(null)}><X size={18} /></button>
            <h3>Vyber avatara</h3>
            <div className="avatar-grid">
              {AVATARS.map((a) => {
                const AIcon = a.Icon;
                const cur = deti.find((x) => x.id === avatarFor)?.avatar;
                return (
                  <button key={a.key} type="button" className={`avatar-opt${cur === a.key ? " on" : ""}`} style={{ background: a.color }} onClick={() => chooseAvatar(avatarFor, a.key)}>
                    <AIcon size={26} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
