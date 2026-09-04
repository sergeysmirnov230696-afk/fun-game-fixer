export function Coin({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full text-[0.62em] font-bold ${className}`}
      style={{
        backgroundImage: "var(--gradient-gold)",
        color: "var(--gold-foreground)",
        boxShadow: "inset 0 0 0 1.5px oklch(0.68 0.13 70)",
      }}
    >
      $
    </span>
  );
}
