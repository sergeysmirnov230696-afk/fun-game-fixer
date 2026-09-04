import { Link } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Coin } from "./Coin";
import { fmt, hydrate, useGame } from "@/lib/game";
import { initTelegram } from "@/lib/telegram";

const TABS = [
  { to: "/", label: "Игра" },
  { to: "/deposit", label: "Пополнить" },
  { to: "/withdraw", label: "Вывод" },
  { to: "/referrals", label: "Друзья" },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const game = useGame();

  useEffect(() => {
    initTelegram();
    hydrate();
  }, []);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-xl flex-col gap-4 px-3 pt-4 pb-10">
      <header className="panel flex items-stretch overflow-hidden">
        <div className="flex-1 px-4 py-3">
          <p className="text-xs tracking-wide text-muted-foreground">Ваш баланс</p>
          <p className="flex items-center gap-2 text-2xl font-bold">
            <Coin className="h-6 w-6" />
            {fmt(game.balance, 2)}
          </p>
        </div>
        <div className="flex w-2/5 items-center justify-center bg-accent/60 px-3 py-3 text-center text-sm leading-tight font-medium">
          {game.playerName}
        </div>
      </header>

      <nav className="grid grid-cols-4 gap-2">
        {TABS.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="rune-tab px-1 py-2.5 text-center text-[13px]"
            activeOptions={{ exact: t.to === "/" }}
            activeProps={{ className: "rune-tab-active" }}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {children}

      <a
        href="https://t.me/dragonvault_support"
        target="_blank"
        rel="noreferrer"
        className="panel mt-auto py-3 text-center text-sm tracking-[0.2em] text-muted-foreground uppercase"
      >
        Поддержка
      </a>
    </div>
  );
}
