
"use client";

import * as React from "react";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Loader2, AlertTriangle, CheckCircle, UploadCloud } from "lucide-react";

const statusVariant: { [key: string]: "default" | "destructive" | "secondary" } = {
  "Enviando": "secondary",
  "Falhou": "destructive",
  "OK": "default",
};

const statusBadgeColor: { [key: string]: string } = {
  "Enviando": "animate-pulse",
  "Falhou": "",
  "OK": "bg-green-500 hover:bg-green-600",
};

const statusIcon: { [key: string]: React.ReactNode } = {
    "Enviando": <Loader2 className="mr-2 h-4 w-4 animate-spin"/>,
    "Falhou": <AlertTriangle className="mr-2 h-4 w-4"/>,
    "OK": <CheckCircle className="mr-2 h-4 w-4" />
}

export default function EnviosPage() {
  const [processingChecklists, setProcessingChecklists] = React.useState<CompletedChecklist[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    setIsLoading(true);
    // Query for checklists created in the last 24 hours that are not yet OK or Pending
    const oneDayAgo = subDays(new Date(), 1);
    const q = query(
        collection(db, "completed-checklists"),
        where("createdAt", ">=", Timestamp.fromDate(oneDayAgo)),
        orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const checklistsData: CompletedChecklist[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
         // Filter client-side for the specific statuses
        if(data.status === 'Enviando' || data.status === 'Falhou'){
            checklistsData.push({
              ...data,
              id: doc.id,
              createdAt: (data.createdAt as Timestamp).toDate().toISOString(),
            } as CompletedChecklist);
        }
      });
      setProcessingChecklists(checklistsData);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching processing checklists:", error);
        toast({
            variant: "destructive",
            title: "Erro ao carregar envios",
            description: "Não foi possível buscar os checklists em processamento."
        })
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), "dd/MM/yyyy HH:mm:ss");
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Acompanhamento de Envios"
        description="Monitore o status do processamento dos checklists enviados."
      />
      <Card>
        <CardHeader>
          <CardTitle>Checklists em Processamento</CardTitle>
          <CardDescription>
            A lista abaixo é atualizada em tempo real. Checklists concluídos ou corrigidos desaparecerão daqui.
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
                        <p className="text-sm">Todos os envios foram concluídos.</p>
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
