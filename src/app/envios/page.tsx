
"use client";

import * as React from "react";
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
import { collection, onSnapshot, query, where, Timestamp, orderBy } from "firebase/firestore";
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

const mapDocToChecklist = (doc: any): CompletedChecklist => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
    } as CompletedChecklist;
};

export default function EnviosPage() {
  const [sendingChecklists, setSendingChecklists] = React.useState<CompletedChecklist[]>([]);
  const [failedChecklists, setFailedChecklists] = React.useState<CompletedChecklist[]>([]);
  const [processingChecklists, setProcessingChecklists] = React.useState<CompletedChecklist[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  // Listener for 'Enviando' status
  React.useEffect(() => {
    const q = query(collection(db, "completed-checklists"), where("status", "==", "Enviando"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setSendingChecklists(snapshot.docs.map(mapDocToChecklist));
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching 'Enviando' checklists:", error);
        toast({ variant: "destructive", title: "Erro ao carregar envios" });
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  // Listener for 'Falhou' status
  React.useEffect(() => {
    const q = query(collection(db, "completed-checklists"), where("status", "==", "Falhou"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setFailedChecklists(snapshot.docs.map(mapDocToChecklist));
        setIsLoading(false);
    }, (error) => {
        console.error("Error fetching 'Falhou' checklists:", error);
        toast({ variant: "destructive", title: "Erro ao carregar envios com falha" });
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  // Combine and sort results
  React.useEffect(() => {
      const combined = [...sendingChecklists, ...failedChecklists];
      const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
      unique.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setProcessingChecklists(unique);
  }, [sendingChecklists, failedChecklists]);
  
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
