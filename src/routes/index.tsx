import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/game/Shell";
import { Coin } from "@/components/game/Coin";
import {
  DRAGONS,
  buyDragon,
  collect,
  dragonById,
  fmt,
  incomePerSecond,
  isExpired,
  pendingIncome,
  useGame,
} from "@/lib/game";
import { haptic } from "@/lib/telegram";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DragonVault — логово кристальных драконов" },
      {
        name: "description",
        content:
          "Покупайте кристальных драконов, копите ежедневный доход и собирайте награду в Telegram-игре DragonVault.",
      },
      { property: "og:title", content: "DragonVault — логово кристальных драконов" },
      {
        property: "og:description",
        content: "Telegram-игра: разводите драконов, получайте пассивный доход и выводите награды.",
      },
    ],
  }),
  component: GamePage,
});

function GamePage() {
  const game = useGame();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const perSecond = incomePerSecond(game, now);
  const pending = pendingIncome(game, now);
  const owned = (id: number) => game.dragons.filter((o) => o.dragonId === id);

  return (
    <Shell>
      <section className="panel px-4 py-5 text-center">
        <h1 className="text-base tracking-widest text-muted-foreground uppercase">Накоплено</h1>
        <p className="mt-1 flex items-center justify-center gap-2 text-3xl font-bold">
          <Coin className="h-7 w-7" />
          <span className="tabular-nums">{fmt(pending, 6)}</span>
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          {[
            { label: "ЧАС", value: perSecond * 3600 },
            { label: "ДЕНЬ", value: perSecond * 86400 },
            { label: "МЕСЯЦ", value: perSecond * 86400 * 30 },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-secondary/60 py-2">
              <p className="text-[11px] tracking-widest text-muted-foreground">{s.label}</p>
              <p className="flex items-center justify-center gap-1 text-sm font-semibold">
                <Coin className="h-4 w-4" />
                {fmt(s.value, 2)}
              </p>
            </div>
          ))}
        </div>

        <button
          className="btn-gold mt-5 w-2/3 py-3 text-base"
          disabled={pending <= 0}
          onClick={() => {
            const got = collect();
            if (got > 0) {
              haptic();
              toast.success(`Собрано ${fmt(got, 6)}`);
            }
          }}
        >
          СОБРАТЬ
        </button>
      </section>

      <section className="grid grid-cols-2 gap-3">
        {DRAGONS.map((d) => {
          const mine = owned(d.id);
          const alive = mine.filter((o) => !isExpired(o, now)).length;
          const canBuy = game.balance >= d.price;
          return (
            <article key={d.id} className="panel flex flex-col items-center px-3 py-4">
              <p className="text-xs text-muted-foreground">Доход</p>
              <p className="flex items-center gap-1.5 text-xl font-bold text-[var(--success)]">
                <Coin className="h-5 w-5" />
                {fmt((d.price * d.ratePerDay * 30) / 100, 2)}
              </p>
              <p className="mb-1 text-xs text-muted-foreground">за месяц</p>

              <div className="relative my-1">
                <img
                  src={d.image}
                  alt={d.name}
                  loading="lazy"
                  width={512}
                  height={512}
                  className={`h-28 w-28 object-contain ${alive === 0 && mine.length > 0 ? "opacity-40 grayscale" : ""}`}
                />
                {alive > 0 && (
                  <span className="absolute -top-1 -right-1 rounded-full bg-[var(--gradient-crystal)] px-2 py-0.5 text-[11px] font-bold text-primary-foreground" style={{ backgroundImage: "var(--gradient-crystal)" }}>
                    ×{alive}
                  </span>
                )}
              </div>

              <p className="text-center text-sm font-semibold">{d.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Доход <span className="font-bold text-primary">{d.ratePerDay}%</span> в день
              </p>
              <p className="flex items-center gap-1.5 text-lg font-bold">
                <Coin className="h-4 w-4" />
                {fmt((d.price * d.ratePerDay) / 100, 2)}
              </p>

              <button
                className="btn-gold mt-3 flex w-full items-center justify-center gap-1.5 py-2 text-sm"
                disabled={!canBuy}
                onClick={() => {
                  const res = buyDragon(d.id);
                  if (res.ok) {
                    haptic();
                    toast.success(`${dragonById(d.id).name} поселён в логове`);
                  } else {
                    toast.error(res.error!);
                  }
                }}
              >
                Купить <Coin className="h-4 w-4" /> {fmt(d.price, 0)}
              </button>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Живёт {d.lifespanDays} дней
              </p>
            </article>
          );
        })}
      </section>
    </Shell>
  );
}
