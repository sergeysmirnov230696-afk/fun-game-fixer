import { useSyncExternalStore } from "react";
import dragon1 from "@/assets/dragon-1.png";
import dragon2 from "@/assets/dragon-2.png";
import dragon3 from "@/assets/dragon-3.png";
import dragon4 from "@/assets/dragon-4.png";
import dragon5 from "@/assets/dragon-5.png";
import dragon6 from "@/assets/dragon-6.png";
import dragon7 from "@/assets/dragon-7.png";
import dragon8 from "@/assets/dragon-8.png";
import dragon9 from "@/assets/dragon-9.png";
import dragon10 from "@/assets/dragon-10.png";
import { getTelegramUser, getStartParam } from "./telegram";

export type Dragon = {
  id: number;
  name: string;
  image: string;
  price: number;
  /** percent of price earned per day */
  ratePerDay: number;
  /** lifetime of the dragon in days */
  lifespanDays: number;
};

export const DRAGONS: Dragon[] = [
  { id: 1, name: "Ледяной птенец", image: dragon1, price: 1, ratePerDay: 10, lifespanDays: 30 },
  { id: 2, name: "Угольный дракон", image: dragon2, price: 3, ratePerDay: 12, lifespanDays: 30 },
  { id: 3, name: "Багровый штормовик", image: dragon3, price: 5, ratePerDay: 14, lifespanDays: 30 },
  { id: 4, name: "Золотой хранитель", image: dragon4, price: 10, ratePerDay: 16, lifespanDays: 30 },
  { id: 5, name: "Изумрудный ловчий", image: dragon5, price: 25, ratePerDay: 18, lifespanDays: 30 },
  { id: 6, name: "Владыка Бездны", image: dragon6, price: 50, ratePerDay: 20, lifespanDays: 30 },
  { id: 7, name: "Багровый штормовик", image: dragon7, price: 100, ratePerDay: 22, lifespanDays: 30 },
  { id: 8, name: "Золотой хранитель", image: dragon8, price: 200, ratePerDay: 25, lifespanDays: 30 },
  { id: 9, name: "Изумрудный ловчий", image: dragon9, price: 500, ratePerDay: 28, lifespanDays: 30 },
  { id: 10, name: "Владыка Бездны", image: dragon10, price: 1000, ratePerDay: 30, lifespanDays: 30 },
];

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
export const MIN_AMOUNT = 1;

export type OwnedDragon = { dragonId: number; boughtAt: number };
export type Tx = {
  id: string;
  date: number;
  method: string;
  sum: number;
  status: "Ожидание" | "Выполнено" | "Отклонено";
  kind: "deposit" | "withdraw";
};
export type Referral = { date: number; user: string; deposit: number; income: number };

export type GameState = {
  version: 1;
  playerName: string;
  balance: number;
  collected: number;
  dragons: OwnedDragon[];
  lastAccrual: number;
  txs: Tx[];
  referrals: Referral[];
  referralBalance: number;
  addresses: Partial<Record<CurrencyCode, string>>;
  refCode: string;
};

const KEY = "dragonvault_state_v1";

function makeInitial(): GameState {
  const tg = getTelegramUser();
  const name = tg
    ? [tg.first_name, tg.last_name].filter(Boolean).join(" ") || tg.username || "Игрок"
    : "Гость";
  return {
    version: 1,
    playerName: name,
    balance: 1,
    collected: 0,
    dragons: [],
    lastAccrual: Date.now(),
    txs: [],
    referrals: [],
    referralBalance: 0,
    addresses: {},
    refCode: tg ? String(tg.id) : Math.random().toString(36).slice(2, 10),
  };
}

let state: GameState = makeInitial();
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* noop */
  }
}

export function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as GameState;
      if (parsed && parsed.version === 1) state = { ...makeInitial(), ...parsed };
    }
  } catch {
    /* noop */
  }
  const tg = getTelegramUser();
  if (tg) {
    state.playerName =
      [tg.first_name, tg.last_name].filter(Boolean).join(" ") || tg.username || state.playerName;
    state.refCode = String(tg.id);
  }
  const start = getStartParam();
  if (start && start !== state.refCode) {
    // приглашённый пользователь: бонус приглашающего эмулируется на его стороне
  }
  persist();
  emit();
}

