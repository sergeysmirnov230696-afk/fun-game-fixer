import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/game/Shell";
import { Coin } from "@/components/game/Coin";
import { CurrencyIcon } from "@/components/game/CurrencyIcon";
import { TxTable } from "./deposit";
import { CURRENCIES, MIN_AMOUNT, fmt, fmtDate, requestWithdraw, useGame } from "@/lib/game";
import { haptic } from "@/lib/telegram";

export const Route = createFileRoute("/withdraw")({
  head: () => ({
    meta: [
      { title: "Вывод средств — DragonVault" },
      {
        name: "description",
        content: "Выводите заработанные монеты DragonVault в TRX, TON, USDT и другие криптовалюты.",
      },
      { property: "og:title", content: "Вывод средств — DragonVault" },
      {
        property: "og:description",
        content: "Укажите адрес кошелька и получите награду за своих драконов.",
      },
    ],
  }),
  component: WithdrawPage,
});

function WithdrawPage() {
  const game = useGame();
  const [selected, setSelected] = useState<(typeof CURRENCIES)[number] | null>(null);
  const [amount, setAmount] = useState("");
  const rows = game.txs.filter((t) => t.kind === "withdraw");

  if (!selected) {
    return (
      <Shell>
        <h1 className="rounded-full bg-secondary py-2 text-center text-base font-semibold">
          Вывод средств
        </h1>
        <div className="flex flex-col gap-2">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              onClick={() => {
                setSelected(c);
                setAmount(game.balance.toFixed(2));
              }}
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

  const usd = Number(amount) || 0;
  const address = game.addresses[selected.code];

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
          <label className="mb-1.5 block text-sm text-muted-foreground">
            Получите {selected.label}:
          </label>
          <div className="flex items-center gap-3">
            <CurrencyIcon label={selected.label} color={selected.color} size={32} />
            <input className="field text-lg" readOnly value={(usd * selected.rate).toFixed(6)} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-sm text-muted-foreground">Мой адрес:</label>
          <div className="flex items-center gap-3">
            <CurrencyIcon label={selected.label} color={selected.color} size={32} />
            {address ? (
              <span className="field truncate text-sm">{address}</span>
            ) : (
              <Link to="/addresses" className="field text-center text-sm tracking-wider uppercase">
                Указать адрес выплаты
              </Link>
            )}
          </div>
        </div>
        <button
          className="btn-gold ml-auto block w-1/2 py-3"
          onClick={() => {
            const res = requestWithdraw(selected.code, usd);
            if (res.ok) {
              haptic();
              toast.success("Заявка на выплату принята");
            } else {
              toast.error(res.error!);
            }
          }}
        >
          Вывести
        </button>
      </section>

      <p className="rounded-lg bg-[var(--warning)] px-3 py-2.5 text-center text-sm text-[var(--warning-foreground)]">
        Выплаты обрабатываются вручную, до 72 часов. Пользователи, пополнявшие баланс, получают
        выплату в первую очередь.
      </p>

      <TxTable rows={rows.map((t) => [fmtDate(t.date), t.method, fmt(t.sum), t.status])} />
    </Shell>
  );
}
