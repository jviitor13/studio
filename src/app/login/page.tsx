
"use client";

import { useEffect } from "react";
import { Logo } from "@/components/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoginForm } from "@/components/auth/LoginForm";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect
  }

  const handleLoginSuccess = () => {
    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="mx-auto w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <Logo className="h-12 w-12 text-primary" />
        </div>
        <h1 className="text-2xl font-headline text-center mb-2">RodoCheck</h1>
        <p className="text-center text-muted-foreground mb-8">
          Faça login para acessar o painel
        </p>
        
        <LoginForm 
          onSuccess={handleLoginSuccess}
        />
      </div>
    </div>
  );
}
