import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Shell } from "@/components/game/Shell";
import { Coin } from "@/components/game/Coin";
import { collectReferral, fmt, fmtDate, referralLink, useGame } from "@/lib/game";
import { haptic } from "@/lib/telegram";

export const Route = createFileRoute("/referrals")({
  head: () => ({
    meta: [
      { title: "Друзья и бонусы — DragonVault" },
      {
        name: "description",
        content:
          "Приглашайте друзей в DragonVault и получайте 15% от их пополнений плюс бонус за каждого партнёра.",
      },
      { property: "og:title", content: "Друзья и бонусы — DragonVault" },
      {
        property: "og:description",
        content: "15% от пополнений приглашённых игроков — ваша реферальная награда.",
      },
    ],
  }),
  component: ReferralsPage,
});

function ReferralsPage() {
  const game = useGame();
  const link = referralLink(game);

  return (
    <Shell>
      <section className="panel space-y-3 px-4 py-5">
        <div className="flex items-center gap-3">
          <Coin className="h-8 w-8" />
          <span className="field text-lg">{fmt(game.referralBalance, 2)}</span>
          <button
            className="btn-gold w-2/5 shrink-0 py-2.5"
            onClick={() => {
              const got = collectReferral();
              if (got > 0) {
                haptic();
                toast.success(`Собрано ${fmt(got)}`);
              } else {
                toast.error("Пока нечего собирать");
              }
            }}
          >
            Собрать
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm"
            style={{ backgroundImage: "var(--gradient-crystal)" }}
          >
            🔗
          </span>
          <span className="field truncate text-sm">{link}</span>
          <button
            className="btn-gold w-2/5 shrink-0 py-2.5"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
                toast.success("Ссылка скопирована");
              } catch {
                toast.error("Не удалось скопировать");
              }
            }}
          >
            Копировать
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="rounded-lg border border-border bg-secondary/60 px-3 py-3 text-center">
            <p className="text-xl font-bold text-primary">15%</p>
            <p className="text-xs text-muted-foreground">от суммы пополнения друга</p>
          </div>
          <div className="rounded-lg border border-border bg-secondary/60 px-3 py-3 text-center">
            <p className="flex items-center justify-center gap-1 text-xl font-bold">
              <Coin className="h-5 w-5" />
              0.02
            </p>
            <p className="text-xs text-muted-foreground">за каждого партнёра</p>
          </div>
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="grid grid-cols-4 gap-1 bg-secondary/70 px-3 py-2 text-xs font-semibold">
          <span>Дата</span>
          <span>Игрок</span>
          <span>Депозит</span>
          <span>Доход</span>
        </div>
        {game.referrals.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">
            Пригласите первого друга по ссылке выше
          </p>
        ) : (
          game.referrals.map((r, i) => (
            <div
              key={i}
              className="grid grid-cols-4 gap-1 border-t border-border px-3 py-2 text-xs"
            >
              <span>{fmtDate(r.date)}</span>
              <span className="truncate">{r.user}</span>
              <span>{fmt(r.deposit)}</span>
              <span>{fmt(r.income)}</span>
            </div>
          ))
        )}
      </section>
    </Shell>
  );
}
