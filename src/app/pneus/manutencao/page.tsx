
"use client";

import * as React from "react";
import { MoreHorizontal, Download, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";

const maintenanceTires = [
    { id: "PNEU-004", supplier: "Recapadora Silva", service: "Reforma", status: "Em Manutenção", returnDate: "2024-08-10" },
    { id: "PNEU-015", supplier: "Borracharia Central", service: "Avaliação Técnica", status: "Aguardando", returnDate: "2024-08-05" },
    { id: "PNEU-021", supplier: "Recapadora Silva", service: "Reforma", status: "Concluído", returnDate: "2024-07-28" },
    { id: "PNEU-033", supplier: "Oficina do Zé", service: "Sucata", status: "Reprovado", returnDate: "-" },
];

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  "Concluído": "default",
  "Aguardando": "secondary",
  "Em Manutenção": "outline",
  "Reprovado": "destructive",
};

export default function PneusManutencaoPage() {
    
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Manutenção de Pneus"
        description="Acompanhe o status de todos os pneus enviados para reforma, conserto ou avaliação."
      >
        <Button variant="outline">
            <Download className="mr-2" />
            Exportar Lista
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtre os pneus por status ou fornecedor.</CardDescription>
          <div className="flex gap-4 pt-4">
              <Select>
                <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder="Filtrar por status..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="aguardando">Aguardando</SelectItem>
                    <SelectItem value="em_manutencao">Em Manutenção</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                    <SelectItem value="reprovado">Reprovado</SelectItem>
                </SelectContent>
            </Select>
            <Input className="max-w-xs" placeholder="Buscar por fornecedor..." />
            <Button><Filter className="mr-2 h-4 w-4" />Aplicar</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID/Fogo</TableHead>
                <TableHead>Fornecedor</TableHead>
                <TableHead>Tipo de Serviço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Previsão de Retorno</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenanceTires.map((tire) => (
                <TableRow key={tire.id}>
                  <TableCell className="font-medium">{tire.id}</TableCell>
                  <TableCell>{tire.supplier}</TableCell>
                   <TableCell>{tire.service}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[tire.status] || 'secondary'}>
                      {tire.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{tire.returnDate}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                        <DropdownMenuItem>Alterar Status</DropdownMenuItem>
                        <DropdownMenuItem>Anexar Nota Fiscal</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
