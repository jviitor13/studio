"use client";

import * as React from "react";
import { PlusCircle, MoreHorizontal, Eye } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";

const tires = [
  { id: "PNEU-001", brand: "Michelin", model: "X Multi Z", status: "Em Uso", vehicle: "RDO1A12", position: "Dianteiro Esquerdo" },
  { id: "PNEU-002", brand: "Pirelli", model: "FR:01", status: "Em Uso", vehicle: "RDO1A12", position: "Dianteiro Direito" },
  { id: "PNEU-003", brand: "Goodyear", model: "KMax S", status: "Em Estoque", vehicle: "-", position: "-" },
  { id: "PNEU-004", brand: "Michelin", model: "X Multi Z", status: "Em Manutenção", vehicle: "RDO2C24", position: "Traseiro Esquerdo (Ext)" },
  { id: "PNEU-005", brand: "Bridgestone", model: "R268", status: "Sucateado", vehicle: "-", position: "-" },
];

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  "Em Uso": "default",
  "Em Estoque": "secondary",
  "Em Manutenção": "outline",
  "Sucateado": "destructive",
};

export default function PneusPage() {
    const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestão de Pneus"
        description="Gerencie os pneus da sua frota."
      >
        <div className="flex gap-2">
           <Link href="/pneus/visualizacao">
            <Button variant="outline">
                <Eye className="mr-2" />
                Visualizar por Veículo
            </Button>
           </Link>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2" />
                        Adicionar Pneu
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Adicionar Novo Pneu</DialogTitle>
                        <DialogDescription>
                            Preencha os dados para cadastrar um novo pneu.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="id" className="text-right">ID / Fogo</Label>
                            <Input id="id" placeholder="Ex: PNEU-006" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="brand" className="text-right">Marca</Label>
                            <Input id="brand" placeholder="Ex: Michelin" className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="model" className="text-right">Modelo</Label>
                            <Input id="model" placeholder="Ex: X Multi Z" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="status" className="text-right">Status</Label>
                            <Select>
                                <SelectTrigger id="status" className="col-span-3">
                                    <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="estoque">Em Estoque</SelectItem>
                                    <SelectItem value="uso">Em Uso</SelectItem>
                                    <SelectItem value="manutencao">Em Manutenção</SelectItem>
                                    <SelectItem value="sucateado">Sucateado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" onClick={() => setOpen(false)}>Salvar Pneu</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pneus</CardTitle>
          <CardDescription>
            Todos os pneus cadastrados no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID / Fogo</TableHead>
                <TableHead>Marca/Modelo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead>Posição</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tires.map((tire) => (
                <TableRow key={tire.id}>
                  <TableCell className="font-medium">{tire.id}</TableCell>
                  <TableCell>{tire.brand} {tire.model}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[tire.status] || 'secondary'}>
                      {tire.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{tire.vehicle}</TableCell>
                  <TableCell>{tire.position}</TableCell>
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
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem>Movimentar</DropdownMenuItem>
                        <DropdownMenuItem>Histórico</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Sucatear
                        </DropdownMenuItem>
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
