import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CoherenceScore } from "./CoherenceScore";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, AlertTriangle, Download } from "lucide-react";
import { useState } from "react";
import type { JustificationBuilderResult } from "@shared/schema";

interface JustificationBuilderResultsProps {
  result: JustificationBuilderResult;
}

export function JustificationBuilderResults({ result }: JustificationBuilderResultsProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    claims: true,
    justifications: true,
    judgment: true,
    rewrite: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const underdevelopedClaims = result.detectedClaims.filter(c => c.isUnderdeveloped);

  const downloadAsText = () => {
    let text = "JUSTIFICATION BUILDER ANALYSIS\n";
    text += "=" + "=".repeat(50) + "\n\n";
    
    text += "ANALYSIS SUMMARY\n";
    text += "-".repeat(50) + "\n";
    text += `Total Claims Detected: ${result.detectedClaims.length}\n`;
    text += `Underdeveloped Claims: ${underdevelopedClaims.length}\n`;
    text += `Coherence Score: ${result.coherenceScore.toFixed(2)}\n\n`;
    
    text += "Detected Claims:\n";
    result.detectedClaims.forEach((claim, i) => {
      text += `  ${i + 1}. ${claim.claim}`;
      if (claim.isUnderdeveloped) {
        text += " [UNDERDEVELOPED]";
      }
      text += "\n";
    });
    text += "\n";
    
    text += "\n" + "=".repeat(50) + "\n";
    text += "RECONSTRUCTED JUSTIFICATION CHAINS\n";
    text += "=".repeat(50) + "\n\n";
    
    result.justificationChains.forEach((chain, idx) => {
      text += `--- Chain ${idx + 1} ---\n\n`;
      text += `Claim: ${chain.claim}\n\n`;
      text += "Bridging Premises:\n";
      chain.premises.forEach((premise, i) => {
        text += `  ${i + 1}. ${premise}\n`;
      });
      text += `\nConclusion: ${chain.conclusion}\n`;
      text += `Evidence Type: ${chain.evidenceType}\n\n`;
    });
    
    text += "\n" + "=".repeat(50) + "\n";
    text += "ASSESSMENT\n";
    text += "=".repeat(50) + "\n\n";
    text += `Completeness: ${result.completeness}\n\n`;
    
    if (result.weaknesses && result.weaknesses.length > 0) {
      text += "Identified Weaknesses:\n";
      result.weaknesses.forEach((weakness, i) => {
        text += `  ${i + 1}. ${weakness}\n`;
      });
      text += "\n";
    }
    
    text += "\n" + "=".repeat(50) + "\n";
    text += "IMPROVED REWRITE\n";
    text += "=".repeat(50) + "\n\n";
    text += `${result.rewrittenText}\n\n`;
    
    text += "\n" + "=".repeat(50) + "\n";
    text += `Generated: ${new Date().toLocaleString()}\n`;
    
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `justification-builder-${Date.now()}.txt`;
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
      {/* Analysis Summary */}
      <Card>
        <Collapsible open={openSections.claims} onOpenChange={() => toggleSection('claims')}>
          <CardHeader className="cursor-pointer hover-elevate" onClick={() => toggleSection('claims')}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Analysis Summary
                    <Badge variant="secondary">{underdevelopedClaims.length} underdeveloped claim{underdevelopedClaims.length !== 1 ? 's' : ''}</Badge>
                  </CardTitle>
                  <CardDescription>Detected claims and missing links</CardDescription>
                </div>
                {openSections.claims ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-3" data-testid="claims-section">
              {result.detectedClaims.map((claim, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  {claim.isUnderdeveloped && (
                    <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-sm leading-relaxed">
                      {claim.claim}
                    </p>
                    {claim.isUnderdeveloped && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        Missing justification
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Reconstructed Justifications */}
      <Card>
        <Collapsible open={openSections.justifications} onOpenChange={() => toggleSection('justifications')}>
          <CardHeader className="cursor-pointer hover-elevate" onClick={() => toggleSection('justifications')}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle>Reconstructed Justifications</CardTitle>
                  <CardDescription>Built inferential chains with premises and conclusions</CardDescription>
                </div>
                {openSections.justifications ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-6" data-testid="justifications-section">
              {result.justificationChains.map((chain, idx) => (
                <div key={idx} className="space-y-3">
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-foreground">Claim</div>
                    <div className="pl-4 border-l-2 border-primary text-sm leading-relaxed">
                      {chain.claim}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-foreground">
                      Constructed Premises
                      <Badge variant="outline" className="ml-2 text-xs font-mono">
                        {chain.evidenceType}
                      </Badge>
                    </div>
                    <ul className="pl-4 space-y-1">
                      {chain.premises.map((premise, i) => (
                        <li key={i} className="text-sm leading-relaxed list-decimal ml-4">
                          {premise}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm font-medium text-foreground">Conclusion</div>
                    <div className="pl-4 border-l-2 border-chart-1 text-sm leading-relaxed">
                      {chain.conclusion}
                    </div>
                  </div>

                  {idx < result.justificationChains.length - 1 && <Separator className="my-4" />}
                </div>
              ))}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Judgment Report */}
      <Card>
        <Collapsible open={openSections.judgment} onOpenChange={() => toggleSection('judgment')}>
          <CardHeader className="cursor-pointer hover-elevate" onClick={() => toggleSection('judgment')}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle>Judgment Report</CardTitle>
                  <CardDescription>Coherence, completeness, and weaknesses</CardDescription>
                </div>
                {openSections.judgment ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4" data-testid="judgment-section">
              <CoherenceScore score={result.coherenceScore} />

              <div className="space-y-1">
                <div className="text-sm font-medium text-foreground">Completeness Assessment</div>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {result.completeness}
                </div>
              </div>

              {result.weaknesses.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">Identified Weaknesses</div>
                  <ul className="pl-4 space-y-1">
                    {result.weaknesses.map((weakness, i) => (
                      <li key={i} className="text-sm text-muted-foreground list-disc ml-4">
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Rewritten Text */}
      <Card>
        <Collapsible open={openSections.rewrite} onOpenChange={() => toggleSection('rewrite')}>
          <CardHeader className="cursor-pointer hover-elevate" onClick={() => toggleSection('rewrite')}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle>Fully Justified Rewrite</CardTitle>
                  <CardDescription>Explicit version with all assumptions surfaced</CardDescription>
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
