import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Download, CheckCircle, AlertTriangle, AlertCircle } from "lucide-react";
import type { CognitiveContinuityResult } from "@shared/schema";

interface CognitiveContinuityResultsProps {
  result: CognitiveContinuityResult;
}

export function CognitiveContinuityResults({ result }: CognitiveContinuityResultsProps) {
  const downloadAsText = () => {
    let text = "COGNITIVE CONTINUITY CHECK\n";
    text += "=" + "=".repeat(70) + "\n\n";
    
    text += `Target: ${result.target}\n`;
    text += `Composite Score: ${result.compositeScore.toFixed(3)}\n`;
    text += `Reference Set: ${result.referenceSet.join(", ")}\n\n`;
    
    text += "\n" + "=".repeat(70) + "\n";
    text += "PAIRWISE SIMILARITY SCORES\n";
    text += "=".repeat(70) + "\n\n";
    Object.entries(result.pairwise).forEach(([ref, score]) => {
      text += `${ref}: ${score.toFixed(3)}\n`;
    });
    
    text += "\n" + "=".repeat(70) + "\n";
    text += "ALIGNMENT SUMMARY\n";
    text += "=".repeat(70) + "\n\n";
    result.alignmentSummary.forEach((summary, idx) => {
      text += `${idx + 1}. ${summary}\n`;
    });
    
    if (result.continuityRewrite) {
      text += "\n" + "=".repeat(70) + "\n";
      text += "CONTINUITY-ALIGNED REWRITE\n";
      text += "=".repeat(70) + "\n\n";
      text += `${result.continuityRewrite}\n\n`;
    }
    
    text += "\n" + "=".repeat(70) + "\n";
    text += `Generated: ${new Date().toLocaleString()}\n`;
    
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `continuity-check-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusInfo = () => {
    const score = result.compositeScore;
    if (score >= 0.80) {
      return {
        icon: CheckCircle,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-950/30",
        label: "Strong Continuity",
      };
    } else if (score >= 0.50) {
      return {
        icon: AlertTriangle,
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
        label: "Moderate Continuity",
      };
    } else {
      return {
        icon: AlertCircle,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-950/30",
        label: "Low Continuity",
      };
    }
  };

  const status = getStatusInfo();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-4 mt-6" data-testid="continuity-results">
      <Card className={status.bgColor}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusIcon className={`w-6 h-6 ${status.color}`} />
              <div>
                <CardTitle className={status.color}>{status.label}</CardTitle>
                <CardDescription>Composite Score: {result.compositeScore.toFixed(3)}</CardDescription>
              </div>
            </div>
            <Button onClick={downloadAsText} variant="outline" size="sm" data-testid="button-download-txt">
              <Download className="w-4 h-4 mr-2" />
              Download as TXT
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pairwise Similarity Scores</CardTitle>
          <CardDescription>Semantic similarity between target text and each reference</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(result.pairwise).length === 0 ? (
            <p className="text-sm text-muted-foreground">No reference texts selected</p>
          ) : (
            <div className="space-y-2">
              {Object.entries(result.pairwise).map(([ref, score]) => (
                <div key={ref} className="flex items-center justify-between p-2 border rounded" data-testid={`pairwise-${ref}`}>
                  <span className="text-sm font-medium truncate flex-1">{ref}</span>
                  <Badge variant={score >= 0.7 ? "default" : score >= 0.5 ? "secondary" : "outline"}>
                    {score.toFixed(3)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alignment Summary</CardTitle>
          <CardDescription>Key points of agreement and divergence</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {result.alignmentSummary.map((summary, idx) => (
              <li key={idx} className="text-sm" data-testid={`alignment-summary-${idx}`}>
                <span className="font-medium text-primary">•</span> {summary}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {result.continuityRewrite && (
        <Card>
          <CardHeader>
            <CardTitle>Continuity-Aligned Rewrite</CardTitle>
            <CardDescription>Text harmonized with selected references</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-sm leading-relaxed" data-testid="continuity-rewrite">
                {result.continuityRewrite}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
