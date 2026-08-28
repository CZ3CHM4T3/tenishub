"use client";
import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button className="btn btn-green fak-print" onClick={() => window.print()} type="button">
      <Printer size={16} /> Stáhnout / vytisknout (PDF)
    </button>
  );
}
