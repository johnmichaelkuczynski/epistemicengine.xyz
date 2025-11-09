import { Progress } from "@/components/ui/progress";

interface CoherenceScoreProps {
  score: number;
  label?: string;
}

export function CoherenceScore({ score, label = "Coherence Score" }: CoherenceScoreProps) {
  const percentage = score * 100;
  
  const getScoreColor = (score: number) => {
    if (score >= 0.9) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 0.75) return "text-blue-600 dark:text-blue-400";
    if (score >= 0.6) return "text-amber-600 dark:text-amber-400";
    return "text-destructive";
  };

  const getScoreDescription = (score: number) => {
    if (score >= 0.9) return "Excellent";
    if (score >= 0.75) return "Strong";
    if (score >= 0.6) return "Moderate";
    return "Weak";
  };

  return (
    <div className="space-y-2" data-testid="coherence-score-display">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
            {score.toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground">
            ({getScoreDescription(score)})
          </span>
        </div>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
