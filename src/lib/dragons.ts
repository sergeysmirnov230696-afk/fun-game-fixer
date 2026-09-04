export type DragonSpec = {
  id: number;
  level: number;
  key: string;
  price: number;
  /** percent of price earned per day */
  ratePerDay: number;
  lifespanDays: number;
};

export const DRAGONS: DragonSpec[] = [
  { id: 1, level: 1, key: "frostling", price: 1, ratePerDay: 10, lifespanDays: 30 },
  { id: 2, level: 2, key: "ember", price: 3, ratePerDay: 12, lifespanDays: 30 },
  { id: 3, level: 3, key: "crimson", price: 5, ratePerDay: 14, lifespanDays: 30 },
  { id: 4, level: 4, key: "gilded", price: 10, ratePerDay: 16, lifespanDays: 30 },
  { id: 5, level: 5, key: "emerald", price: 25, ratePerDay: 18, lifespanDays: 30 },
  { id: 6, level: 6, key: "void", price: 50, ratePerDay: 20, lifespanDays: 30 },
  { id: 7, level: 7, key: "sapphire", price: 100, ratePerDay: 22, lifespanDays: 30 },
  { id: 8, level: 8, key: "solar", price: 250, ratePerDay: 24, lifespanDays: 30 },
  { id: 9, level: 9, key: "storm", price: 500, ratePerDay: 26, lifespanDays: 30 },
  { id: 10, level: 10, key: "cosmic", price: 1000, ratePerDay: 30, lifespanDays: 30 },
];

export function dragonById(id: number) {
  return DRAGONS.find((d) => d.id === id);
}

export const CURRENCIES = [
  { code: "TRX", label: "TRX", rate: 3.0635, color: "#e8322b" },
  { code: "TON", label: "TON", rate: 0.32, color: "#0098ea" },
  { code: "BNB", label: "BNB (BEP20)", rate: 0.0016, color: "#f0b90b" },
  { code: "DOGE", label: "DOGE", rate: 4.35, color: "#c3a634" },
  { code: "LTC", label: "LTC", rate: 0.0092, color: "#3f5cd6" },
  { code: "SOL", label: "SOL", rate: 0.0063, color: "#12100f" },
  { code: "POL", label: "POL", rate: 2.44, color: "#8247e5" },
  { code: "USDT_BEP20", label: "USDT (BEP20)", rate: 1, color: "#26a17b" },
  { code: "USDT_POLYGON", label: "USDT (Polygon)", rate: 1, color: "#26a17b" },
  { code: "USDT_SOL", label: "USDT (Solana)", rate: 1, color: "#26a17b" },
  { code: "USDT_TON", label: "USDT (TON)", rate: 1, color: "#26a17b" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];
export const CURRENCY_CODES = CURRENCIES.map((c) => c.code) as unknown as [string, ...string[]];
export const MIN_AMOUNT = 1;
export const REFERRAL_PERCENT = 15;
