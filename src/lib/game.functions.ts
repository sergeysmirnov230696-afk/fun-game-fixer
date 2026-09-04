import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CURRENCY_CODES, DRAGONS, MIN_AMOUNT, dragonById } from "./dragons";

export type PlayerSnapshot = {
  playerKey: string;
  name: string;
  balance: number;
  collected: number;
  referralBalance: number;
  pending: number;
  perSecond: number;
  language: "en" | "ru";
  addresses: Record<string, string>;
  dragons: { id: string; dragonId: number; boughtAt: string; expired: boolean }[];
  transactions: {
    id: string;
    kind: "deposit" | "withdraw";
    method: string;
    amount: number;
    status: string;
    createdAt: string;
  }[];
  referrals: { invitedName: string; deposit: number; income: number; createdAt: string }[];
};

async function admin() {
  const mod = await import("@/integrations/supabase/client.server");
  return mod.supabaseAdmin;
}

type PlayerRow = {
  id: string;
  player_key: string;
  name: string;
  balance: number | string;
  collected: number | string;
  referral_balance: number | string;
  last_accrual: string;
  addresses: unknown;
  language: string;
};

type DragonRow = { id: string; dragon_id: number; bought_at: string };

function num(v: number | string | null) {
  return Number(v ?? 0);
}

function accrual(rows: DragonRow[], lastAccrual: string, now: number) {
  let pending = 0;
  let perSecond = 0;
  const last = new Date(lastAccrual).getTime();
  for (const row of rows) {
    const spec = dragonById(row.dragon_id);
    if (!spec) continue;
    const bought = new Date(row.bought_at).getTime();
    const end = bought + spec.lifespanDays * 86400000;
    const perDay = (spec.price * spec.ratePerDay) / 100;
    if (now < end) perSecond += perDay / 86400;
    const from = Math.max(bought, last);
    const to = Math.min(now, end);
    if (to > from) pending += ((to - from) / 86400000) * perDay;
  }
  return { pending, perSecond };
}

async function snapshot(playerKey: string): Promise<PlayerSnapshot> {
  const db = await admin();
  const { data: player, error } = await db
    .from("players")
    .select("*")
    .eq("player_key", playerKey)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!player) throw new Error("Player not found");
  const p = player as unknown as PlayerRow;

  const [{ data: dragons }, { data: txs }, { data: refs }] = await Promise.all([
    db.from("player_dragons").select("*").eq("player_id", p.id).order("bought_at"),
    db
      .from("transactions")
      .select("*")
      .eq("player_id", p.id)
      .order("created_at", { ascending: false })
      .limit(50),
    db
      .from("referrals")
      .select("*")
      .eq("inviter_id", p.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const dragonRows = (dragons ?? []) as unknown as DragonRow[];
  const now = Date.now();
  const { pending, perSecond } = accrual(dragonRows, p.last_accrual, now);

  return {
    playerKey: p.player_key,
    name: p.name,
    balance: num(p.balance),
    collected: num(p.collected),
    referralBalance: num(p.referral_balance),
    pending,
    perSecond,
    language: p.language === "ru" ? "ru" : "en",
    addresses: (p.addresses as Record<string, string>) ?? {},
    dragons: dragonRows.map((d) => {
      const spec = dragonById(d.dragon_id);
      const end = new Date(d.bought_at).getTime() + (spec?.lifespanDays ?? 30) * 86400000;
      return { id: d.id, dragonId: d.dragon_id, boughtAt: d.bought_at, expired: now >= end };
    }),
    transactions: (txs ?? []).map((t) => ({
      id: t.id as string,
      kind: t.kind as "deposit" | "withdraw",
      method: t.method as string,
      amount: num(t.amount as number),
      status: t.status as string,
      createdAt: t.created_at as string,
    })),
    referrals: (refs ?? []).map((r) => ({
      invitedName: r.invited_name as string,
      deposit: num(r.deposit as number),
      income: num(r.income as number),
      createdAt: r.created_at as string,
    })),
  };
}

const keySchema = z.object({ playerKey: z.string().min(3).max(64) });

export const loadPlayer = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        playerKey: z.string().min(3).max(64),
        name: z.string().min(1).max(64).optional(),
        referredBy: z.string().max(64).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: existing } = await db
      .from("players")
      .select("id")
      .eq("player_key", data.playerKey)
      .maybeSingle();

    if (!existing) {
      const referredBy =
        data.referredBy && data.referredBy !== data.playerKey ? data.referredBy : null;
      const { error } = await db.from("players").insert({
        player_key: data.playerKey,
        name: data.name ?? "Player",
        referred_by: referredBy,
      });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);

      if (referredBy) {
        const { data: inviter } = await db
          .from("players")
          .select("id, referral_balance")
          .eq("player_key", referredBy)
          .maybeSingle();
        if (inviter) {
          await db.from("referrals").insert({
            inviter_id: inviter.id as string,
            invited_name: data.name ?? "Player",
          });
          await db
            .from("players")
            .update({ referral_balance: num(inviter.referral_balance as number) + 0.02 })
            .eq("id", inviter.id as string);
        }
      }
    } else if (data.name) {
      await db.from("players").update({ name: data.name }).eq("id", existing.id as string);
    }

    return snapshot(data.playerKey);
  });

