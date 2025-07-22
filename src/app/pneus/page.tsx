
"use client";

import * as React from "react";
import { PlusCircle, MoreHorizontal, Eye, Truck, Settings, Wrench, CalendarIcon } from "lucide-react";
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
  DropdownMenuSeparator,
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";


const tires = [
  { id: "PNEU-001", brand: "Michelin", model: "X Multi Z", size: "275/80 R22.5", lifespan: "85%", status: "Em Uso", vehicle: "RDO1A12", position: "DDE" },
  { id: "PNEU-002", brand: "Pirelli", model: "FR:01", size: "275/80 R22.5", lifespan: "90%", status: "Em Uso", vehicle: "RDO1A12", position: "DDD" },
  { id: "PNEU-003", brand: "Goodyear", model: "KMax S", size: "295/80 R22.5", lifespan: "100%", status: "Em Estoque", vehicle: "-", position: "-" },
  { id: "PNEU-004", brand: "Michelin", model: "X Multi Z", size: "275/80 R22.5", lifespan: "40%", status: "Em Manutenção", vehicle: "RDO2C24", position: "T1EE" },
  { id: "PNEU-005", brand: "Bridgestone", model: "R268", size: "11R22.5", lifespan: "0%", status: "Sucateado", vehicle: "-", position: "-" },
];

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  "Em Uso": "default",
  "Em Estoque": "secondary",
  "Em Manutenção": "outline",
  "Sucateado": "destructive",
};