function set(updater: (s: GameState) => GameState) {
  state = updater(state);
  persist();
  emit();
}

export function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function getState() {
  return state;
}
const serverState = makeInitial();
export function useGame(): GameState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => serverState,
  );
}

/* ---------- derived ---------- */

export function dragonById(id: number) {
  return DRAGONS.find((d) => d.id === id)!;
}

export function isExpired(o: OwnedDragon, now = Date.now()) {
  const d = dragonById(o.dragonId);
  return now - o.boughtAt >= d.lifespanDays * 86400000;
}

/** доход в секунду со всех живых драконов */
export function incomePerSecond(s: GameState, now = Date.now()) {
  return s.dragons
    .filter((o) => !isExpired(o, now))
    .reduce((sum, o) => {
      const d = dragonById(o.dragonId);
      return sum + (d.price * d.ratePerDay) / 100 / 86400;
    }, 0);
}

/** накопленное, но не собранное */
export function pendingIncome(s: GameState, now = Date.now()) {
  let total = 0;
  for (const o of s.dragons) {
    const d = dragonById(o.dragonId);
    const end = o.boughtAt + d.lifespanDays * 86400000;
    const from = Math.max(o.boughtAt, s.lastAccrual);
    const to = Math.min(now, end);
    if (to > from) total += ((to - from) / 86400000) * ((d.price * d.ratePerDay) / 100);
  }
  return total;
}

/* ---------- actions ---------- */

export function buyDragon(dragonId: number): { ok: boolean; error?: string } {
  const d = dragonById(dragonId);
  if (state.balance < d.price) return { ok: false, error: "Недостаточно средств" };
  set((s) => ({
    ...s,
    balance: +(s.balance - d.price).toFixed(6),
    dragons: [...s.dragons, { dragonId, boughtAt: Date.now() }],
  }));
  return { ok: true };
}

export function collect(): number {
  const now = Date.now();
  const amount = pendingIncome(state, now);
  if (amount <= 0) return 0;
  set((s) => ({
    ...s,
    balance: +(s.balance + amount).toFixed(6),
    collected: +(s.collected + amount).toFixed(6),
    lastAccrual: now,
  }));
  return amount;
}

export function collectReferral(): number {
  const amount = state.referralBalance;
  if (amount <= 0) return 0;
  set((s) => ({
    ...s,
    balance: +(s.balance + amount).toFixed(6),
    referralBalance: 0,
  }));
  return amount;
}

export function requestDeposit(currency: string, usd: number) {
  const tx: Tx = {
    id: Math.random().toString(36).slice(2),
    date: Date.now(),
    method: currency,
    sum: usd,
    status: "Ожидание",
    kind: "deposit",
  };
  set((s) => ({ ...s, txs: [tx, ...s.txs] }));
  return tx;
}

export function requestWithdraw(
  currency: CurrencyCode,
  usd: number,
): { ok: boolean; error?: string } {
  if (usd < MIN_AMOUNT) return { ok: false, error: `Минимум ${MIN_AMOUNT.toFixed(2)}` };
  if (usd > state.balance) return { ok: false, error: "Недостаточно средств" };
  if (!state.addresses[currency]) return { ok: false, error: "Укажите адрес для выплаты" };
  const tx: Tx = {
    id: Math.random().toString(36).slice(2),
    date: Date.now(),
    method: currency,
    sum: usd,
    status: "Ожидание",
    kind: "withdraw",
  };
  set((s) => ({ ...s, balance: +(s.balance - usd).toFixed(6), txs: [tx, ...s.txs] }));
  return { ok: true };
}

export function saveAddress(currency: CurrencyCode, address: string) {
  set((s) => ({ ...s, addresses: { ...s.addresses, [currency]: address } }));
}

export function referralLink(s: GameState) {
  return `https://t.me/DragonHash_bot?startapp=${s.refCode}`;
}

export function fmt(n: number, digits = 2) {
  return n.toLocaleString("ru-RU", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtDate(ts: number) {
  const d = new Date(ts);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
