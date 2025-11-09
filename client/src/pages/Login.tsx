import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, UserCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [username, setUsername] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

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
      toast({
        title: "Login Successful",
        description: `Welcome, ${username}!`,
      });
      // Redirect to home after successful login
      setLocation("/");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "An unexpected error occurred",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      toast({
        variant: "destructive",
        title: "Username Required",
        description: "Please enter your username",
      });
      return;
    }

    loginMutation.mutate({ username: username.trim() });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <UserCircle className="w-10 h-10 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Epistemic Reasoning Engine</CardTitle>
          <CardDescription>
            Enter your username to access your analysis workspace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loginMutation.isPending}
                autoFocus
                data-testid="input-username"
              />
              <p className="text-xs text-muted-foreground">
                No password required - username-only authentication
              </p>
            </div>

            {loginMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {loginMutation.error?.message || "Login failed. Please try again."}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending || !username.trim()}
              size="lg"
              data-testid="button-login"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t">
            <p className="text-xs text-center text-muted-foreground">
              New users will be automatically registered upon first login
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
