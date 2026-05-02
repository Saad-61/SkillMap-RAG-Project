import { cn, clampScore, formatScore } from "../lib/utils";
import { Progress } from "./ui/progress";

function scoreTone(score: number) {
  const s = clampScore(score);
  if (s >= 60) return "green";
  if (s >= 40) return "amber";
  return "rose";
}

export function ScorePill({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const tone = scoreTone(score);
  const pct = clampScore(score);
  const label = formatScore(score);

  const textColor =
    tone === "green"
      ? "text-green-600"
      : tone === "amber"
      ? "text-amber-500"
      : "text-rose-500";

  const barColor =
    tone === "green"
      ? "bg-green-500"
      : tone === "amber"
      ? "bg-amber-400"
      : "bg-rose-400";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className={cn("text-sm font-bold tabular-nums", textColor)}>
        {label}
      </span>
      {/* Custom bar using the same color system as job cards */}
      <div className="relative h-2 w-28 overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn("h-full rounded-full transition-all", barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
