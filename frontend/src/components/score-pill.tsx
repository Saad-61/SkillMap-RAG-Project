import { cn, clampScore, formatScore } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";

function scoreTone(score: number) {
  const s = clampScore(score);
  if (s >= 50) return "green";
  if (s >= 40) return "amber";
  return "red";
}

export function ScorePill({
  score,
  className,
}: {
  score: number;
  className?: string;
}) {
  const tone = scoreTone(score);
  const label = formatScore(score);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Badge variant={tone === "green" ? "green" : tone === "amber" ? "amber" : "red"}>
        {label}
      </Badge>
      <Progress value={clampScore(score)} className="h-2 w-28" />
    </div>
  );
}
