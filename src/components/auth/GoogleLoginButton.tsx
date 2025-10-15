/**
 * Google OAuth Login Button Component
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  className?: string;
  children?: React.ReactNode;
}

export function GoogleLoginButton({ 
  onSuccess, 
  onError, 
  className,
  children 
}: GoogleLoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { googleLogin } = useAuth();
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    if (!window.google) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Google OAuth não está carregado. Recarregue a página.",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Initialize Google OAuth
      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      // Prompt the user to select an account
      window.google.accounts.id.prompt();
    } catch (error) {
      console.error('Google login error:', error);
      const errorMessage = 'Erro ao inicializar login do Google';
      toast({
        variant: "destructive",
        title: "Erro",
        description: errorMessage,
      });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCredentialResponse = async (response: any) => {
    setIsLoading(true);

    try {
      // Decode the JWT token
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      
      const result = await googleLogin(response.credential, payload);
      
      if (result.success) {
        toast({
          title: "Login realizado!",
          description: `Bem-vindo, ${result.user?.first_name}!`,
        });
        onSuccess?.();
      } else {
        toast({
          variant: "destructive",
          title: "Erro no login",
          description: result.error || "Falha na autenticação",
        });
        onError?.(result.error || "Falha na autenticação");
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = 'Erro ao processar login';
      toast({
        variant: "destructive",
        title: "Erro",
        description: errorMessage,
      });
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className={className}
      variant="outline"
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      )}
      {children || 'Entrar com Google'}
    </Button>
  );
}
