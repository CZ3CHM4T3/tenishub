// Barion platební brána — serverový helper (klíče jen z env, nikdy na klientovi).
// env: BARION_POSKEY, BARION_PAYEE (e-mail Barion účtu), BARION_ENV ("test" | "prod").
const BASE = process.env.BARION_ENV === "prod" ? "https://api.barion.com" : "https://api.test.barion.com";
const POSKEY = process.env.BARION_POSKEY || "";
const PAYEE = process.env.BARION_PAYEE || "";

export type StartResult = { PaymentId?: string; GatewayUrl?: string; Errors?: { Title?: string; Description?: string }[] };
export type StateResult = { Status?: string; Errors?: unknown[] };

export const barionConfigured = () => !!POSKEY && !!PAYEE;

// Vytvoří jednorázovou platbu; vrátí GatewayUrl pro přesměrování.
export async function startPayment(opts: {
  amountCzk: number; item: string; paymentRequestId: string; redirectUrl: string; callbackUrl: string;
}): Promise<StartResult> {
  const res = await fetch(`${BASE}/v2/Payment/Start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      POSKey: POSKEY,
      PaymentType: "Immediate",
      PaymentRequestId: opts.paymentRequestId,
      FundingSources: ["All"],
      GuestCheckOut: true,
      Currency: "CZK",
      Locale: "cs-CZ",
      RedirectUrl: opts.redirectUrl,
      CallbackUrl: opts.callbackUrl,
      Transactions: [{
        POSTransactionId: opts.paymentRequestId,
        Payee: PAYEE,
        Total: opts.amountCzk,
        Items: [{
          Name: opts.item, Description: opts.item,
          Quantity: 1, Unit: "ks", UnitPrice: opts.amountCzk, ItemTotal: opts.amountCzk,
        }],
      }],
    }),
  });
  return res.json();
}

// Zjistí stav platby (voláme v callbacku podle PaymentId od Barionu).
export async function getPaymentState(paymentId: string): Promise<StateResult> {
  const res = await fetch(`${BASE}/v2/Payment/GetPaymentState?POSKey=${encodeURIComponent(POSKEY)}&PaymentId=${encodeURIComponent(paymentId)}`);
  return res.json();
}
