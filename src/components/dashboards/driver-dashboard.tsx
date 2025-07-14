"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldCheck, FileText, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function DriverDashboard() {
  const lastChecklists: { id: string; date: string; type: string; status: string; }[] = [];

  return (
    <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-4">
            <Card className="flex-1">
                <CardHeader>
                    <CardTitle className="font-headline">Status do Veículo</CardTitle>
                    <CardDescription>Nenhum veículo atribuído</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary">Indisponível</Badge>
                    </div>
                </CardContent>
            </Card>
             <Card className="flex-1">
                <CardHeader>
                    <CardTitle className="font-headline">Jornada</CardTitle>
                     <CardDescription>Inicie ou finalize sua jornada de trabalho.</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-4">
                     <Button className="w-full">Iniciar Jornada</Button>
                     <Button variant="outline" className="w-full" disabled>Finalizar Jornada</Button>
                </CardContent>
            </Card>
        </div>
        
        <div className="flex items-center gap-4">
            <h2 className="text-xl font-headline font-semibold">Acesso Rápido</h2>
            <div className="flex-1 border-t"></div>
        </div>
        <TooltipProvider>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/checklist/viagem" className="w-full">
                    <Button size="lg" className="w-full h-24 text-base">
                        <ShieldCheck className="mr-4 h-6 w-6" /> Novo Checklist
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Preencha um novo checklist de pré ou pós-viagem.</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                   <Link href="/ocorrencias" className="w-full">
                    <Button size="lg" variant="secondary" className="w-full h-24 text-base">
                        <AlertTriangle className="mr-4 h-6 w-6" /> Registrar Ocorrência
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reporte incidentes, avarias ou qualquer evento inesperado.</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                    <Link href="/documentos" className="w-full">
                        <Button size="lg" variant="secondary" className="w-full h-24 text-base">
                            <FileText className="mr-4 h-6 w-6" /> Meus Documentos
                        </Button>
                    </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Acesse sua CNH, documentos do veículo e outros arquivos.</p>
                </TooltipContent>
              </Tooltip>
            </div>
        </TooltipProvider>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Últimos Checklists</CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {lastChecklists.length > 0 ? (
                            lastChecklists.map((checklist) => (
                                <TableRow key={checklist.id}>
                                    <TableCell className="font-medium">{checklist.id}</TableCell>
                                    <TableCell>{checklist.date}</TableCell>
                                    <TableCell>{checklist.type}</TableCell>
                                    <TableCell className="text-right">
                                    <Badge variant={checklist.status === "Aprovado" ? "default" : "destructive"} className={checklist.status === "Aprovado" ? "bg-green-500 hover:bg-green-600" : ""}>
                                        {checklist.status}
                                    </Badge>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">
                                    Nenhum checklist realizado ainda.
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
