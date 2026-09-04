/** Paykassa SCI 0.6 client (server-only). */

const SCI_URL = "https://paykassa.app/sci/0.6/index.php";

export type PaykassaResponse<T> = { error: boolean; message: string; data: T };

export type SciOrderData = {
  invoice: string | number;
  wallet: string;
  tag: string | number;
  tag_name: string;
  is_tag: boolean;
  system: string;
  currency: string;
  url?: string;
  amount?: string;
};

export type SciConfirmData = {
  transaction: string;
  shop_id: string;
  order_id: string;
  amount: string;
  currency: string;
  system: string;
  address: string;
  tag?: string;
  hash: string;
  partial: string;
};

/** app currency code -> paykassa { system, currency } */
export const PAYKASSA_MAP: Record<string, { system: string; currency: string }> = {
  TRX: { system: "TRON_TRC20", currency: "TRX" },
  TON: { system: "TON", currency: "TON" },
  BNB: { system: "BINANCE_BEP20", currency: "BNB" },
  DOGE: { system: "DOGECOIN", currency: "DOGE" },
  LTC: { system: "LITECOIN", currency: "LTC" },
  SOL: { system: "SOLANA", currency: "SOL" },
  POL: { system: "POLYGON", currency: "POL" },
  USDT_BEP20: { system: "BINANCE_BEP20", currency: "USDT" },
  USDT_POLYGON: { system: "POLYGON", currency: "USDT" },
  USDT_SOL: { system: "SOLANA", currency: "USDT" },
  USDT_TON: { system: "TON", currency: "USDT" },
};

function credentials() {
  const merchantId = process.env["PAYKASSA_MERCHANT_ID"];
  const merchantPassword = process.env["PAYKASSA_MERCHANT_PASSWORD"];
  if (!merchantId || !merchantPassword) throw new Error("PAYKASSA_NOT_CONFIGURED");
  return { merchantId, merchantPassword };
}

async function call<T>(func: string, params: Record<string, string>): Promise<T> {
  const { merchantId, merchantPassword } = credentials();
  const body = new URLSearchParams({
    func,
    merchant_id: merchantId,
    merchant_password: merchantPassword,
    ...params,
  });

  const res = await fetch(SCI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error("PAYKASSA_UNAVAILABLE");

  const json = (await res.json()) as PaykassaResponse<T>;
  if (json.error) {
    console.error("paykassa error", func, json.message);
    throw new Error("PAYKASSA_ERROR");
  }
  return json.data;
}

/** Creates (or reuses) a deposit address for the given system/currency. */
export function createAddress(input: {
  system: string;
  currency: string;
  orderId: string;
  comment: string;
  amount?: number;
}) {
  const params: Record<string, string> = {
    system: input.system,
    currency: input.currency,
    order_id: input.orderId,
    comment: input.comment,
  };
  if (input.amount && input.amount > 0) params["amount"] = input.amount.toFixed(8);
  return call<SciOrderData>("sci_create_order", params);
}

/** Verifies an incoming payment notification. */
export function confirmOrder(privateHash: string) {
  return call<SciConfirmData>("sci_confirm_order", { private_hash: privateHash });
}
