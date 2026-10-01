import { X } from "lucide-react";
import Link from "next/link";
import { EnergyMeter } from "@/components/energy/EnergyMeter";
import { TokenBadge } from "@/components/tokens/TokenBadge";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LogoMark } from "@/components/ui/Logo";
import { coursePath } from "@/lib/courses/api";

export function LessonHeader({
  courseSlug,
  courseTitle,
  position,
  total,
  percent,
}: {
  courseSlug: string;
  courseTitle: string;
  position: number;
  total: number;
  percent: number;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-night-900 text-white">
      <div className="flex h-14 items-center gap-4 px-5 sm:px-8">
        <Link href="/" aria-label="BytePath, inicio" className="shrink-0">
          <LogoMark className="size-7" />
        </Link>
        <Link
          href={coursePath(courseSlug)}
          className="hidden truncate text-sm text-slate-300 transition-colors hover:text-white sm:block"
        >
          {courseTitle}
        </Link>

        <div className="ml-auto flex items-center gap-3 sm:gap-4">
          {/* La energía se gasta en esta pantalla, así que se ve en esta
              pantalla. En móvil el medidor se reduce a una cifra, que es lo
              que deja sitio para que siga cabiendo el progreso. */}
          <EnergyMeter />
          <TokenBadge className="hidden sm:flex" />

          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-xs text-slate-400 sm:inline">
              {position}/{total}
            </span>
            <ProgressBar
              value={percent}
              onDark
              className="w-24 sm:w-36"
              label={`Progreso de ${courseTitle}`}
            />
          </div>
          <ThemeToggle className="text-slate-300 hover:bg-white/5 hover:text-white" />
          <Link
            href={coursePath(courseSlug)}
            aria-label="Salir al curso"
            className="grid size-9 place-items-center rounded-lg text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <X aria-hidden className="size-4.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
