"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface DamageAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  damageDescription: string;
  onConfirm: () => void;
}

export function DamageAssessmentDialog({
  open,
  onOpenChange,
  damageDescription,
  onConfirm,
}: DamageAssessmentDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-headline flex items-center gap-2">
            <AlertTriangle className="text-destructive h-6 w-6" />
            Atenção: Possível Avaria Detectada
          </AlertDialogTitle>
          <AlertDialogDescription>
            Nossa análise com IA detectou um possível problema no veículo que não foi registrado anteriormente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Descrição da Avaria</AlertTitle>
          <AlertDescription>
            {damageDescription}
          </AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground">
          Por favor, verifique a avaria. Se for um dano novo, registre uma ocorrência. Se não for um problema, você pode continuar, mas será necessário justificar.
        </p>
        <AlertDialogFooter>
          <AlertDialogCancel>Voltar e Corrigir</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Continuar com Justificativa
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
