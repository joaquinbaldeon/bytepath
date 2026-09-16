import { Circle, CircleCheck, Play } from "lucide-react";
import type { LessonStatus } from "@/lib/courses/progress";

export function LessonStatusIcon({
  status,
  className = "size-4.5",
}: {
  status: LessonStatus;
  className?: string;
}) {
  if (status === "completed") {
    return <CircleCheck aria-hidden className={`shrink-0 text-learn-ink ${className}`} />;
  }
  if (status === "current") {
    return (
      <span className="grid size-4.5 shrink-0 place-items-center rounded-full bg-learn text-white">
        <Play aria-hidden className="size-2.5 fill-current" />
      </span>
    );
  }
  return <Circle aria-hidden className={`shrink-0 text-fg-subtle/50 ${className}`} />;
}

export const lessonStatusLabels: Record<LessonStatus, string> = {
  completed: "Completada",
  current: "En curso",
  upcoming: "No iniciada",
};
