// Monograma: una ruta que sube, avanza y vuelve a bajar entre dos nodos (el "path" de BytePath).
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" className="fill-brand-500" />
      <path
        d="M9 23V13a3 3 0 0 1 3-3h3a3 3 0 0 1 3 3v6a3 3 0 0 0 3 3h2"
        fill="none"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="23" r="2.4" fill="white" />
      <circle cx="23.5" cy="22" r="2.6" className="fill-brand-500" stroke="white" strokeWidth="2" />
    </svg>
  );
}

export function Logo({
  variant = "onDark",
  className = "",
}: {
  variant?: "onDark" | "onLight";
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span
        className={`font-display text-lg font-semibold tracking-tight ${variant === "onDark" ? "text-white" : "text-ink"}`}
      >
        Byte
        <span className={variant === "onDark" ? "text-brand-300" : "text-brand-500"}>
          Path
        </span>
      </span>
    </span>
  );
}
