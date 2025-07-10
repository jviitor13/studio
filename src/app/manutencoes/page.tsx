"use client";

import * as React from "react";
import { PlusCircle, Wrench, Search, Calendar as CalendarIcon, History } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const scheduledMaintenances = [
  { id: "MAN-015", vehicle: "RDO1A12", service: "Troca de óleo preventiva", date: "2024-08-15", status: "Agendado" },
  { id: "MAN-016", vehicle: "RDO4D56", service: "Revisão de freios", date: "2024-08-20", status: "Agendado" },
  { id: "MAN-017", vehicle: "RDO5E67", service: "Revisão Geral (50.000km)", date: "2024-09-10", status: "Agendado" },
];

const maintenanceHistory = [
  { id: "MAN-013", vehicle: "RDO3B45", service: "Reparo no sistema de freios", date: "2024-07-29", cost: "R$ 1.200,00" },
  { id: "MAN-014", vehicle: "RDO2C24", service: "Troca de Pneus", date: "2024-07-25", cost: "R$ 3.500,00" },
];

export default function ManutencoesPage() {
    const [open, setOpen] = React.useState(false);
    const [date, setDate] = React.useState<Date>();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Manutenções"
        description="Acompanhe e agende as manutenções da frota."
      >
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
             <Button>
                <PlusCircle className="mr-2" />
                Agendar Manutenção
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agendar Nova Manutenção</DialogTitle>
              <DialogDescription>
                Preencha os detalhes para agendar um novo serviço de manutenção.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid items-center gap-2">
                <Label htmlFor="vehicle">Veículo</Label>
                <Select>
                  <SelectTrigger id="vehicle">
                    <SelectValue placeholder="Selecione a placa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RDO1A12">RDO1A12 - Scania R450</SelectItem>
                    <SelectItem value="RDO2C24">RDO2C24 - MB Actros</SelectItem>
                    <SelectItem value="RDO3B45">RDO3B45 - Volvo FH 540</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid items-center gap-2">
                <Label htmlFor="service">Tipo de Serviço</Label>
                <Input id="service" placeholder="Ex: Troca de óleo, Revisão de freios" />
              </div>
              <div className="grid items-center gap-2">
                <Label htmlFor="date">Data do Agendamento</Label>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                        >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : <span>Selecione a data</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                        <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        />
                    </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter>
                <Button onClick={() => setOpen(false)} type="submit">Agendar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Tabs defaultValue="scheduled">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="scheduled"><Wrench className="mr-2 h-4 w-4"/>Agendadas</TabsTrigger>
          <TabsTrigger value="history"><History className="mr-2 h-4 w-4"/>Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="scheduled">
          <Card>
            <CardHeader>
              <CardTitle>Agenda de Manutenções</CardTitle>
              <CardDescription>
                Serviços de manutenção programados para os próximos dias.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledMaintenances.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.vehicle}</TableCell>
                      <TableCell>{item.service}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Manutenções</CardTitle>
              <CardDescription>
                Registro de todas as manutenções já realizadas na frota.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Veículo</TableHead>
                    <TableHead>Serviço Realizado</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Custo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceHistory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>{item.vehicle}</TableCell>
                      <TableCell>{item.service}</TableCell>
                      <TableCell>{item.date}</TableCell>
                      <TableCell>{item.cost}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
