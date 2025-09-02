
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CompletedChecklist } from "@/lib/types";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, Timestamp, doc, orderBy } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/page-header";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Loader2, AlertTriangle, CheckCircle, UploadCloud } from "lucide-react";

const statusVariant: { [key: string]: "default" | "destructive" | "secondary" } = {
  "Enviando": "secondary",
  "Falhou": "destructive",
  "OK": "default",
  "Pendente": "destructive",
};

const statusBadgeColor: { [key: string]: string } = {
  "Enviando": "animate-pulse",
  "Falhou": "",
  "OK": "bg-green-500 hover:bg-green-600",
};

const statusIcon: { [key: string]: React.ReactNode } = {
    "Enviando": <Loader2 className="mr-2 h-4 w-4 animate-spin"/>,
    "Falhou": <AlertTriangle className="mr-2 h-4 w-4"/>,
    "OK": <CheckCircle className="mr-2 h-4 w-4" />,
    "Pendente": <AlertTriangle className="mr-2 h-4 w-4" />
}

export default function EnviosPage() {
  const [processingChecklists, setProcessingChecklists] = React.useState<CompletedChecklist[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    setIsLoading(true);

    const fetchChecklists = (status: string) => {
      const q = query(collection(db, "completed-checklists"), where("status", "==", status));
      return onSnapshot(q, (snapshot) => {
        const checklistsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
            } as CompletedChecklist;
        });

        // Update the main state based on the status
        setProcessingChecklists(prev => {
            // Remove old entries with this status to avoid duplicates
            const otherStatuses = prev.filter(c => c.status !== status);
            // Combine and sort
            const combined = [...otherStatuses, ...checklistsData];
            combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            return combined;
        });
        
      }, (error) => {
        console.error(`Error fetching checklists with status ${status}:`, error);
        toast({
            variant: "destructive",
            title: "Erro ao carregar envios",
            description: "Não foi possível buscar os checklists em processamento."
        });
      });
    };

    const unsubscribeSending = fetchChecklists('Enviando');
    const unsubscribeFailed = fetchChecklists('Falhou');
    
    // Initial loading state finished after a short delay to allow queries to run
    setTimeout(() => setIsLoading(false), 1500);

    return () => {
      unsubscribeSending();
      unsubscribeFailed();
    };
  }, [toast]);
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), "dd/MM/yyyy HH:mm:ss");
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Acompanhamento de Envios"
        description="Monitore o status do processamento dos checklists enviados. Apenas checklists 'Enviando' ou com 'Falha' são exibidos aqui."
      />
      <Card>
        <CardHeader>
          <CardTitle>Checklists em Processamento</CardTitle>
          <CardDescription>
            A lista abaixo é atualizada em tempo real. Checklists concluídos desaparecerão daqui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID do Checklist</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Motorista</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-24 w-full" />
                  </TableCell>
                </TableRow>
              ) : processingChecklists.length > 0 ? (
                processingChecklists.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.id}</TableCell>
                    <TableCell className="font-medium">{item.vehicle}</TableCell>
                    <TableCell>{item.driver}</TableCell>
                    <TableCell>{formatDate(item.createdAt)}</TableCell>
                    <TableCell className="text-right">
                       <Badge variant={statusVariant[item.status]} className={cn(statusBadgeColor[item.status])}>
                           {statusIcon[item.status]}
                           {item.status}
                        </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                        <UploadCloud className="h-10 w-10" />
                        <p className="font-semibold">Nenhum checklist em processamento.</p>
                        <p className="text-sm">Todos os envios foram concluídos ou não apresentaram falhas.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
