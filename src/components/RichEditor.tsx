"use client";

// Jednoduchý WYSIWYG editor článků (bez těžké knihovny, contentEditable + execCommand).
// Umí: tučné/kurzíva, nadpisy, odrážky/číslování, zarovnání, odkaz, citace, VKLÁDÁNÍ OBRÁZKŮ
// (upload do Supabase Storage) a OBTÉKÁNÍ textu (obrázek vlevo/vpravo/na šířku). Výstup = HTML.
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Link2, Quote, ImagePlus, PanelLeft, PanelRight, Rows, Eraser,
} from "lucide-react";

export function RichEditor({ value, onChange, resetKey }: { value: string; onChange: (html: string) => void; resetKey?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const activeImg = useRef<HTMLImageElement | null>(null);
  const [uploading, setUploading] = useState(false);

  // Naplň editor při načtení / přepnutí článku (ne při každém psaní → nekočí kurzor).
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) ref.current.innerHTML = value || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  const emit = () => { if (ref.current) onChange(ref.current.innerHTML); };
  const exec = (cmd: string, val?: string) => { ref.current?.focus(); document.execCommand(cmd, false, val); emit(); };

  const addLink = () => {
    const url = prompt("Odkaz (URL):", "https://");
    if (url) exec("createLink", url);
  };

  const onPickImage = async (file: File) => {
    setUploading(true);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `articles/${user?.id ?? "x"}/${Date.now()}.${ext}`;
    const up = await sb.storage.from("photos").upload(path, file, { upsert: true });
    if (up.error) { setUploading(false); alert("Nahrání obrázku selhalo: " + up.error.message); return; }
    const url = sb.storage.from("photos").getPublicUrl(path).data.publicUrl;
    ref.current?.focus();
    document.execCommand("insertHTML", false, `<img src="${url}" alt="" />`);
    setUploading(false);
    emit();
  };

  // Obtékání / zarovnání vloženého obrázku (funguje na naposledy kliknutý obrázek).
  const floatImg = (mode: "left" | "right" | "none") => {
    const img = activeImg.current;
    if (!img) { alert("Klikni nejdřív na obrázek v textu, pak zvol obtékání."); return; }
    img.style.float = mode === "none" ? "" : mode;
    img.style.margin = mode === "left" ? "4px 16px 8px 0" : mode === "right" ? "4px 0 8px 16px" : "12px auto";
    img.style.display = mode === "none" ? "block" : "";
    img.style.maxWidth = mode === "none" ? "100%" : "min(48%, 320px)";
    emit();
  };

  const onClickEditor = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    activeImg.current = t.tagName === "IMG" ? (t as HTMLImageElement) : null;
    document.querySelectorAll(".re-body img.sel").forEach((i) => i.classList.remove("sel"));
    if (activeImg.current) activeImg.current.classList.add("sel");
  };

  const Btn = ({ act, title, children }: { act: () => void; title: string; children: React.ReactNode }) => (
    <button type="button" className="re-btn" title={title} onMouseDown={(e) => { e.preventDefault(); act(); }}>{children}</button>
  );

  return (
    <div className="re">
      <div className="re-bar">
        <Btn act={() => exec("bold")} title="Tučně"><Bold size={16} /></Btn>
        <Btn act={() => exec("italic")} title="Kurzíva"><Italic size={16} /></Btn>
        <span className="re-sep" />
        <Btn act={() => exec("formatBlock", "H2")} title="Nadpis"><Heading2 size={16} /></Btn>
        <Btn act={() => exec("formatBlock", "H3")} title="Podnadpis"><Heading3 size={16} /></Btn>
        <Btn act={() => exec("formatBlock", "BLOCKQUOTE")} title="Citace"><Quote size={16} /></Btn>
        <span className="re-sep" />
        <Btn act={() => exec("insertUnorderedList")} title="Odrážky"><List size={16} /></Btn>
        <Btn act={() => exec("insertOrderedList")} title="Číslování"><ListOrdered size={16} /></Btn>
        <span className="re-sep" />
        <Btn act={() => exec("justifyLeft")} title="Vlevo"><AlignLeft size={16} /></Btn>
        <Btn act={() => exec("justifyCenter")} title="Na střed"><AlignCenter size={16} /></Btn>
        <Btn act={() => exec("justifyRight")} title="Vpravo"><AlignRight size={16} /></Btn>
        <span className="re-sep" />
        <Btn act={addLink} title="Odkaz"><Link2 size={16} /></Btn>
        <Btn act={() => fileRef.current?.click()} title="Vložit obrázek"><ImagePlus size={16} /></Btn>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onPickImage(e.target.files[0])} />
        <span className="re-sep" />
        <span className="re-lbl">Obrázek:</span>
        <Btn act={() => floatImg("left")} title="Obtékání zleva"><PanelLeft size={16} /></Btn>
        <Btn act={() => floatImg("right")} title="Obtékání zprava"><PanelRight size={16} /></Btn>
        <Btn act={() => floatImg("none")} title="Na celou šířku"><Rows size={16} /></Btn>
        <span className="re-sep" />
        <Btn act={() => exec("removeFormat")} title="Zrušit formát"><Eraser size={16} /></Btn>
      </div>
      {uploading && <div className="re-uploading">Nahrávám obrázek…</div>}
      <div
        ref={ref}
        className="re-body clanek-html"
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        onClick={onClickEditor}
        data-ph="Piš článek… (nadpisy, odrážky, obrázky s obtékáním — vše nahoře v liště)"
      />
    </div>
  );
}
