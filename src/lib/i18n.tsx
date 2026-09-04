import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ru";

const en = {
  balance: "Your balance",
  guest: "Guest",
  tabGame: "Lair",
  tabDeposit: "Deposit",
  tabWithdraw: "Withdraw",
  tabReferrals: "Friends",
  support: "Support",
  accrued: "Accrued",
  hour: "HOUR",
  day: "DAY",
  month: "MONTH",
  collect: "COLLECT",
  income: "Income",
  perMonth: "per month",
  perDay: "per day",
  buy: "Buy",
  lives: "Lives {n} days",
  level: "Level {n}",
  owned: "Owned",
  completed: "COMPLETED",
  collected: "Collected {v}",
  bought: "{name} has moved into your lair",
  insufficient: "Not enough funds",
  nothing: "Nothing to collect yet",
  depositTitle: "Balance replenishment",
  withdrawTitle: "Withdraw funds",
  minimum: "Minimum",
  amountUsd: "Amount (USD)",
  youGet: "You get {c}:",
  topUp: "Top up",
  payOut: "Pay out",
  allCoins: "All coins",
  date: "Date",
  method: "Method",
  sum: "Sum",
  status: "Status",
  noOps: "No operations yet",
  depositCreated: "Request created. Waiting for network confirmation.",
  withdrawCreated: "Payout request accepted",
  myAddress: "My address:",
  setAddress: "Set payout address",
  addressesTitle: "Payout addresses",
  save: "Save",
  addressSaved: "{c} address saved",
  enterAddress: "Enter a wallet address",
  minAmount: "Minimum amount is {v}",
  payoutNote:
    "Payments are processed manually, within 72 hours. Users who have topped up their balance are paid first.",
  refPercent: "of your friend's deposit",
  refBonus: "for every invited partner",
  copy: "Copy",
  copied: "Link copied",
  copyFailed: "Could not copy",
  player: "Player",
  deposit: "Deposit",
  noRefs: "Invite your first friend with the link above",
  statusPending: "Pending",
  statusDone: "Done",
  statusRejected: "Rejected",
  loading: "Loading your lair…",
  needAddress: "Set a payout address first",
  error: "Something went wrong",
  d_frostling: "Frost Hatchling",
  d_ember: "Ember Drake",
  d_crimson: "Crimson Stormling",
  d_gilded: "Gilded Guardian",
  d_emerald: "Emerald Hunter",
  d_void: "Void Sovereign",
  d_sapphire: "Sapphire Frostwyrm",
  d_solar: "Solar Radiant",
  d_storm: "Storm Titan",
  d_cosmic: "Cosmic Mythic",
};

type Dict = typeof en;

const ru: Dict = {
  balance: "Ваш баланс",
  guest: "Гость",
  tabGame: "Логово",
  tabDeposit: "Пополнить",
  tabWithdraw: "Вывод",
  tabReferrals: "Друзья",
  support: "Поддержка",
  accrued: "Накоплено",
  hour: "ЧАС",
  day: "ДЕНЬ",
  month: "МЕСЯЦ",
  collect: "СОБРАТЬ",
  income: "Доход",
  perMonth: "за месяц",
  perDay: "в день",
  buy: "Купить",
  lives: "Живёт {n} дней",
  level: "Уровень {n}",
  owned: "В логове",
  completed: "ЗАВЕРШЁН",
  collected: "Собрано {v}",
  bought: "{name} поселён в вашем логове",
  insufficient: "Недостаточно средств",
  nothing: "Пока нечего собирать",
  depositTitle: "Пополнение баланса",
  withdrawTitle: "Вывод средств",
  minimum: "Минимум",
  amountUsd: "Сумма (USD)",
  youGet: "Получите {c}:",
  topUp: "Пополнить",
  payOut: "Вывести",
  allCoins: "Все монеты",
  date: "Дата",
  method: "Метод",
  sum: "Сумма",
  status: "Статус",
  noOps: "Операций пока нет",
  depositCreated: "Заявка создана. Ожидайте подтверждения сети.",
  withdrawCreated: "Заявка на выплату принята",
  myAddress: "Мой адрес:",
  setAddress: "Указать адрес выплаты",
  addressesTitle: "Адреса выплат",
  save: "Сохранить",
  addressSaved: "Адрес {c} сохранён",
  enterAddress: "Введите адрес кошелька",
  minAmount: "Минимальная сумма {v}",
  payoutNote:
    "Выплаты обрабатываются вручную, до 72 часов. Пользователи, пополнявшие баланс, получают выплату в первую очередь.",
  refPercent: "от суммы пополнения друга",
  refBonus: "за каждого приглашённого партнёра",
  copy: "Копировать",
  copied: "Ссылка скопирована",
  copyFailed: "Не удалось скопировать",
  player: "Игрок",
  deposit: "Депозит",
  noRefs: "Пригласите первого друга по ссылке выше",
  statusPending: "Ожидание",
  statusDone: "Выполнено",
  statusRejected: "Отклонено",
  loading: "Загружаем ваше логово…",
  needAddress: "Сначала укажите адрес выплаты",
  error: "Что-то пошло не так",
  d_frostling: "Ледяной птенец",
  d_ember: "Угольный дракон",
  d_crimson: "Багровый штормовик",
  d_gilded: "Золотой хранитель",
  d_emerald: "Изумрудный ловчий",
  d_void: "Владыка Бездны",
  d_sapphire: "Сапфировый ледозмей",
  d_solar: "Солнечный сияющий",
  d_storm: "Титан бурь",
  d_cosmic: "Космический мифик",
};

const DICTS: Record<Lang, Dict> = { en, ru };
const STORAGE_KEY = "dragonvault_lang";

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof Dict, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<Ctx>({
  lang: "en",
  setLang: () => {},
  t: (k) => en[k],
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "ru" || stored === "en") setLangState(stored);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* noop */
    }
  }, []);

  const t = useCallback(
    (key: keyof Dict, vars?: Record<string, string | number>) => {
      let value: string = DICTS[lang][key] ?? en[key];
      if (vars) {
        for (const [k, v] of Object.entries(vars)) value = value.replace(`{${k}}`, String(v));
      }
      return value;
    },
    [lang],
  );

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
