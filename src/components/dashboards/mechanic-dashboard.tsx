import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Wrench, PlusCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function MechanicDashboard() {
  const pendingMaintenance: { id: string, vehicle: string, model: string, issue: string, status: string }[] = [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div>
            <h1 className="text-2xl font-headline font-semibold">Painel do Mecânico</h1>
            <p className="text-muted-foreground">Gerencie as manutenções dos veículos.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <Button className="w-full md:w-auto">
                <PlusCircle className="mr-2 h-4 w-4" /> Registrar Revisão
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
                <TableHead>Modelo</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingMaintenance.length > 0 ? (
                pendingMaintenance.map((item) => (
                    <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.vehicle}</TableCell>
                    <TableCell>{item.model}</TableCell>
                    <TableCell>{item.issue}</TableCell>
                    <TableCell>
                        <Badge variant={item.status === "Pendente" ? "destructive" : "secondary"}>
                        {item.status}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                        <Wrench className="mr-2 h-3 w-3" /> Ver Detalhes
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
