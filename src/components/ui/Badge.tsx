import type { ReactNode } from "react";

const tones = {
  easy: "bg-practice-soft text-practice-ink",
  medium: "bg-compete-soft text-compete-ink",
  hard: "bg-danger-soft text-danger-ink",
  soon: "bg-brand-soft text-brand-ink",
  soonDark: "bg-brand-400/15 text-brand-300",
  neutral: "bg-surface-2 text-fg-muted",
} as const;

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: keyof typeof tones;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-4 ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
