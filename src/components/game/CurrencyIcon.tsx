import React, { useState } from "react";

type CurrencyIconProps = {
  label: string;
  color?: string;
  size?: number;
};

/**
 * Flaticon / bouzix / Color Fill
 *
 * Файлы:
 * public/icons/crypto/
 *
 * Основные:
 * trx.png
 * gram.png
 * bnb.png
 * doge.png
 * ltc.png
 * sol.png
 * pol.png
 * ton.png
 * usdt.png
 *
 * Сети:
 * network/bep20.png
 * network/trc20.png
 * network/polygon.png
 * network/solana.png
 * network/ton.png
 */

const currencyIcons: Record<string, string> = {
  TRX: "/icons/crypto/trx.png",
  GRAM: "/icons/crypto/gram.png",
  BNB: "/icons/crypto/bnb.png",
  "BNB (BEP20)": "/icons/crypto/bnb.png",

  DOG: "/icons/crypto/doge.png",
  DOGE: "/icons/crypto/doge.png",

  LTC: "/icons/crypto/ltc.png",
  SOL: "/icons/crypto/sol.png",
  POL: "/icons/crypto/pol.png",
  TON: "/icons/crypto/ton.png",

  USDT: "/icons/crypto/usdt.png",
  "USDT (BEP20)": "/icons/crypto/usdt.png",
  "USDT (TRC20)": "/icons/crypto/usdt.png",
  "USDT (POLYGON)": "/icons/crypto/usdt.png",
  "USDT (SOLANA)": "/icons/crypto/usdt.png",
  "USDT (TON)": "/icons/crypto/usdt.png",
};

const networkIcons: Record<string, string> = {
  BEP20: "/icons/crypto/network/bep20.png",
  TRC20: "/icons/crypto/network/trc20.png",
  POLYGON: "/icons/crypto/network/polygon.png",
  SOLANA: "/icons/crypto/network/solana.png",
  TON: "/icons/crypto/network/ton.png",
};

export function CurrencyIcon({
  label,
  color = "#666",
  size = 40,
}: CurrencyIconProps) {
  const normalizedLabel = label.trim().toUpperCase();

  const iconUrl = currencyIcons[normalizedLabel];

  /*
   * Получаем сеть из:
   *
   * USDT (BEP20)
   * USDT (TRC20)
   * USDT (POLYGON)
   * USDT (SOLANA)
   * USDT (TON)
   */
  const networkMatch = normalizedLabel.match(/\(([^)]+)\)/);

  const network = networkMatch
    ? networkMatch[1]
    : null;

  const networkIcon = network
    ? networkIcons[network]
    : null;

  const [iconError, setIconError] = useState(false);

  const [networkError, setNetworkError] = useState(false);

  /*
   * Маленький значок сети.
   *
   * На скриншоте он примерно 35–40%
   * от размера основной иконки.
   */
  const networkSize = Math.round(size * 0.38);

  /*
   * Резервный текст,
   * если PNG отсутствует.
   */
  const letters = normalizedLabel
    .replace(/\(.*\)/, "")
    .trim()
    .slice(0, 3);

  return (
    <div
      className="relative inline-flex shrink-0"
      style={{
        width: size,
        height: size,
      }}
    >
      {/* ========================================
          ОСНОВНАЯ ИКОНКА
      ======================================== */}

      {iconUrl && !iconError ? (
        <img
          src={iconUrl}
          alt={label}
          width={size}
          height={size}
          draggable={false}
          loading="lazy"
          className="block h-full w-full rounded-full object-contain"
          onError={() => setIconError(true)}
        />
      ) : (
        <span
          aria-hidden="true"
          className="flex h-full w-full items-center justify-center rounded-full font-bold text-white"
          style={{
            background: color,
            fontSize: Math.max(10, size * 0.30),
            boxShadow:
              "0 1px 3px rgba(0,0,0,.20), inset 0 0 0 1px rgba(255,255,255,.15)",
          }}
        >
          {letters}
        </span>
      )}

      {/* ========================================
          ЗНАЧОК СЕТИ
          Только для USDT (BEP20/TRC20/...)
      ======================================== */}

      {networkIcon && !networkError && (
        <span
          className="absolute flex items-center justify-center overflow-hidden rounded-full bg-white"
          style={{
            width: networkSize,
            height: networkSize,

            /*
             * Как на скриншоте:
             * маленький значок немного выходит
             * за границу основной иконки.
             */
            right: -1,
            bottom: -1,

            padding: 2,

            boxShadow:
              "0 1px 3px rgba(0,0,0,.30)",

            zIndex: 2,
          }}
        >
          <img
            src={networkIcon}
            alt={network || ""}
            draggable={false}
            loading="lazy"
            className="block h-full w-full rounded-full object-contain"
            onError={() => setNetworkError(true)}
          />
        </span>
      )}
    </div>
  );
}

export default CurrencyIcon;
