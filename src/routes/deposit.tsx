import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/game/Shell";
import { Coin } from "@/components/game/Coin";
import { CurrencyIcon } from "@/components/game/CurrencyIcon";
import { CURRENCIES, MIN_AMOUNT, fmt, fmtDate, requestDeposit, useGame } from "@/lib/game";
import { haptic } from "@/lib/telegram";

export const Route = createFileRoute("/deposit")({
  head: () => ({
    meta: [
      { title: "Пополнение баланса — DragonVault" },
      {
        name: "description",
        content: "Пополните игровой баланс DragonVault криптовалютой: TRX, TON, BNB, USDT и другие.",
      },
      { property: "og:title", content: "Пополнение баланса — DragonVault" },
      {
        property: "og:description",
        content: "Выберите монету и пополните баланс, чтобы купить новых драконов.",
      },
    ],
  }),
  component: DepositPage,
});

function DepositPage() {
  const game = useGame();
  const [selected, setSelected] = useState<(typeof CURRENCIES)[number] | null>(null);
  const [amount, setAmount] = useState("1.00");
  const deposits = game.txs.filter((t) => t.kind === "deposit");
  const usd = Number(amount) || 0;

  if (!selected) {
    return (
      <Shell>
        <h1 className="rounded-full bg-secondary py-2 text-center text-base font-semibold">
          Пополнение баланса
        </h1>
        <div className="flex flex-col gap-2">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => setSelected(c)}
              className="panel flex items-center gap-3 px-3 py-3 text-left"
            >
              <CurrencyIcon label={c.label} color={c.color} />
              <span>
                <span className="block font-semibold">{c.label}</span>
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  Минимум: <Coin className="h-4 w-4" /> {fmt(MIN_AMOUNT)}
                </span>
              </span>
            </button>
          ))}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <button
        onClick={() => setSelected(null)}
        className="self-start text-sm text-muted-foreground"
      >
        ← Все монеты
      </button>

      <section className="panel space-y-4 px-4 py-5">
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">Сумма (USD)</label>
          <div className="flex items-center gap-3">
            <Coin className="h-8 w-8" />
            <input
              className="field text-lg"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">{selected.label}</label>
          <div className="flex items-center gap-3">
            <CurrencyIcon label={selected.label} color={selected.color} size={32} />
            <input className="field text-lg" readOnly value={(usd * selected.rate).toFixed(6)} />
          </div>
        </div>
        <button
          className="btn-gold ml-auto block w-1/2 py-3"
          onClick={() => {
            if (usd < MIN_AMOUNT) {
              toast.error(`Минимальная сумма ${fmt(MIN_AMOUNT)}`);
              return;
            }
            requestDeposit(selected.label, usd);
            haptic();
            toast.success("Заявка создана. Ожидайте подтверждения сети.");
          }}
        >
          Пополнить
        </button>
      </section>

      <TxTable
        rows={deposits.map((t) => [fmtDate(t.date), t.method, fmt(t.sum), t.status])}
      />
    </Shell>
  );
}

export function TxTable({ rows }: { rows: string[][] }) {
  return (
    <section className="panel overflow-hidden">
      <div className="grid grid-cols-4 gap-1 bg-secondary/70 px-3 py-2 text-xs font-semibold">
        <span>Дата</span>
        <span>Метод</span>
        <span>Сумма</span>
        <span>Статус</span>
      </div>
      {rows.length === 0 ? (
        <p className="px-3 py-4 text-center text-sm text-muted-foreground">Операций пока нет</p>
      ) : (
        rows.map((r, i) => (
          <div key={i} className="grid grid-cols-4 gap-1 border-t border-border px-3 py-2 text-xs">
            {r.map((c, j) => (
              <span key={j} className="truncate">
                {c}
              </span>
            ))}
          </div>
        ))
      )}
    </section>
  );
}
