"use client";

import * as React from "react";
import { MoreHorizontal, PlusCircle } from "lucide-react";
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

const users = [
  { name: "Admin Gestor", email: "admin@rodocheck.com", role: "Gestor", status: "Ativo" },
  { name: "João Silva", email: "joao.silva@email.com", role: "Motorista", status: "Ativo" },
  { name: "Maria Oliveira", email: "maria.oliveira@email.com", role: "Motorista", status: "Ativo" },
  { name: "Carlos Pereira", email: "carlos.pereira@email.com", role: "Motorista", status: "Inativo" },
  { name: "Pedro Mecânico", email: "pedro.mecanico@rodocheck.com", role: "Mecânico", status: "Ativo" },
];

const roleVariant: { [key: string]: "default" | "secondary" | "outline" } = {
  "Gestor": "default",
  "Motorista": "secondary",
  "Mecânico": "outline",
};

export default function UsuariosPage() {
    const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Usuários"
        description="Gerencie os usuários do sistema."
      >
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2" />
                    Adicionar Usuário
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                    <DialogDescription>
                        Preencha os dados para criar um novo acesso ao sistema.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nome</Label>
                        <Input id="name" placeholder="Nome Completo" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="email" className="text-right">Email</Label>
                        <Input id="email" type="email" placeholder="usuario@email.com" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Função</Label>
                        <Select>
                            <SelectTrigger id="role" className="col-span-3">
                                <SelectValue placeholder="Selecione a função" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gestor">Gestor</SelectItem>
                                <SelectItem value="motorista">Motorista</SelectItem>
                                <SelectItem value="mecanico">Mecânico</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={() => setOpen(false)}>Salvar Usuário</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Todos os usuários com acesso ao sistema RodoCheck.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.email}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={roleVariant[user.role] || 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                     <Badge variant={user.status === 'Ativo' ? 'secondary' : 'destructive'} className={user.status === 'Ativo' ? 'bg-green-500 hover:bg-green-600' : ''}>
                      {user.status}
                    </Badge>
                  </TableCell>
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
                        <DropdownMenuItem>Resetar Senha</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Desativar
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
