import { Lightbulb, Sparkles, TriangleAlert, type LucideIcon } from "lucide-react";
import type { Callout } from "@/lib/courses/types";

const styles: Record<Callout["variant"], { icon: LucideIcon; box: string; chip: string; label: string }> = {
  tip: {
    icon: Lightbulb,
    box: "border-brand-500/25 bg-brand-soft",
    chip: "bg-brand-soft text-brand-ink",
    label: "Consejo",
  },
  key: {
    icon: Sparkles,
    box: "border-learn/30 bg-learn-soft",
    chip: "bg-learn-soft text-learn-ink",
    label: "Idea clave",
  },
  warning: {
    icon: TriangleAlert,
    box: "border-compete/30 bg-compete-soft",
    chip: "bg-compete-soft text-compete-ink",
    label: "Cuidado",
  },
};

export function CalloutBlock({ block }: { block: Callout }) {
  const style = styles[block.variant];
  const Icon = style.icon;

  return (
    <div className={`flex gap-4 rounded-2xl border p-5 ${style.box}`}>
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${style.chip}`}>
        <Icon aria-hidden className="size-4.5" />
      </span>
      <div>
        <p className="font-display text-sm font-semibold">{block.title ?? style.label}</p>
        <p className="mt-1.5 leading-7 text-fg-body">{block.text}</p>
      </div>
    </div>
  );
}