export const setLanguage = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    keySchema.extend({ language: z.enum(["en", "ru"]) }).parse(data),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    await db.from("players").update({ language: data.language }).eq("player_key", data.playerKey);
    return snapshot(data.playerKey);
  });

export const buyDragon = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    keySchema
      .extend({ dragonId: z.number().int().refine((id) => DRAGONS.some((d) => d.id === id)) })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const spec = dragonById(data.dragonId)!;
    const { data: player } = await db
      .from("players")
      .select("id, balance")
      .eq("player_key", data.playerKey)
      .maybeSingle();
    if (!player) throw new Error("Player not found");
    const balance = num(player.balance as number);
    if (balance < spec.price) throw new Error("INSUFFICIENT_FUNDS");

    await db
      .from("players")
      .update({ balance: +(balance - spec.price).toFixed(6) })
      .eq("id", player.id as string);
    await db
      .from("player_dragons")
      .insert({ player_id: player.id as string, dragon_id: spec.id });

    return snapshot(data.playerKey);
  });

export const collectIncome = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => keySchema.parse(data))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: player } = await db
      .from("players")
      .select("id, balance, collected, last_accrual")
      .eq("player_key", data.playerKey)
      .maybeSingle();
    if (!player) throw new Error("Player not found");

    const { data: dragons } = await db
      .from("player_dragons")
      .select("*")
      .eq("player_id", player.id as string);
    const now = Date.now();
    const { pending } = accrual(
      (dragons ?? []) as unknown as DragonRow[],
      player.last_accrual as string,
      now,
    );
    if (pending <= 0) throw new Error("NOTHING_TO_COLLECT");

    await db
      .from("players")
      .update({
        balance: +(num(player.balance as number) + pending).toFixed(6),
        collected: +(num(player.collected as number) + pending).toFixed(6),
        last_accrual: new Date(now).toISOString(),
      })
      .eq("id", player.id as string);

    return snapshot(data.playerKey);
  });

export const collectReferral = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => keySchema.parse(data))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: player } = await db
      .from("players")
      .select("id, balance, referral_balance")
      .eq("player_key", data.playerKey)
      .maybeSingle();
    if (!player) throw new Error("Player not found");
    const bonus = num(player.referral_balance as number);
    if (bonus <= 0) throw new Error("NOTHING_TO_COLLECT");

    await db
      .from("players")
      .update({
        balance: +(num(player.balance as number) + bonus).toFixed(6),
        referral_balance: 0,
      })
      .eq("id", player.id as string);

    return snapshot(data.playerKey);
  });

export const createDeposit = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    keySchema
      .extend({ method: z.enum(CURRENCY_CODES), amount: z.number().min(MIN_AMOUNT).max(100000) })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: player } = await db
      .from("players")
      .select("id")
      .eq("player_key", data.playerKey)
      .maybeSingle();
    if (!player) throw new Error("Player not found");
    await db.from("transactions").insert({
      player_id: player.id as string,
      kind: "deposit",
      method: data.method,
      amount: data.amount,
    });
    return snapshot(data.playerKey);
  });

export const createWithdraw = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    keySchema
      .extend({ method: z.enum(CURRENCY_CODES), amount: z.number().min(MIN_AMOUNT).max(100000) })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: player } = await db
      .from("players")
      .select("id, balance, addresses")
      .eq("player_key", data.playerKey)
      .maybeSingle();
    if (!player) throw new Error("Player not found");

    const addresses = (player.addresses as Record<string, string>) ?? {};
    if (!addresses[data.method]) throw new Error("NO_ADDRESS");
    const balance = num(player.balance as number);
    if (data.amount > balance) throw new Error("INSUFFICIENT_FUNDS");

    await db
      .from("players")
      .update({ balance: +(balance - data.amount).toFixed(6) })
      .eq("id", player.id as string);
    await db.from("transactions").insert({
      player_id: player.id as string,
      kind: "withdraw",
      method: data.method,
      amount: data.amount,
    });
    return snapshot(data.playerKey);
  });

export const savePayoutAddress = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    keySchema
      .extend({ method: z.enum(CURRENCY_CODES), address: z.string().min(6).max(120) })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: player } = await db
      .from("players")
      .select("id, addresses")
      .eq("player_key", data.playerKey)
      .maybeSingle();
    if (!player) throw new Error("Player not found");
    const addresses = { ...((player.addresses as Record<string, string>) ?? {}) };
    addresses[data.method] = data.address.trim();
    await db.from("players").update({ addresses }).eq("id", player.id as string);
    return snapshot(data.playerKey);
  });
