import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

interface TextInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  wordCount: number;
  maxWords?: number;
}

export function TextInputArea({ value, onChange, wordCount, maxWords = 2000 }: TextInputAreaProps) {
  const isNearLimit = wordCount > maxWords * 0.9;
  const isOverLimit = wordCount > maxWords;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="text-input" className="text-base font-medium">
          Input Text
        </Label>
        <div className={`text-sm font-mono ${isOverLimit ? 'text-destructive font-semibold' : isNearLimit ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
          {wordCount} / {maxWords} words
        </div>
      </div>
      
      <Textarea
        id="text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste or type argumentative text here for analysis..."
        className="min-h-[400px] font-sans text-base leading-relaxed resize-none"
        data-testid="input-text"
      />
      
      {isOverLimit && (
        <div className="flex items-start gap-2 text-sm text-destructive" data-testid="text-overlength-warning">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Text exceeds the {maxWords}-word limit. The system will refuse processing or automatically chunk the input.
          </p>
        </div>
      )}
      
      {isNearLimit && !isOverLimit && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>Approaching word limit ({Math.round((wordCount / maxWords) * 100)}% used)</p>
        </div>
      )}
    </div>
  );
}
