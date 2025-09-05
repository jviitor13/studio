
"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface UploadErrorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  errorMessage?: string;
}

export function UploadErrorDialog({ isOpen, onClose, errorMessage }: UploadErrorDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
             <AlertTriangle className="h-6 w-6 text-destructive" />
            Falha no Upload
          </AlertDialogTitle>
          <AlertDialogDescription>
            Ocorreu um erro durante o processamento do checklist em segundo plano.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="bg-muted p-4 rounded-md border text-sm text-destructive-foreground">
          <p className="font-semibold">Detalhes do Erro:</p>
          <p className="mt-1">{errorMessage || "Não foi possível obter os detalhes do erro."}</p>
        </div>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onClose}>Fechar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
