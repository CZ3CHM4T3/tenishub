// Dodavatel na faktuře (TenisHub). Hodnoty z env — ať domácí adresa není v repu.
// Nastav v env: INV_NAME, INV_ICO, INV_ADDRESS, INV_PREFIX, (INV_DPH=1 + INV_VAT pro plátce).
export const SUPPLIER = {
  name: process.env.INV_NAME || "TenisHub",
  ico: process.env.INV_ICO || "",
  address: process.env.INV_ADDRESS || "",
  prefix: process.env.INV_PREFIX || "TH",
  isVatPayer: process.env.INV_DPH === "1",
  vatRate: process.env.INV_DPH === "1" ? Number(process.env.INV_VAT || 21) : 0,
};
