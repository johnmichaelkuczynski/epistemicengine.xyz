import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Download, AlertCircle, CheckCircle, AlertTriangle, Network } from "lucide-react";
import type { CognitiveContinuityResult } from "@shared/schema";

interface CognitiveContinuityResultsProps {
  result: CognitiveContinuityResult;
}

export function CognitiveContinuityResults({ result }: CognitiveContinuityResultsProps) {
  const downloadAsText = () => {
    let text = "COGNITIVE CONTINUITY LAYER ANALYSIS\n";
    text += "=" + "=".repeat(70) + "\n\n";
    
    text += "CONTINUITY CLASSIFICATION\n";
    text += "-".repeat(70) + "\n";
    text += `Continuity Composite: ${result.diagnostics.ContinuityComposite.toFixed(3)}\n\n`;
    
    text += "\n" + "=".repeat(70) + "\n";
    text += "CROSS-PHASE CONTEXT (PASS 1: COHERENCE MAPPING)\n";
    text += "=".repeat(70) + "\n\n";
    text += `${result.cross_phase_context}\n\n`;
    
    text += "\n" + "=".repeat(70) + "\n";
    text += "CONTINUITY ANALYSIS (PASS 2: CONTINUITY DIAGNOSTICS)\n";
    text += "=".repeat(70) + "\n\n";
    Object.entries(result.continuity_analysis).forEach(([key, value]) => {
      text += `${key}:\n${JSON.stringify(value, null, 2)}\n\n`;
    });
    
    text += "\n" + "=".repeat(70) + "\n";
    text += "CONFLICT NODES\n";
    text += "=".repeat(70) + "\n\n";
    if (result.conflict_nodes.length === 0) {
      text += "No conflicts detected.\n\n";
    } else {
      result.conflict_nodes.forEach((node, idx) => {
        text += `Conflict ${idx + 1}:\n`;
        text += `  Type: ${node.conflict_type}\n`;
        text += `  Severity: ${node.severity}\n`;
        text += `  Description: ${node.description}\n\n`;
      });
    }
    
    text += "\n" + "=".repeat(70) + "\n";
    text += "CONTINUITY-ALIGNED REWRITE (PASS 3: CONTINUITY REWRITE)\n";
    text += "=".repeat(70) + "\n\n";
    text += `${result.continuity_aligned_rewrite}\n\n`;
    
    text += "\n" + "=".repeat(70) + "\n";
    text += "DIAGNOSTIC METRICS\n";
    text += "=".repeat(70) + "\n\n";
    text += `Cross-Phase Coherence:     ${result.diagnostics.CrossPhaseCoherence.toFixed(3)} - Truth consistency across passages\n`;
    text += `Temporal Stability:        ${result.diagnostics.TemporalStability.toFixed(3)} - Claim stability over time\n`;
    text += `Progressive Integration:   ${result.diagnostics.ProgressiveIntegration.toFixed(3)} - New insights building on prior knowledge\n`;
    text += `Error Propagation Index:   ${result.diagnostics.ErrorPropagationIndex.toFixed(3)} - Inherited contradictions (lower is better)\n`;
    text += `Systemic Compression:      ${result.diagnostics.SystemicCompression.toFixed(3)} - Unified understanding density\n`;
    text += `Continuity Composite:      ${result.diagnostics.ContinuityComposite.toFixed(3)} - Overall continuity score\n\n`;
    
    text += "\n" + "=".repeat(70) + "\n";
    text += "INTERPRETATION SUMMARY\n";
    text += "=".repeat(70) + "\n\n";
    text += `${result.interpretation_summary}\n\n`;
    
    text += "\n" + "=".repeat(70) + "\n";
    text += "SCORING CALIBRATION GUIDE\n";
    text += "=".repeat(70) + "\n";
    text += "Composite < 0.50:    High contradiction, fragmented knowledge state\n";
    text += "Composite 0.50-0.79: Partial coherence with some conflicts or gaps\n";
    text += "Composite ≥ 0.80:    Strong continuity with minimal contradictions\n\n";
    
    text += "\n" + "=".repeat(70) + "\n";
    text += `Generated: ${new Date().toLocaleString()}\n`;
    
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cognitive-continuity-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getContinuityStatus = () => {
    const score = result.diagnostics.ContinuityComposite;
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
        label: "Partial Continuity",
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

  const status = getContinuityStatus();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button 
          onClick={downloadAsText} 
          variant="outline" 
          size="sm"
          data-testid="button-download-txt"
        >
          <Download className="h-4 w-4 mr-2" />
          Download as TXT
        </Button>
      </div>

      <Card className={status.bgColor}>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-6 w-6 ${status.color}`} data-testid="icon-continuity-status" />
              <div>
                <CardTitle className="text-xl">Cognitive Continuity Classification</CardTitle>
                <CardDescription className="mt-1">{status.label}</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Continuity Composite</div>
              <div className={`text-3xl font-bold ${status.color}`} data-testid="text-continuity-composite">
                {result.diagnostics.ContinuityComposite.toFixed(3)}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pass 1: Cross-Phase Context</CardTitle>
          <CardDescription>Coherence mapping across epistemic corpus</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed" data-testid="text-cross-phase-context">
            {result.cross_phase_context}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pass 2: Continuity Analysis</CardTitle>
          <CardDescription>Detailed coherence structure and conflict detection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(result.continuity_analysis).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <div className="text-sm font-medium text-foreground">{key}</div>
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md font-mono text-xs overflow-x-auto" data-testid={`text-continuity-analysis-${key}`}>
                  <pre className="whitespace-pre-wrap">{JSON.stringify(value, null, 2)}</pre>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Conflict Nodes</CardTitle>
          </div>
          <CardDescription>Detected contradictions and coherence breaks</CardDescription>
        </CardHeader>
        <CardContent>
          {result.conflict_nodes.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid="text-no-conflicts">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              No conflicts detected
            </div>
          ) : (
            <div className="space-y-4">
              {result.conflict_nodes.map((node, idx) => (
                <div key={idx} className="space-y-2 p-4 bg-muted rounded-lg" data-testid={`conflict-node-${idx}`}>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" data-testid={`badge-conflict-type-${idx}`}>{node.conflict_type}</Badge>
                      <Badge 
                        variant={node.severity === "high" ? "destructive" : node.severity === "medium" ? "default" : "secondary"}
                        data-testid={`badge-conflict-severity-${idx}`}
                      >
                        {node.severity}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed" data-testid={`text-conflict-description-${idx}`}>
                    {node.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pass 3: Continuity-Aligned Rewrite</CardTitle>
          <CardDescription>Truth-coherent reconstruction with conflict resolution</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed" data-testid="text-continuity-rewrite">
              {result.continuity_aligned_rewrite}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diagnostic Metrics</CardTitle>
          <CardDescription>Quantitative continuity scoring (0-1 normalized)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Cross-Phase Coherence</span>
              <span className="text-sm text-muted-foreground" data-testid="text-crossphasecoherence">
                {result.diagnostics.CrossPhaseCoherence.toFixed(3)}
              </span>
            </div>
            <Progress value={result.diagnostics.CrossPhaseCoherence * 100} data-testid="progress-crossphasecoherence" />
            <p className="text-xs text-muted-foreground">Truth consistency across passages and temporal phases</p>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Temporal Stability</span>
              <span className="text-sm text-muted-foreground" data-testid="text-temporalstability">
                {result.diagnostics.TemporalStability.toFixed(3)}
              </span>
            </div>
            <Progress value={result.diagnostics.TemporalStability * 100} data-testid="progress-temporalstability" />
            <p className="text-xs text-muted-foreground">Consistency of claims over time without arbitrary revision</p>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progressive Integration</span>
              <span className="text-sm text-muted-foreground" data-testid="text-progressiveintegration">
                {result.diagnostics.ProgressiveIntegration.toFixed(3)}
              </span>
            </div>
            <Progress value={result.diagnostics.ProgressiveIntegration * 100} data-testid="progress-progressiveintegration" />
            <p className="text-xs text-muted-foreground">New insights building coherently on prior knowledge</p>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Error Propagation Index</span>
              <span className="text-sm text-muted-foreground" data-testid="text-errorpropagationindex">
                {result.diagnostics.ErrorPropagationIndex.toFixed(3)}
              </span>
            </div>
            <Progress value={result.diagnostics.ErrorPropagationIndex * 100} data-testid="progress-errorpropagationindex" />
            <p className="text-xs text-muted-foreground">Inherited contradictions or cascading errors (INVERSE - lower is better)</p>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Systemic Compression</span>
              <span className="text-sm text-muted-foreground" data-testid="text-systemiccompression">
                {result.diagnostics.SystemicCompression.toFixed(3)}
              </span>
            </div>
            <Progress value={result.diagnostics.SystemicCompression * 100} data-testid="progress-systemiccompression" />
            <p className="text-xs text-muted-foreground">Unified understanding density across knowledge corpus</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Interpretation Summary</CardTitle>
          <CardDescription>Analysis of coherence patterns and continuity achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed" data-testid="text-interpretation-summary">
            {result.interpretation_summary}
          </p>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Scoring Calibration Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="font-medium text-red-600 dark:text-red-400 min-w-24">&lt; 0.50:</span>
            <span className="text-muted-foreground">High contradiction, fragmented knowledge state with incompatible claims</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium text-yellow-600 dark:text-yellow-400 min-w-24">0.50 - 0.79:</span>
            <span className="text-muted-foreground">Partial coherence with some conflicts, temporal drift, or integration gaps</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium text-green-600 dark:text-green-400 min-w-24">≥ 0.80:</span>
            <span className="text-muted-foreground">Strong continuity with minimal contradictions and progressive knowledge building</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
