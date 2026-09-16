export function ProgressBar({
  value,
  onDark = false,
  className = "",
  label,
}: {
  value: number;
  onDark?: boolean;
  className?: string;
  label?: string;
}) {
  const percent = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progreso del curso"}
      className={`h-1.5 w-full overflow-hidden rounded-full ${
        onDark ? "bg-white/15" : "bg-line"
      } ${className}`}
    >
      <div
        className="h-full rounded-full bg-learn transition-[width] duration-700"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
