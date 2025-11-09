import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CoherenceScore } from "./CoherenceScore";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import { useState } from "react";
import type { EpistemicInferenceResult } from "@shared/schema";

interface EpistemicInferenceResultsProps {
  result: EpistemicInferenceResult;
}

export function EpistemicInferenceResults({ result }: EpistemicInferenceResultsProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    analysis: true,
    judgment: true,
    rewrite: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const downloadAsText = () => {
    let text = "EPISTEMIC INFERENCE ANALYSIS\n";
    text += "=" + "=".repeat(50) + "\n\n";
    
    text += "OVERALL ASSESSMENT\n";
    text += "-".repeat(50) + "\n";
    text += `Overall Coherence Score: ${result.overallCoherence.toFixed(2)}\n\n`;
    if (result.metaJudgment) {
      text += `Meta-Judgment:\n${result.metaJudgment}\n\n`;
    }
    
    text += "\n" + "=".repeat(50) + "\n";
    text += "LAYER 1: ANALYSIS OF JUSTIFICATORY STRUCTURE\n";
    text += "=".repeat(50) + "\n\n";
    
    result.arguments.forEach((arg, idx) => {
      if (result.arguments.length > 1) {
        text += `--- Argument ${idx + 1} ---\n\n`;
      }
      
      text += `Core Claim (Conclusion):\n${arg.coreClaim}\n\n`;
      
      if (arg.explicitPremises && arg.explicitPremises.length > 0) {
        text += "Explicit Premises:\n";
        arg.explicitPremises.forEach((premise, i) => {
          text += `  ${i + 1}. ${premise}\n`;
        });
        text += "\n";
      }
      
      if (arg.hiddenPremises && arg.hiddenPremises.length > 0) {
        text += "Hidden Premises (Inferred):\n";
        arg.hiddenPremises.forEach((premise, i) => {
          text += `  ${i + 1}. ${premise}\n`;
        });
        text += "\n";
      }
      
      text += `Inference Type: ${arg.inferenceType}\n\n`;
    });
    
    text += "\n" + "=".repeat(50) + "\n";
    text += "LAYER 2: CRITICAL JUDGMENT\n";
    text += "=".repeat(50) + "\n\n";
    text += `Coherence Score: ${result.judgment.coherenceScore.toFixed(2)}\n`;
    text += `Reasoning Type: ${result.judgment.reasoningType}\n`;
    text += `Logical Soundness: ${result.judgment.logicalSoundness}\n`;
    text += `Conceptual Completeness: ${result.judgment.conceptualCompleteness}\n\n`;
    if (result.judgment.issues && result.judgment.issues.length > 0) {
      text += "Issues Identified:\n";
      result.judgment.issues.forEach((issue, i) => {
        text += `  ${i + 1}. ${issue}\n`;
      });
      text += "\n";
    }
    
    text += "\n" + "=".repeat(50) + "\n";
    text += "LAYER 3: EPISTEMICALLY OPTIMIZED REWRITE\n";
    text += "=".repeat(50) + "\n\n";
    text += `${result.rewrittenText}\n\n`;
    
    text += "\n" + "=".repeat(50) + "\n";
    text += `Generated: ${new Date().toLocaleString()}\n`;
    
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `epistemic-analysis-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
      {/* Overall Coherence */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <CoherenceScore score={result.overallCoherence} label="Overall Coherence" />
          {result.metaJudgment && (
            <div className="pt-2">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {result.metaJudgment}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Layer 1: Analysis */}
      <Card>
        <Collapsible open={openSections.analysis} onOpenChange={() => toggleSection('analysis')}>
          <CardHeader className="cursor-pointer hover-elevate" onClick={() => toggleSection('analysis')}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Layer 1: Analysis of Justificatory Structure
                    <Badge variant="secondary">{result.arguments.length} argument{result.arguments.length !== 1 ? 's' : ''}</Badge>
                  </CardTitle>
                  <CardDescription>Premises, conclusions, and inferential relations</CardDescription>
                </div>
                {openSections.analysis ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6" data-testid="analysis-section">
              {result.arguments.map((arg, idx) => (
                <div key={arg.id} className="space-y-3">
                  {result.arguments.length > 1 && (
                    <div className="font-semibold text-sm text-primary">
                      Argument {idx + 1}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-foreground">Core Claim (Conclusion)</div>
                    <div className="pl-4 border-l-2 border-primary text-sm leading-relaxed">
                      {arg.coreClaim}
                    </div>
                  </div>

                  {arg.explicitPremises.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">Explicit Premises</div>
                      <ul className="pl-4 space-y-1">
                        {arg.explicitPremises.map((premise, i) => (
                          <li key={i} className="text-sm leading-relaxed list-disc ml-4">
                            {premise}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {arg.hiddenPremises.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">Hidden Premises (Inferred)</div>
                      <ul className="pl-4 space-y-1">
                        {arg.hiddenPremises.map((premise, i) => (
                          <li key={i} className="text-sm leading-relaxed text-muted-foreground list-disc ml-4">
                            {premise}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="pt-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {arg.inferenceType}
                    </Badge>
                  </div>

                  {idx < result.arguments.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Layer 2: Judgment */}
      <Card>
        <Collapsible open={openSections.judgment} onOpenChange={() => toggleSection('judgment')}>
          <CardHeader className="cursor-pointer hover-elevate" onClick={() => toggleSection('judgment')}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle>Layer 2: Judgment about Structure</CardTitle>
                  <CardDescription>Evaluation of validity, coherence, and precision</CardDescription>
                </div>
                {openSections.judgment ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4" data-testid="judgment-section">
              <CoherenceScore score={result.judgment.coherenceScore} />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground">Reasoning Type</div>
                  <div className="text-sm text-muted-foreground">{result.judgment.reasoningType}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground">Logical Soundness</div>
                  <div className="text-sm text-muted-foreground">{result.judgment.logicalSoundness}</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-foreground">Conceptual Completeness</div>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {result.judgment.conceptualCompleteness}
                </div>
              </div>

              {result.judgment.issues.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">Issues Identified</div>
                  <ul className="pl-4 space-y-1">
                    {result.judgment.issues.map((issue, i) => (
                      <li key={i} className="text-sm text-muted-foreground list-disc ml-4">
                        {issue}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Layer 3: Rewrite */}
      <Card>
        <Collapsible open={openSections.rewrite} onOpenChange={() => toggleSection('rewrite')}>
          <CardHeader className="cursor-pointer hover-elevate" onClick={() => toggleSection('rewrite')}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle>Layer 3: Rewrite</CardTitle>
                  <CardDescription>Clarified, conceptually explicit version</CardDescription>
                </div>
                {openSections.rewrite ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent data-testid="rewrite-section">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-base leading-relaxed font-serif whitespace-pre-wrap">
                  {result.rewrittenText}
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
