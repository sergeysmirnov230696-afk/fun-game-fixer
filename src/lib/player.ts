import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import {
  buyDragon,
  collectIncome,
  collectReferral,
  createDeposit,
  createWithdraw,
  loadPlayer,
  savePayoutAddress,
  setLanguage,
  type PlayerSnapshot,
} from "./game.functions";
import { getStartParam, getTelegramUser } from "./telegram";
import { useI18n } from "./i18n";

const KEY_STORAGE = "dragonvault_player_key";

export function usePlayerKey() {
  const [identity, setIdentity] = useState<{
    playerKey: string;
    name: string;
    referredBy?: string;
  } | null>(null);

  useEffect(() => {
    const tg = getTelegramUser();
    let key = tg ? `tg_${tg.id}` : localStorage.getItem(KEY_STORAGE);
    if (!key) {
      key = `web_${crypto.randomUUID().slice(0, 12)}`;
      localStorage.setItem(KEY_STORAGE, key);
    }
    const name = tg
      ? [tg.first_name, tg.last_name].filter(Boolean).join(" ") || tg.username || "Player"
      : "Guest";
    const ref = getStartParam();
    setIdentity(ref ? { playerKey: key, name, referredBy: ref } : { playerKey: key, name });
  }, []);

  return identity;
}

export function usePlayer() {
  const identity = usePlayerKey();
  const load = useServerFn(loadPlayer);

  return useQuery({
    queryKey: ["player", identity?.playerKey],
    enabled: !!identity,
    queryFn: () => load({ data: identity! }) as Promise<PlayerSnapshot>,
    staleTime: 15_000,
  });
}

function useSnapshotMutation<TVars>(fn: (vars: TVars) => Promise<PlayerSnapshot>) {
  const qc = useQueryClient();
  const { t } = useI18n();
  return useMutation({
    mutationFn: fn,
    onSuccess: (snap) => {
      qc.setQueryData(["player", snap.playerKey], snap);
    },
    onError: (e: Error) => {
      const map: Record<string, string> = {
        INSUFFICIENT_FUNDS: t("insufficient"),
        NOTHING_TO_COLLECT: t("nothing"),
        NO_ADDRESS: t("needAddress"),
      };
      toast.error(map[e.message] ?? t("error"));
    },
  });
}

export function useGameActions(playerKey?: string) {
  const buy = useServerFn(buyDragon);
  const collect = useServerFn(collectIncome);
  const collectRef = useServerFn(collectReferral);
  const deposit = useServerFn(createDeposit);
  const withdraw = useServerFn(createWithdraw);
  const saveAddress = useServerFn(savePayoutAddress);
  const language = useServerFn(setLanguage);
  const key = playerKey ?? "";

  return {
    buy: useSnapshotMutation((dragonId: number) => buy({ data: { playerKey: key, dragonId } })),
    collect: useSnapshotMutation(() => collect({ data: { playerKey: key } })),
    collectReferral: useSnapshotMutation(() => collectRef({ data: { playerKey: key } })),
    deposit: useSnapshotMutation((v: { method: string; amount: number }) =>
      deposit({ data: { playerKey: key, ...v } }),
    ),
    withdraw: useSnapshotMutation((v: { method: string; amount: number }) =>
      withdraw({ data: { playerKey: key, ...v } }),
    ),
    saveAddress: useSnapshotMutation((v: { method: string; address: string }) =>
      saveAddress({ data: { playerKey: key, ...v } }),
    ),
    setLanguage: useSnapshotMutation((lang: "en" | "ru") =>
      language({ data: { playerKey: key, language: lang } }),
    ),
  };
}

export function fmt(n: number, digits = 2, lang: string = "en") {
  return n.toLocaleString(lang === "ru" ? "ru-RU" : "en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtDate(iso: string) {
  const d = new Date(iso);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${String(d.getFullYear()).slice(2)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function referralLink(playerKey: string) {
  return `https://t.me/dragonvault_bot?start=${playerKey.replace(/^tg_/, "")}`;
}
