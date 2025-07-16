
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wrench, PlusCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CompletedChecklist } from "@/lib/types";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { cn } from "@/lib/utils";

const statusVariant : {[key:string]: "default" | "destructive" | "secondary"} = {
    'OK': 'default',
    'Pendente': 'destructive',
}

const statusBadgeColor : {[key:string]: string} = {
    'OK': 'bg-green-500 hover:bg-green-600',
    'Pendente': ''
}


export function MechanicDashboard() {
  const [pendingMaintenance, setPendingMaintenance] = useState<CompletedChecklist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "completed-checklists"), where("status", "==", "Pendente"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const checklistsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: (doc.data().createdAt as any).toDate().toISOString(),
        } as CompletedChecklist));
        setPendingMaintenance(checklistsData);
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
            <h1 className="text-2xl font-headline font-semibold">Painel do Mecânico</h1>
            <p className="text-muted-foreground">Gerencie as manutenções dos veículos.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <Button className="w-full md:w-auto" asChild>
                <Link href="/checklist/manutencao">
                    <PlusCircle className="mr-2 h-4 w-4" /> Registrar Revisão
                </Link>
            </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Manutenções Pendentes</CardTitle>
          <CardDescription>Ordens de serviço aguardando ou em andamento.</CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por placa..." className="pl-8" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Veículo</TableHead>
                <TableHead>Nome do Checklist</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                    <TableCell colSpan={4}><Skeleton className="h-24 w-full"/></TableCell>
                </TableRow>
              ) : pendingMaintenance.length > 0 ? (
                pendingMaintenance.map((item) => (
                    <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.vehicle}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                        <Badge variant={statusVariant[item.status]} className={cn(statusBadgeColor[item.status])}>
                            {item.status === 'OK' ? 'Concluído' : 'Com Pendências'}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                           <Link href={`/checklist/completed/${item.id}`}>
                                <Wrench className="mr-2 h-3 w-3" /> Ver Detalhes
                           </Link>
                        </Button>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        Nenhuma manutenção pendente.
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
