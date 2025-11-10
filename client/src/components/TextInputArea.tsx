import { useRef, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AlertCircle, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TextInputAreaProps {
  value: string;
  onChange: (value: string) => void;
  wordCount: number;
  maxWords?: number;
}

export function TextInputArea({ value, onChange, wordCount, maxWords = 10000 }: TextInputAreaProps) {
  const isNearLimit = wordCount > maxWords * 0.9;
  const isOverLimit = wordCount > maxWords;
  const requiresChunking = wordCount > 2000 && !isOverLimit;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['text/plain', 'text/markdown'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isValidExtension = ['txt', 'md'].includes(fileExtension || '');
    
    if (!validTypes.includes(file.type) && !isValidExtension) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a .txt or .md file",
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "File must be less than 5MB",
      });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    
    try {
      const text = await file.text();
      onChange(text);
      toast({
        title: "File uploaded",
        description: `Loaded ${file.name} successfully`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Could not read file content",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Label htmlFor="text-input" className="text-base font-medium">
            Input Text
          </Label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md"
            onChange={handleFileUpload}
            className="hidden"
            data-testid="input-file-hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            data-testid="button-upload-file"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </>
            )}
          </Button>
        </div>
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
            Text exceeds the {maxWords}-word limit. Please shorten your input.
          </p>
        </div>
      )}
      
      {requiresChunking && (
        <div className="flex items-start gap-2 text-sm text-blue-600 dark:text-blue-400">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>
            Text will be automatically processed in chunks for optimal analysis (over 2,000 words)
          </p>
        </div>
      )}
      
      {isNearLimit && !isOverLimit && !requiresChunking && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>Approaching word limit ({Math.round((wordCount / maxWords) * 100)}% used)</p>
        </div>
      )}
    </div>
  );
}
