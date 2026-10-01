import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";

const variants = {
  primary:
    "bg-brand-500 text-white shadow-[0_10px_30px_-10px_rgb(109_94_246/0.7)] hover:bg-brand-600",
  outlineDark:
    "border border-white/15 text-white hover:border-white/30 hover:bg-white/5",
  outlineLight: "border border-line bg-surface text-fg hover:bg-surface-2",
} as const;

const sizes = {
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
} as const;

type ButtonProps = ComponentProps<typeof Link> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  arrow?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  arrow = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <Link
      className={`bp-press group inline-flex items-center justify-center gap-2 rounded-control font-medium transition-[background-color,border-color,color,transform] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
      {arrow && (
        <ArrowRight
          aria-hidden
          className="size-4 transition-transform group-hover:translate-x-0.5"
        />
      )}
    </Link>
  );
}
