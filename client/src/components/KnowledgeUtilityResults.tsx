import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Lightbulb, TrendingUp, BookOpen, Wrench, Brain, Download } from "lucide-react";
import { useState } from "react";
import type { KnowledgeUtilityResult, UtilityType } from "@shared/schema";

interface KnowledgeUtilityResultsProps {
  result: KnowledgeUtilityResult;
}

const utilityIcons: Record<UtilityType, typeof Lightbulb> = {
  "explanatory": Lightbulb,
  "predictive": TrendingUp,
  "prescriptive": BookOpen,
  "methodological": Wrench,
  "philosophical-epistemic": Brain,
};

const utilityColors: Record<UtilityType, string> = {
  "explanatory": "text-blue-600 dark:text-blue-400",
  "predictive": "text-emerald-600 dark:text-emerald-400",
  "prescriptive": "text-purple-600 dark:text-purple-400",
  "methodological": "text-amber-600 dark:text-amber-400",
  "philosophical-epistemic": "text-pink-600 dark:text-pink-400",
};

export function KnowledgeUtilityResults({ result }: KnowledgeUtilityResultsProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    knowledge: true,
    utility: true,
    rewrite: true,
    judgment: true,
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const utilityPercentage = (result.utilityRank / 10) * 100;

  const downloadAsText = () => {
    let text = "KNOWLEDGE-TO-UTILITY MAPPER ANALYSIS\n";
    text += "=" + "=".repeat(50) + "\n\n";
    
    text += "UTILITY ASSESSMENT\n";
    text += "-".repeat(50) + "\n";
    text += `Utility Rank: ${result.utilityRank.toFixed(1)} / 10\n\n`;
    
    text += "\n" + "=".repeat(50) + "\n";
    text += "OPERATIVE KNOWLEDGE\n";
    text += "=".repeat(50) + "\n\n";
    
    result.operativeKnowledge.forEach((knowledge, idx) => {
      text += `${idx + 1}. ${knowledge}\n`;
    });
    text += "\n";
    
    text += "\n" + "=".repeat(50) + "\n";
    text += "UTILITY MAPPINGS\n";
    text += "=".repeat(50) + "\n\n";
    
    result.utilityMappings.forEach((mapping, idx) => {
      text += `--- Mapping ${idx + 1} ---\n`;
      text += `Type: ${mapping.type}\n`;
      text += `Derived Utility: ${mapping.derivedUtility}\n`;
      text += `Description: ${mapping.description}\n\n`;
    });
    
    text += "\n" + "=".repeat(50) + "\n";
    text += "UTILITY AUGMENTED REWRITE\n";
    text += "=".repeat(50) + "\n\n";
    text += `${result.utilityAugmentedRewrite}\n\n`;
    
    text += "\n" + "=".repeat(50) + "\n";
    text += "JUDGMENT REPORT\n";
    text += "=".repeat(50) + "\n\n";
    text += `Breadth: ${result.judgmentReport.breadth}\n`;
    text += `Depth: ${result.judgmentReport.depth}\n`;
    text += `Transformative Potential: ${result.judgmentReport.transformativePotential}\n\n`;
    if (result.judgmentReport.limitations && result.judgmentReport.limitations.length > 0) {
      text += "Limitations:\n";
      result.judgmentReport.limitations.forEach((limitation, i) => {
        text += `  ${i + 1}. ${limitation}\n`;
      });
      text += "\n";
    }
    
    text += "\n" + "=".repeat(50) + "\n";
    text += `Generated: ${new Date().toLocaleString()}\n`;
    
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `knowledge-utility-mapper-${Date.now()}.txt`;
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
      {/* Utility Rank */}
      <Card>
        <CardHeader>
          <CardTitle>Utility Assessment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Utility Rank</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                {result.utilityRank.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">/ 10</span>
            </div>
          </div>
          <Progress value={utilityPercentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Operative Knowledge */}
      <Card>
        <Collapsible open={openSections.knowledge} onOpenChange={() => toggleSection('knowledge')}>
          <CardHeader className="cursor-pointer hover-elevate" onClick={() => toggleSection('knowledge')}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle>Operative Knowledge Extracted</CardTitle>
                  <CardDescription>Core insights and principles identified</CardDescription>
                </div>
                {openSections.knowledge ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent data-testid="knowledge-section">
              <ul className="space-y-2">
                {result.operativeKnowledge.map((knowledge, idx) => (
                  <li key={idx} className="text-sm leading-relaxed list-disc ml-4">
                    {knowledge}
                  </li>
                ))}
              </ul>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Utility Mappings */}
      <Card>
        <Collapsible open={openSections.utility} onOpenChange={() => toggleSection('utility')}>
          <CardHeader className="cursor-pointer hover-elevate" onClick={() => toggleSection('utility')}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Utility Mapping
                    <Badge variant="secondary">{result.utilityMappings.length} dimension{result.utilityMappings.length !== 1 ? 's' : ''}</Badge>
                  </CardTitle>
                  <CardDescription>How this knowledge can be applied</CardDescription>
                </div>
                {openSections.utility ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4" data-testid="utility-section">
              {result.utilityMappings.map((mapping, idx) => {
                const Icon = utilityIcons[mapping.type];
                const color = utilityColors[mapping.type];
                
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Icon className={`h-5 w-5 ${color}`} />
                      <Badge variant="outline" className="capitalize">
                        {mapping.type.replace(/-/g, ' ')}
                      </Badge>
                    </div>
                    <div className="space-y-1 pl-7">
                      <div className="text-sm font-medium text-foreground">
                        {mapping.derivedUtility}
                      </div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {mapping.description}
                      </div>
                    </div>
                    {idx < result.utilityMappings.length - 1 && <Separator className="my-3" />}
                  </div>
                );
              })}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Utility-Augmented Rewrite */}
      <Card>
        <Collapsible open={openSections.rewrite} onOpenChange={() => toggleSection('rewrite')}>
          <CardHeader className="cursor-pointer hover-elevate" onClick={() => toggleSection('rewrite')}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between w-full">
                <div>
                  <CardTitle>Utility-Augmented Rewrite</CardTitle>
                  <CardDescription>Text reframed to highlight practical value</CardDescription>
                </div>
                {openSections.rewrite ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent data-testid="rewrite-section">
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <p className="text-base leading-relaxed font-serif whitespace-pre-wrap">
                  {result.utilityAugmentedRewrite}
                </p>
              </div>
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
                  <CardDescription>Assessment of breadth, depth, and transformative potential</CardDescription>
                </div>
                {openSections.judgment ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="space-y-4" data-testid="judgment-section">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground">Breadth</div>
                  <div className="text-sm text-muted-foreground">{result.judgmentReport.breadth}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium text-foreground">Depth</div>
                  <div className="text-sm text-muted-foreground">{result.judgmentReport.depth}</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-sm font-medium text-foreground">Transformative Potential</div>
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {result.judgmentReport.transformativePotential}
                </div>
              </div>

              {result.judgmentReport.limitations.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">Limitations</div>
                  <ul className="pl-4 space-y-1">
                    {result.judgmentReport.limitations.map((limitation, i) => (
                      <li key={i} className="text-sm text-muted-foreground list-disc ml-4">
                        {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </div>
  );
}
