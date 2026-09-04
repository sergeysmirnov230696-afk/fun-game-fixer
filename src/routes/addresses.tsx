import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Shell } from "@/components/game/Shell";
import { CurrencyIcon } from "@/components/game/CurrencyIcon";
import { CURRENCIES, saveAddress, useGame, type CurrencyCode } from "@/lib/game";
import { haptic } from "@/lib/telegram";

export const Route = createFileRoute("/addresses")({
  head: () => ({
    meta: [
      { title: "Адреса выплат — DragonVault" },
      {
        name: "description",
        content: "Сохраните адреса криптокошельков для быстрых выплат из игры DragonVault.",
      },
      { property: "og:title", content: "Адреса выплат — DragonVault" },
      {
        property: "og:description",
        content: "Один раз укажите кошельки — и выводите награды в один клик.",
      },
    ],
  }),
  component: AddressesPage,
});

function AddressesPage() {
  const game = useGame();
  const [draft, setDraft] = useState<Partial<Record<CurrencyCode, string>>>({});

  return (
    <Shell>
      <h1 className="rounded-full bg-secondary py-2 text-center text-base font-semibold">
        Адреса выплат
      </h1>
      <div className="flex flex-col gap-2">
        {CURRENCIES.map((c) => (
          <div key={c.code} className="flex items-center gap-2">
            <CurrencyIcon label={c.label} color={c.color} size={34} />
            <input
              className="field text-sm"
              placeholder={c.label}
              value={draft[c.code] ?? game.addresses[c.code] ?? ""}
              onChange={(e) => setDraft((d) => ({ ...d, [c.code]: e.target.value }))}
            />
            <button
              className="btn-gold shrink-0 px-4 py-2 text-sm"
              onClick={() => {
                const val = (draft[c.code] ?? game.addresses[c.code] ?? "").trim();
                if (!val) {
                  toast.error("Введите адрес кошелька");
                  return;
                }
                saveAddress(c.code, val);
                haptic();
                toast.success(`Адрес ${c.label} сохранён`);
              }}
            >
              Сохранить
            </button>
          </div>
        ))}
      </div>
    </Shell>
  );
}
