import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Download, AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import type { CognitiveIntegrityResult } from "@shared/schema";

interface CognitiveIntegrityResultsProps {
  result: CognitiveIntegrityResult;
}

export function CognitiveIntegrityResults({ result }: CognitiveIntegrityResultsProps) {
  const downloadAsText = () => {
    let text = "COGNITIVE INTEGRITY LAYER ANALYSIS\n";
    text += "=" + "=".repeat(70) + "\n\n";
    
    text += "INTEGRITY CLASSIFICATION\n";
    text += "-".repeat(70) + "\n";
    text += `Type: ${result.diagnostic_block.IntegrityType}\n`;
    text += `Composite Score: ${result.diagnostic_block.CompositeScore.toFixed(3)}\n\n`;
    
    text += "\n" + "=".repeat(70) + "\n";
    text += "AUTHENTICITY COMMENTARY (PASS 1: SIMULATION DETECTION)\n";
    text += "=".repeat(70) + "\n\n";
    text += `${result.authenticity_commentary}\n\n`;
    
    text += "\n" + "=".repeat(70) + "\n";
    text += "RECONSTRUCTED PASSAGE (PASS 2: INFERENTIAL RECONSTRUCTION)\n";
    text += "=".repeat(70) + "\n\n";
    text += `${result.reconstructed_passage}\n\n`;
    
    text += "\n" + "=".repeat(70) + "\n";
    text += "DIAGNOSTIC METRICS (PASS 3: INTEGRITY SCORING)\n";
    text += "=".repeat(70) + "\n\n";
    text += `Reality Anchor:    ${result.diagnostic_block.RealityAnchor.toFixed(3)} - Groundedness in observable phenomena\n`;
    text += `Causal Depth:      ${result.diagnostic_block.CausalDepth.toFixed(3)} - Extent of causal mechanism explanation\n`;
    text += `Friction:          ${result.diagnostic_block.Friction.toFixed(3)} - Resistance to falsification; precision\n`;
    text += `Compression:       ${result.diagnostic_block.Compression.toFixed(3)} - Information density; insight-per-word\n`;
    text += `Simulation Index:  ${result.diagnostic_block.SimulationIndex.toFixed(3)} - Rhetorical performance (lower is better)\n`;
    text += `Level Coherence:   ${result.diagnostic_block.LevelCoherence.toFixed(3)} - Internal logical consistency\n`;
    text += `Composite Score:   ${result.diagnostic_block.CompositeScore.toFixed(3)} - Overall cognitive integrity\n\n`;
    
    text += "\n" + "=".repeat(70) + "\n";
    text += "INTERPRETATION SUMMARY\n";
    text += "=".repeat(70) + "\n\n";
    text += `${result.interpretation_summary}\n\n`;
    
    text += "\n" + "=".repeat(70) + "\n";
    text += "SCORING CALIBRATION GUIDE\n";
    text += "=".repeat(70) + "\n";
    text += "Composite < 0.50:    Heavy simulation, minimal genuine reasoning\n";
    text += "Composite 0.50-0.79: Authentic partial reasoning with some issues\n";
    text += "Composite ≥ 0.80:    High-integrity source with demonstrative reasoning\n\n";
    
    text += "\n" + "=".repeat(70) + "\n";
    text += `Generated: ${new Date().toLocaleString()}\n`;
    
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cognitive-integrity-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Determine integrity status icon and color
  const getIntegrityStatus = () => {
    const score = result.diagnostic_block.CompositeScore;
    if (score >= 0.80) {
      return {
        icon: CheckCircle,
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-50 dark:bg-green-950/30",
        label: "High Integrity",
      };
    } else if (score >= 0.50) {
      return {
        icon: AlertTriangle,
        color: "text-yellow-600 dark:text-yellow-400",
        bgColor: "bg-yellow-50 dark:bg-yellow-950/30",
        label: "Partial Integrity",
      };
    } else {
      return {
        icon: AlertCircle,
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-50 dark:bg-red-950/30",
        label: "Low Integrity",
      };
    }
  };

  const status = getIntegrityStatus();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Download Button */}
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

      {/* Integrity Status Card */}
      <Card className={status.bgColor}>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <StatusIcon className={`h-6 w-6 ${status.color}`} data-testid="icon-integrity-status" />
              <div>
                <CardTitle className="text-xl">Cognitive Integrity Classification</CardTitle>
                <CardDescription className="mt-1">{result.diagnostic_block.IntegrityType}</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Composite Score</div>
              <div className={`text-3xl font-bold ${status.color}`} data-testid="text-composite-score">
                {result.diagnostic_block.CompositeScore.toFixed(3)}
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Authenticity Commentary */}
      <Card>
        <CardHeader>
          <CardTitle>Pass 1: Authenticity Commentary</CardTitle>
          <CardDescription>Simulation detection and reasoning classification</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed" data-testid="text-authenticity-commentary">
            {result.authenticity_commentary}
          </p>
        </CardContent>
      </Card>

      {/* Reconstructed Passage */}
      <Card>
        <CardHeader>
          <CardTitle>Pass 2: Reconstructed Passage</CardTitle>
          <CardDescription>Truth-bearing rewrite with explicit inferential steps</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed" data-testid="text-reconstructed-passage">
              {result.reconstructed_passage}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Diagnostic Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Pass 3: Diagnostic Metrics</CardTitle>
          <CardDescription>Quantitative integrity scoring (0-1 normalized)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Reality Anchor */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Reality Anchor</span>
              <span className="text-sm text-muted-foreground" data-testid="text-realityanchor">
                {result.diagnostic_block.RealityAnchor.toFixed(3)}
              </span>
            </div>
            <Progress value={result.diagnostic_block.RealityAnchor * 100} data-testid="progress-realityanchor" />
            <p className="text-xs text-muted-foreground">Groundedness in observable phenomena vs abstract generalization</p>
          </div>

          <Separator />

          {/* Causal Depth */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Causal Depth</span>
              <span className="text-sm text-muted-foreground" data-testid="text-causaldepth">
                {result.diagnostic_block.CausalDepth.toFixed(3)}
              </span>
            </div>
            <Progress value={result.diagnostic_block.CausalDepth * 100} data-testid="progress-causaldepth" />
            <p className="text-xs text-muted-foreground">Extent of causal mechanism explanation vs surface correlation</p>
          </div>

          <Separator />

          {/* Friction */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Friction</span>
              <span className="text-sm text-muted-foreground" data-testid="text-friction">
                {result.diagnostic_block.Friction.toFixed(3)}
              </span>
            </div>
            <Progress value={result.diagnostic_block.Friction * 100} data-testid="progress-friction" />
            <p className="text-xs text-muted-foreground">Resistance to easy falsification; conceptual precision vs vagueness</p>
          </div>

          <Separator />

          {/* Compression */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Compression</span>
              <span className="text-sm text-muted-foreground" data-testid="text-compression">
                {result.diagnostic_block.Compression.toFixed(3)}
              </span>
            </div>
            <Progress value={result.diagnostic_block.Compression * 100} data-testid="progress-compression" />
            <p className="text-xs text-muted-foreground">Information density; insight-per-word ratio</p>
          </div>

          <Separator />

          {/* Simulation Index */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Simulation Index</span>
              <span className="text-sm text-muted-foreground" data-testid="text-simulationindex">
                {result.diagnostic_block.SimulationIndex.toFixed(3)}
              </span>
            </div>
            <Progress value={result.diagnostic_block.SimulationIndex * 100} data-testid="progress-simulationindex" />
            <p className="text-xs text-muted-foreground">Degree of rhetorical performance (INVERSE - lower is better)</p>
          </div>

          <Separator />

          {/* Level Coherence */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Level Coherence</span>
              <span className="text-sm text-muted-foreground" data-testid="text-levelcoherence">
                {result.diagnostic_block.LevelCoherence.toFixed(3)}
              </span>
            </div>
            <Progress value={result.diagnostic_block.LevelCoherence * 100} data-testid="progress-levelcoherence" />
            <p className="text-xs text-muted-foreground">Internal logical consistency across inferential levels</p>
          </div>
        </CardContent>
      </Card>

      {/* Interpretation Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Interpretation Summary</CardTitle>
          <CardDescription>Analysis of corrections and reconstruction achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed" data-testid="text-interpretation-summary">
            {result.interpretation_summary}
          </p>
        </CardContent>
      </Card>

      {/* Calibration Guide */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-base">Scoring Calibration Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <span className="font-medium text-red-600 dark:text-red-400 min-w-24">&lt; 0.50:</span>
            <span className="text-muted-foreground">Heavy simulation, minimal genuine reasoning</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium text-yellow-600 dark:text-yellow-400 min-w-24">0.50 - 0.79:</span>
            <span className="text-muted-foreground">Authentic partial reasoning with some inflation or missing mechanisms</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="font-medium text-green-600 dark:text-green-400 min-w-24">≥ 0.80:</span>
            <span className="text-muted-foreground">High-integrity source with demonstrative reasoning and causal clarity</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
