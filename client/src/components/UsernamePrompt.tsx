import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function UsernamePrompt() {
  const [username, setUsername] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const { data: authData, isLoading } = useQuery<{ success: boolean; user: any }>({
    queryKey: ["/api/me"],
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !authData?.user) {
      setIsOpen(true);
    } else if (authData?.user) {
      setIsOpen(false);
    }
  }, [isLoading, authData]);

  const loginMutation = useMutation<any, Error, { username: string }>({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/login", data);
      const response = await res.json();
      if (!response.success) {
        throw new Error(response.error || "Login failed");
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      setIsOpen(false);
      setUsername("");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to set username",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({
        variant: "destructive",
        title: "Username Required",
        description: "Please enter a username to continue",
      });
      return;
    }

    loginMutation.mutate({ username: username.trim() });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome</DialogTitle>
          <DialogDescription>
            Enter your username to get started. No password needed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username-input">Username</Label>
            <Input
              id="username-input"
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loginMutation.isPending}
              autoFocus
              data-testid="input-username"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loginMutation.isPending || !username.trim()}
            data-testid="button-continue"
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
