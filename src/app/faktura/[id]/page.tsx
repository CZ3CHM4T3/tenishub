import { createClient } from "@/lib/supabase/server";
import { SUPPLIER } from "@/lib/invoiceSupplier";
import { PrintButton } from "./PrintButton";

export const dynamic = "force-dynamic";

type Invoice = {
  number: string; customer_name: string | null; customer_email: string | null;
  item: string; amount_czk: number; vat_rate: number; issued_at: string;
};

const fmt = (iso: string) => new Date(iso).toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric", year: "numeric" });

export default async function FakturaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data } = await sb.from("invoices").select("number,customer_name,customer_email,item,amount_czk,vat_rate,issued_at").eq("id", id).maybeSingle();
  const inv = data as Invoice | null;
  if (!inv) return <div style={{ padding: "3rem", textAlign: "center", color: "#555" }}>Faktura nenalezena nebo k ní nemáte přístup.</div>;

  return (
    <div className="fak-page">
      <div className="fak">
        <div className="fak-top">
          <div><span className="fak-eyebrow">Faktura č.</span><h1 className="fak-num">{inv.number}</h1></div>
          <div className="fak-brand">TenisHub</div>
        </div>

        <div className="fak-parties">
          <div className="fak-party">
            <span className="fak-lab">Dodavatel</span>
            <b>{SUPPLIER.name || "—"}</b>
            {SUPPLIER.address && <span>{SUPPLIER.address}</span>}
            {SUPPLIER.ico && <span>IČO: {SUPPLIER.ico}</span>}
            {!SUPPLIER.isVatPayer && <span>Neplátce DPH.</span>}
          </div>
          <div className="fak-party">
            <span className="fak-lab">Odběratel</span>
            <b>{inv.customer_name || "—"}</b>
            {inv.customer_email && <span>{inv.customer_email}</span>}
          </div>
        </div>

        <div className="fak-meta">
          <span>Datum vystavení: <b>{fmt(inv.issued_at)}</b></span>
          <span>Způsob úhrady: <b>Kartou (Barion)</b> · zaplaceno</span>
        </div>

        <table className="fak-tab">
          <thead><tr><th>Položka</th><th style={{ textAlign: "right" }}>Cena</th></tr></thead>
          <tbody>
            <tr><td>{inv.item}</td><td style={{ textAlign: "right" }}>{inv.amount_czk} Kč</td></tr>
          </tbody>
          <tfoot><tr><td>Celkem k úhradě</td><td style={{ textAlign: "right" }}><b>{inv.amount_czk} Kč</b></td></tr></tfoot>
        </table>

        <p className="fak-note">{SUPPLIER.isVatPayer ? `Ceny včetně DPH ${inv.vat_rate} %.` : "Neplátce DPH — částka je konečná."}</p>
      </div>
      <PrintButton />
    </div>
  );
}