const MaintenanceDialog = ({ tireId }: { tireId: string }) => {
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const [date, setDate] = React.useState<Date>();

    const handleSendToMaintenance = () => {
        toast({
            title: "Envio Registrado!",
            description: `O pneu ${tireId} foi enviado para manutenção.`,
        });
        setOpen(false);
    }
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Wrench className="mr-2"/>Enviar p/ Manutenção
                </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Enviar Pneu para Manutenção</DialogTitle>
                    <DialogDescription>
                        Preencha os dados para registrar o envio do pneu <span className="font-bold">{tireId}</span>.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid items-center gap-2">
                        <Label htmlFor="maintenance-type">Tipo de Manutenção</Label>
                        <Select>
                            <SelectTrigger id="maintenance-type"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="reforma">Reforma / Recapagem</SelectItem>
                                <SelectItem value="troca_carcaca">Troca de Carcaça</SelectItem>
                                <SelectItem value="avaliacao">Avaliação Técnica</SelectItem>
                                <SelectItem value="sucata">Descarte / Sucata</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid items-center gap-2">
                        <Label htmlFor="supplier">Fornecedor / Oficina</Label>
                        <Input id="supplier" placeholder="Ex: Recapadora Silva" />
                    </div>
                     <div className="grid items-center gap-2">
                        <Label htmlFor="return-date">Previsão de Retorno</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                id="return-date"
                                variant={"outline"}
                                className={cn("justify-start text-left font-normal", !date && "text-muted-foreground")}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {date ? format(date, "PPP") : <span>Selecione uma data</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={setDate} initialFocus /></PopoverContent>
                        </Popover>
                    </div>
                     <div className="grid items-center gap-2">
                        <Label htmlFor="observations">Observações Técnicas</Label>
                        <Textarea id="observations" placeholder="Descreva problemas como bolhas, desgaste irregular, etc." />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button type="submit" onClick={handleSendToMaintenance}>Enviar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function PneusPage() {
    const [open, setOpen] = React.useState(false);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Gestão de Pneus"
        description="Gerencie o ciclo de vida completo dos pneus da sua frota."
      >
        <div className="flex gap-2">
           <Link href="/pneus/visualizacao">
            <Button variant="outline">
                <Eye className="mr-2" />
                Visualizar por Veículo
            </Button>
           </Link>
           <Link href="/pneus/manutencao">
            <Button variant="outline">
                <Wrench className="mr-2" />
                Acompanhar Manutenções
            </Button>
           </Link>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2" />
                        Adicionar Pneu
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Cadastro Detalhado de Pneu</DialogTitle>
                        <DialogDescription>
                            Preencha todos os dados para um controle preciso do pneu.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto px-2">
                        {/* Seção Dados Básicos */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Dados de Identificação</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="id">ID / Fogo 🔥</Label>
                                    <Input id="id" placeholder="Ex: PNEU-006" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="serial">Número de Série</Label>
                                    <Input id="serial" placeholder="Ex: Y78SDFG89" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="brand">Marca</Label>
                                    <Input id="brand" placeholder="Ex: Michelin" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="model">Modelo</Label>
                                    <Input id="model" placeholder="Ex: X Multi Z" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="mfg-date">Data de Fabricação</Label>
                                    <Input id="mfg-date" type="week" />
                                </div>
                            </div>
                        </div>
                        <Separator />
                        {/* Seção Especificações Técnicas */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Especificações Técnicas</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="size">Medida</Label>
                                    <Input id="size" placeholder="Ex: 275/80 R22.5" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="indices">Índice Carga/Velocidade</Label>
                                    <Input id="indices" placeholder="Ex: 149/146L" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="type">Tipo (Construção)</Label>
                                    <Select>
                                        <SelectTrigger id="type"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="radial">Radial</SelectItem>
                                            <SelectItem value="diagonal">Diagonal</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        <Separator />
                        {/* Seção Status e Vida Útil */}
                         <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Status e Vida Útil</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Situação Atual</Label>
                                    <Select>
                                        <SelectTrigger id="status"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="novo">Novo (em estoque)</SelectItem>
                                            <SelectItem value="usado">Em uso</SelectItem>
                                            <SelectItem value="recap1">Recapado 1x</SelectItem>
                                            <SelectItem value="recap2">Recapado 2x</SelectItem>
                                            <SelectItem value="manutencao">Em manutenção</SelectItem>
                                            <SelectItem value="descartado">Descartado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="retreads">Número de Reformas</Label>
                                    <Input id="retreads" type="number" defaultValue={0} />
                                </div>
                                 <div className="grid gap-2">
                                    <Label htmlFor="lifespan">Vida Útil Estimada (%)</Label>
                                    <Input id="lifespan" type="number" placeholder="Ex: 85" />
                                </div>
                            </div>
                        </div>

                    </div>
                    <DialogFooter className="mt-4 pt-4 border-t">
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                        <Button type="submit" onClick={() => setOpen(false)}>Salvar Pneu</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Inventário de Pneus</CardTitle>
          <CardDescription>
            Todos os pneus cadastrados no sistema, com seus status e localizações.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID/Fogo</TableHead>
                <TableHead>Marca/Modelo</TableHead>
                <TableHead>Medida</TableHead>
                <TableHead>Vida Útil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Veículo/Posição</TableHead>
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
                   <TableCell>{tire.size}</TableCell>
                   <TableCell>
                        <Badge variant={tire.lifespan.startsWith('100') || tire.lifespan.startsWith('9') ? 'default' : tire.lifespan.startsWith('0') ? 'destructive' : 'secondary'} className={tire.lifespan.startsWith('100') || tire.lifespan.startsWith('9') || tire.lifespan.startsWith('8') ? 'bg-green-500 hover:bg-green-600' : ''}>
                            {tire.lifespan}
                        </Badge>
                    </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[tire.status] || 'secondary'}>
                      {tire.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{tire.vehicle !== '-' ? `${tire.vehicle} / ${tire.position}` : 'Em Estoque'}</TableCell>
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
                        <DropdownMenuItem><Eye className="mr-2"/>Ver Detalhes</DropdownMenuItem>
                        <DropdownMenuItem><Truck className="mr-2"/>Movimentar</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <MaintenanceDialog tireId={tire.id} />
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
