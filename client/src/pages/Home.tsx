import { useState, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2, Moon, Sun, History as HistoryIcon } from "lucide-react";
import { ModuleSelector } from "@/components/ModuleSelector";
import { TextInputArea } from "@/components/TextInputArea";
import { EpistemicInferenceResults } from "@/components/EpistemicInferenceResults";
import { JustificationBuilderResults } from "@/components/JustificationBuilderResults";
import { KnowledgeUtilityResults } from "@/components/KnowledgeUtilityResults";
import { apiRequest } from "@/lib/queryClient";
import type { ModuleType, AnalyzeResponse, EpistemicInferenceResult, JustificationBuilderResult, KnowledgeUtilityResult } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [selectedModule, setSelectedModule] = useState<ModuleType>("epistemic-inference");
  const [inputText, setInputText] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const { toast } = useToast();

  const handleModuleChange = (newModule: ModuleType) => {
    setSelectedModule(newModule);
    // Reset mutation state when changing modules
    analyzeMutation.reset();
  };

  const wordCount = useMemo(() => {
    return inputText.trim().split(/\s+/).filter(word => word.length > 0).length;
  }, [inputText]);

  const analyzeMutation = useMutation<AnalyzeResponse, Error, { text: string; moduleType: ModuleType }>({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/analyze", data);
      const response = await res.json();
      return response;
    },
    onSuccess: (data) => {
      if (!data.success) {
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: data.diagnosticMessage || "Unable to process the text",
        });
      } else if (data.diagnosticMessage) {
        toast({
          title: "Notice",
          description: data.diagnosticMessage,
        });
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An unexpected error occurred",
      });
    },
  });

  const handleAnalyze = () => {
    if (!inputText.trim()) {
      toast({
        variant: "destructive",
        title: "Empty Input",
        description: "Please enter some text to analyze",
      });
      return;
    }

    if (wordCount > 10000) {
      toast({
        variant: "destructive",
        title: "Text Too Long",
        description: "Please limit your input to 10,000 words or less",
      });
      return;
    }
    
    if (wordCount > 2000) {
      toast({
        title: "Long Text Detected",
        description: "Your text will be automatically split into chunks for processing",
      });
    }

    analyzeMutation.mutate({ text: inputText, moduleType: selectedModule });
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const renderResults = () => {
    const data = analyzeMutation.data;
    if (!data || !data.success || !data.result) return null;

    if (selectedModule === "epistemic-inference") {
      return <EpistemicInferenceResults result={data.result as EpistemicInferenceResult} />;
    } else if (selectedModule === "justification-builder") {
      return <JustificationBuilderResults result={data.result as JustificationBuilderResult} />;
    } else {
      return <KnowledgeUtilityResults result={data.result as KnowledgeUtilityResult} />;
    }
  };

  return (
    <div className={`min-h-screen bg-background ${darkMode ? 'dark' : ''}`}>
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Epistemic Reasoning Engine</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                AI-powered analysis of argumentative text
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/history">
                <Button variant="ghost" size="sm" data-testid="button-history">
                  <HistoryIcon className="h-4 w-4 mr-2" />
                  History
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                data-testid="button-theme-toggle"
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Module Selector */}
          <Card className="p-6">
            <ModuleSelector
              selectedModule={selectedModule}
              onModuleChange={handleModuleChange}
            />
          </Card>

          {/* Input Section */}
          <Card className="p-6">
            <TextInputArea
              value={inputText}
              onChange={setInputText}
              wordCount={wordCount}
              maxWords={10000}
            />

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedModule === "epistemic-inference" && "Analyzes justificatory structure, evaluates coherence, and rewrites text"}
                {selectedModule === "justification-builder" && "Reconstructs missing premises and inferential links"}
                {selectedModule === "knowledge-utility-mapper" && "Extracts practical value and utility from theoretical claims"}
              </div>
              <Button
                onClick={handleAnalyze}
                disabled={analyzeMutation.isPending || !inputText.trim() || wordCount > 10000}
                size="lg"
                data-testid="button-analyze"
              >
                {analyzeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze Text"
                )}
              </Button>
            </div>
          </Card>

          {/* Status Messages */}
          {analyzeMutation.data && !analyzeMutation.data.isArgumentative && (
            <Alert variant="destructive" data-testid="alert-no-argument">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {analyzeMutation.data.diagnosticMessage || "No inferential content detected. The passage is descriptive, narrative, or rhetorical rather than argumentative."}
              </AlertDescription>
            </Alert>
          )}

          {analyzeMutation.data?.success && analyzeMutation.data.isArgumentative && (
            <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950" data-testid="alert-success">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <AlertDescription className="text-emerald-900 dark:text-emerald-100">
                Analysis complete! Processed {analyzeMutation.data.wordCount} words
                {analyzeMutation.data.processingTime && ` in ${(analyzeMutation.data.processingTime / 1000).toFixed(1)}s`}
              </AlertDescription>
            </Alert>
          )}

          {/* Results Section */}
          {renderResults()}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-sm text-muted-foreground">
          <p>Powered by Anthropic Claude (primary) with OpenAI and DeepSeek fallback</p>
          <p className="mt-1">Maximum input: 10,000 words with automatic chunking for longer texts</p>
        </div>
      </footer>
    </div>
  );
}
