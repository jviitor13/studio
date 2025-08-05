
"use client";

import * as React from "react";
import { MoreHorizontal, PlusCircle, Calendar as CalendarIcon, Loader2 } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { PageHeader } from "@/components/page-header";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const fleetData = [
    {
        id: '1',
        truckPlate: 'RDO-1A11',
        trailerPlate: 'CAR-1B11',
        driver: 'João Silva',
        origin: 'São Paulo, SP',
        destination: 'Rio de Janeiro, RJ',
        currentPosition: 'Resende, RJ',
        status: 'Em Viagem'
    },
    {
        id: '2',
        truckPlate: 'RDO-2A22',
        trailerPlate: 'CAR-2B22',
        driver: 'Carlos Pereira',
        origin: 'Aguardando Carga',
        destination: '',
        currentPosition: 'Pátio',
        status: 'Disponível'
    },
     {
        id: '3',
        truckPlate: 'RDO-3A33',
        trailerPlate: 'CAR-3B33',
        driver: 'Ana Costa',
        origin: 'Curitiba, PR',
        destination: 'Porto Alegre, RS',
        currentPosition: 'Florianópolis, SC',
        status: 'Em Viagem'
    },
];

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
  "Em Viagem": "default",
  "Disponível": "secondary",
  "Em Manutenção": "destructive",
};

const NewLoadDialog = ({ vehicleSet }: { vehicleSet: typeof fleetData[0] }) => {
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const [loadingDate, setLoadingDate] = React.useState<Date>();
    const [deliveryDate, setDeliveryDate] = React.useState<Date>();
    
    const handleSave = () => {
        toast({
            title: "Carga Marcada!",
            description: `Nova carga para o veículo ${vehicleSet.truckPlate} foi registrada.`
        });
        setOpen(false);
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Marcar Nova Carga
                </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Marcar Nova Carga</DialogTitle>
                    <DialogDescription>
                        Preencha os detalhes do novo frete para o conjunto {vehicleSet.truckPlate} / {vehicleSet.trailerPlate}.
                    </DialogDescription>
                </DialogHeader>
                 <div className="grid gap-4 py-4">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="origin">Origem</Label>
                            <Input id="origin" placeholder="Cidade, UF" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="destination">Destino</Label>
                            <Input id="destination" placeholder="Cidade, UF" />
                        </div>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="company">Empresa</Label>
                        <Input id="company" placeholder="Nome da empresa contratante" />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="loadingDate">Data de Carregamento</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn(!loadingDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{loadingDate ? format(loadingDate, "dd/MM/yyyy") : "Selecione"}</Button>
                                </PopoverTrigger>
                                <PopoverContent><Calendar mode="single" selected={loadingDate} onSelect={setLoadingDate} /></PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="deliveryDate">Data de Entrega</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className={cn(!deliveryDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{deliveryDate ? format(deliveryDate, "dd/MM/yyyy") : "Selecione"}</Button>
                                </PopoverTrigger>
                                <PopoverContent><Calendar mode="single" selected={deliveryDate} onSelect={setDeliveryDate} /></PopoverContent>
                            </Popover>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="freightValue">Valor do Frete (R$)</Label>
                        <Input id="freightValue" type="number" placeholder="Ex: 5500.00" />
                    </div>
                 </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button type="button" onClick={handleSave}>Salvar Carga</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function PosicaoFrotaPage() {

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Posição da Frota"
                description="Acompanhe a localização e o status de cada conjunto de veículos em tempo real."
            />

            <Card>
                 <CardHeader>
                    <CardTitle>Status Atual da Frota</CardTitle>
                    <CardDescription>
                        Lista de todos os conjuntos de veículos e suas viagens atuais.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Cavalo</TableHead>
                                <TableHead>Carreta</TableHead>
                                <TableHead>Motorista</TableHead>
                                <TableHead>Origem / Destino</TableHead>
                                <TableHead>Posição Atual</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead><span className="sr-only">Ações</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fleetData.map((vehicleSet) => (
                                <TableRow key={vehicleSet.id}>
                                    <TableCell className="font-medium">{vehicleSet.truckPlate}</TableCell>
                                    <TableCell className="font-medium">{vehicleSet.trailerPlate}</TableCell>
                                    <TableCell>{vehicleSet.driver}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span>{vehicleSet.origin}</span>
                                            <span className="text-muted-foreground">{vehicleSet.destination}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>{vehicleSet.currentPosition}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusVariant[vehicleSet.status as keyof typeof statusVariant]}>{vehicleSet.status}</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                <NewLoadDialog vehicleSet={vehicleSet} />
                                                <DropdownMenuItem>Ver Detalhes da Viagem</DropdownMenuItem>
                                                <DropdownMenuItem>Atualizar Posição</DropdownMenuItem>
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
    )
}
