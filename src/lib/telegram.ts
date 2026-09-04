export type TgUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type TgWebApp = {
  ready: () => void;
  expand: () => void;
  initDataUnsafe?: { user?: TgUser; start_param?: string };
  HapticFeedback?: { impactOccurred: (s: string) => void };
  openTelegramLink?: (url: string) => void;
  setHeaderColor?: (c: string) => void;
};

export function getWebApp(): TgWebApp | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { Telegram?: { WebApp?: TgWebApp } }).Telegram?.WebApp ?? null;
}

export function initTelegram() {
  const wa = getWebApp();
  if (!wa) return;
  try {
    wa.ready();
    wa.expand();
    wa.setHeaderColor?.("#0d1117");
  } catch {
    /* noop */
  }
}

export function haptic() {
  try {
    getWebApp()?.HapticFeedback?.impactOccurred("medium");
  } catch {
    /* noop */
  }
}

export function getTelegramUser(): TgUser | null {
  return getWebApp()?.initDataUnsafe?.user ?? null;
}

export function getStartParam(): string | null {
  return getWebApp()?.initDataUnsafe?.start_param ?? null;
}
