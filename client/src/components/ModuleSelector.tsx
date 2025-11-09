import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Wrench, Map, Shield, GitBranch } from "lucide-react";
import type { ModuleType } from "@shared/schema";

interface ModuleSelectorProps {
  selectedModule: ModuleType;
  onModuleChange: (module: ModuleType) => void;
}

export function ModuleSelector({ selectedModule, onModuleChange }: ModuleSelectorProps) {
  return (
    <Tabs value={selectedModule} onValueChange={(value) => onModuleChange(value as ModuleType)} className="w-full">
      <TabsList className="grid w-full grid-cols-5 h-auto">
        <TabsTrigger 
          value="epistemic-inference" 
          className="flex flex-col items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          data-testid="tab-epistemic-inference"
        >
          <FileText className="h-5 w-5" />
          <div className="text-center">
            <div className="font-semibold text-sm">Epistemic Inference</div>
            <div className="text-xs opacity-80 mt-0.5">Analyze • Judge • Rewrite</div>
          </div>
        </TabsTrigger>
        <TabsTrigger 
          value="justification-builder" 
          className="flex flex-col items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          data-testid="tab-justification-builder"
        >
          <Wrench className="h-5 w-5" />
          <div className="text-center">
            <div className="font-semibold text-sm">Justification Builder</div>
            <div className="text-xs opacity-80 mt-0.5">Build Missing Links</div>
          </div>
        </TabsTrigger>
        <TabsTrigger 
          value="knowledge-utility-mapper" 
          className="flex flex-col items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          data-testid="tab-knowledge-utility-mapper"
        >
          <Map className="h-5 w-5" />
          <div className="text-center">
            <div className="font-semibold text-sm">Knowledge-to-Utility</div>
            <div className="text-xs opacity-80 mt-0.5">Extract Value</div>
          </div>
        </TabsTrigger>
        <TabsTrigger 
          value="cognitive-integrity" 
          className="flex flex-col items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          data-testid="tab-cognitive-integrity"
        >
          <Shield className="h-5 w-5" />
          <div className="text-center">
            <div className="font-semibold text-sm">Cognitive Integrity</div>
            <div className="text-xs opacity-80 mt-0.5">Detect • Reconstruct • Score</div>
          </div>
        </TabsTrigger>
        <TabsTrigger 
          value="cognitive-continuity" 
          className="flex flex-col items-center gap-2 py-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          data-testid="tab-cognitive-continuity"
        >
          <GitBranch className="h-5 w-5" />
          <div className="text-center">
            <div className="font-semibold text-sm">Cognitive Continuity</div>
            <div className="text-xs opacity-80 mt-0.5">Map • Detect • Harmonize</div>
          </div>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
