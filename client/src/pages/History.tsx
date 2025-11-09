import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Trash2, Download, Calendar, FileText, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import type { AnalysisHistoryRecord } from "@shared/schema";

export default function History() {
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisHistoryRecord | null>(null);

  const { data: historyData, isLoading, isError, error } = useQuery<{ success: boolean; history: AnalysisHistoryRecord[] }>({
    queryKey: ["/api/history"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/history/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/history"] });
      setDeleteId(null);
    },
  });

  const history = historyData?.history || [];
  
  const filteredAndSortedHistory = (() => {
    let filtered = moduleFilter === "all" 
      ? history 
      : history.filter(item => item.moduleType === moduleFilter);
    
    return filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });
  })();

  const getModuleName = (type: string) => {
    switch (type) {
      case "epistemic-inference": return "Epistemic Inference";
      case "justification-builder": return "Justification Builder";
      case "knowledge-utility-mapper": return "Knowledge-to-Utility Mapper";
      case "cognitive-integrity": return "Cognitive Integrity";
      case "cognitive-continuity": return "Cognitive Continuity";
      default: return type;
    }
  };

  const getModuleColor = (type: string) => {
    switch (type) {
      case "epistemic-inference": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "justification-builder": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "knowledge-utility-mapper": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "cognitive-integrity": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "cognitive-continuity": return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const downloadAsText = (analysis: AnalysisHistoryRecord) => {
    const timestamp = format(new Date(analysis.createdAt), "yyyy-MM-dd_HH-mm-ss");
    const moduleName = getModuleName(analysis.moduleType).replace(/ /g, "_");
    const filename = `${moduleName}_${timestamp}.txt`;

    let content = `${getModuleName(analysis.moduleType)} Analysis\n`;
    content += `Generated: ${format(new Date(analysis.createdAt), "PPpp")}\n`;
    content += `Word Count: ${analysis.wordCount}\n`;
    content += `Processing Time: ${analysis.processingTime}ms\n`;
    content += `\n${"=".repeat(60)}\n\n`;
    content += `INPUT TEXT:\n${analysis.inputText}\n\n`;
    content += `${"=".repeat(60)}\n\nANALYSIS RESULTS:\n\n`;
    content += JSON.stringify(analysis.result, null, 2);

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" data-testid="button-back">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-title">Analysis History</h1>
              <p className="text-sm text-muted-foreground">View and manage your saved epistemic analyses</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-52" data-testid="select-module-filter">
                <SelectValue placeholder="Filter by module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="epistemic-inference">Epistemic Inference</SelectItem>
                <SelectItem value="justification-builder">Justification Builder</SelectItem>
                <SelectItem value="knowledge-utility-mapper">Knowledge-to-Utility Mapper</SelectItem>
                <SelectItem value="cognitive-integrity">Cognitive Integrity</SelectItem>
                <SelectItem value="cognitive-continuity">Cognitive Continuity</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(value: "newest" | "oldest") => setSortOrder(value)}>
              <SelectTrigger className="w-40" data-testid="select-sort-order">
                <SelectValue placeholder="Sort order" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {isError ? (
          <Alert variant="destructive" data-testid="alert-error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load analysis history. {error instanceof Error ? error.message : "Please try again later."}
            </AlertDescription>
          </Alert>
        ) : isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-6">
                <Skeleton className="h-6 w-64 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </Card>
            ))}
          </div>
        ) : filteredAndSortedHistory.length === 0 ? (
          <Alert data-testid="alert-no-history">
            <FileText className="h-4 w-4" />
            <AlertDescription>
              {moduleFilter === "all" 
                ? "No analyses saved yet. Complete an analysis to see it here." 
                : `No ${getModuleName(moduleFilter)} analyses found.`}
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedHistory.map(analysis => (
              <Card key={analysis.id} className="p-6 hover-elevate" data-testid={`card-analysis-${analysis.id}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Badge className={getModuleColor(analysis.moduleType)} data-testid="badge-module-type">
                        {getModuleName(analysis.moduleType)}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span data-testid="text-date">{format(new Date(analysis.createdAt), "PPp")}</span>
                      </div>
                      <span className="text-sm text-muted-foreground" data-testid="text-word-count">
                        {analysis.wordCount} words
                      </span>
                      {analysis.processingTime && (
                        <span className="text-sm text-muted-foreground" data-testid="text-processing-time">
                          {(analysis.processingTime / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>
                    
                    <p className="text-sm line-clamp-2 mb-4" data-testid="text-input-preview">
                      {analysis.inputText}
                    </p>

                    {selectedAnalysis?.id === analysis.id && (
                      <div className="mt-4 p-4 bg-muted rounded-md border" data-testid="div-analysis-details">
                        <h3 className="font-semibold mb-2">Analysis Results</h3>
                        <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap">
                          {JSON.stringify(analysis.result, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedAnalysis(selectedAnalysis?.id === analysis.id ? null : analysis)}
                      data-testid={`button-view-${analysis.id}`}
                    >
                      {selectedAnalysis?.id === analysis.id ? "Hide" : "View"}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => downloadAsText(analysis)}
                      data-testid={`button-download-${analysis.id}`}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setDeleteId(analysis.id)}
                      data-testid={`button-delete-${analysis.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this analysis? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
