import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import type { AnalysisHistoryRecord } from "@shared/schema";

interface ReferenceTextSelectorProps {
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function ReferenceTextSelector({ selectedIds, onSelectionChange }: ReferenceTextSelectorProps) {
  const [isOpen, setIsOpen] = useState(true);

  const { data: response, isLoading } = useQuery<{ success: boolean; history: AnalysisHistoryRecord[] }>({
    queryKey: ["/api/history"],
  });

  const analyses = response?.history || [];

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    onSelectionChange(analyses.map(a => a.id));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const texts = analyses;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} data-testid="collapsible-reference-texts">
      <Card className="mb-4">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover-elevate active-elevate-2" data-testid="button-toggle-reference-selector">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <CardTitle>Reference Texts</CardTitle>
                <Badge variant="secondary" data-testid="badge-selected-count">
                  {selectedIds.length} selected
                </Badge>
              </div>
              {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
            <CardDescription>
              Select which previously analyzed texts to compare against for continuity analysis
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent>
            {isLoading && (
              <p className="text-sm text-muted-foreground">Loading your analyzed texts...</p>
            )}
            
            {!isLoading && texts.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No analyzed texts yet. Analyze some texts with other modules to build your reference library.
              </p>
            )}
            
            {!isLoading && texts.length > 0 && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAll}
                    data-testid="button-select-all"
                  >
                    Select All ({texts.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAll}
                    disabled={selectedIds.length === 0}
                    data-testid="button-clear-all"
                  >
                    Clear All
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {texts.map((analysis) => (
                    <div
                      key={analysis.id}
                      className="flex items-start gap-3 p-3 border rounded-md hover-elevate"
                      data-testid={`reference-text-${analysis.id}`}
                    >
                      <Checkbox
                        checked={selectedIds.includes(analysis.id)}
                        onCheckedChange={() => toggleSelection(analysis.id)}
                        data-testid={`checkbox-reference-${analysis.id}`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs shrink-0">
                            {analysis.moduleType}
                          </Badge>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {analysis.wordCount} words
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {analysis.inputText.substring(0, 150)}...
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(analysis.createdAt).toLocaleDateString()} at {new Date(analysis.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
