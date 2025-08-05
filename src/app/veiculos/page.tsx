
"use client";

import * as React from "react";
import {
  MoreHorizontal,
  PlusCircle,
  Car,
  Wrench,
  User,
  Trash2,
  Loader2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, doc, deleteDoc, query, where, updateDoc, setDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface Vehicle {
    id: string; // This is the plate
    plate: string;
    model: string;
    year: number;
    fuel: string;
    driver?: string;
    status: "Disponível" | "Em Viagem" | "Em Manutenção";
    nextMaintenance?: string;
}

interface User {
    id: string;
    name: string;
    role: string;
}

const vehicleSchema = z.object({
    plate: z.string().min(7, "A placa deve ter 7 caracteres").max(7, "A placa deve ter 7 caracteres"),
    model: z.string().min(1, "O modelo é obrigatório"),
    year: z.coerce.number().min(1980, "Ano inválido").max(new Date().getFullYear() + 1, "Ano inválido"),
    fuel: z.string({ required_error: "O combustível é obrigatório."}).min(1, "O tipo de combustível é obrigatório"),
});

type VehicleFormValues = z.infer<typeof vehicleSchema>;


const statusVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
  "Em Viagem": "default",
  "Disponível": "secondary",
  "Em Manutenção": "destructive",
};

const VehicleDetailsDialog = ({ vehicle }: { vehicle: Vehicle | null }) => {
    if (!vehicle) return null;
    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Detalhes do Veículo: {vehicle.plate}</DialogTitle>
                <DialogDescription>{vehicle.model} - {vehicle.year}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                    <span className="font-semibold">Placa:</span>
                    <span>{vehicle.plate}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <span className="font-semibold">Modelo:</span>
                    <span>{vehicle.model}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <span className="font-semibold">Ano:</span>
                    <span>{vehicle.year}</span>
                </div>
                 <div className="grid grid-cols-2 gap-2">
                    <span className="font-semibold">Combustível:</span>
                    <span className="capitalize">{vehicle.fuel}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <span className="font-semibold">Status:</span>
                     <Badge variant={statusVariant[vehicle.status] || "default"} className="w-fit">{vehicle.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <span className="font-semibold">Motorista Atual:</span>
                    <span>{vehicle.driver || "Nenhum motorista atribuído"}</span>
                </div>
                 <div className="grid grid-cols-2 gap-2">
                    <span className="font-semibold">Próxima Manutenção:</span>
                    <span>{vehicle.nextMaintenance || "Não agendada"}</span>
                </div>
            </div>
            <DialogFooter>
                 <DialogTrigger asChild><Button variant="outline">Fechar</Button></DialogTrigger>
            </DialogFooter>
        </DialogContent>
    );
};

const AssignDriverDialog = ({ vehicle, onAssign }: { vehicle: Vehicle | null, onAssign: (driverName: string) => void }) => {
    const [drivers, setDrivers] = React.useState<User[]>([]);
    const [selectedDriver, setSelectedDriver] = React.useState("");

    React.useEffect(() => {
        if (vehicle) {
            const q = query(collection(db, "users"), where("role", "==", "Motorista"));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const driversData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
                setDrivers(driversData);
            });
            return () => unsubscribe();
        }
    }, [vehicle]);

    if (!vehicle) return null;

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Atribuir Motorista ao Veículo {vehicle.plate}</DialogTitle>
                <DialogDescription>
                    Selecione um motorista da lista para vincular a este veículo.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <Label htmlFor="driver-select">Motoristas Disponíveis</Label>
                <Select value={selectedDriver} onValueChange={setSelectedDriver}>
                    <SelectTrigger id="driver-select">
                        <SelectValue placeholder="Selecione um motorista..." />
                    </SelectTrigger>
                    <SelectContent>
                        {drivers.map(driver => (
                            <SelectItem key={driver.id} value={driver.name}>{driver.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <DialogFooter>
                 <DialogTrigger asChild><Button variant="ghost">Cancelar</Button></DialogTrigger>
                <Button onClick={() => onAssign(selectedDriver)} disabled={!selectedDriver}>Atribuir</Button>
            </DialogFooter>
        </DialogContent>
    );
}

export default function VeiculosPage() {
    const { toast } = useToast();
    const [openNewVehicleDialog, setOpenNewVehicleDialog] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = React.useState<Vehicle | null>(null);
    const [dialogType, setDialogType] = React.useState<"details" | "assign" | null>(null);


    const { control, register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<VehicleFormValues>({
        resolver: zodResolver(vehicleSchema),
    });

    React.useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "vehicles"), (snapshot) => {
            const vehiclesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
            setVehicles(vehiclesData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const onSubmit = async (data: VehicleFormValues) => {
        try {
            const vehicleId = data.plate.toUpperCase();
            const vehicleRef = doc(db, "vehicles", vehicleId);
            await setDoc(vehicleRef, {
                plate: vehicleId,
                model: data.model,
                year: data.year,
                fuel: data.fuel,
                status: "Disponível",
                driver: "",
            });

            toast({
                title: "Veículo Adicionado!",
                description: `O veículo ${data.model} (${vehicleId}) foi cadastrado com sucesso.`,
            });
            setOpenNewVehicleDialog(false);
            reset();
        } catch (error) {
            console.error("Error adding vehicle: ", error);
            toast({
                variant: "destructive",
                title: "Erro ao Salvar",
                description: "Não foi possível adicionar o veículo. Tente novamente.",
            });
        }
    }

    const handleDeleteVehicle = async (vehicleId: string) => {
        try {
            await deleteDoc(doc(db, "vehicles", vehicleId));
            toast({
                title: "Veículo Excluído",
                description: "O veículo foi removido com sucesso.",
            });
        } catch (error) {
            console.error("Error deleting vehicle: ", error);
            toast({
                variant: "destructive",
                title: "Erro ao Excluir",
                description: "Não foi possível remover o veículo.",
            });
        }
    }
    
    const handleAssignDriver = async (driverName: string) => {
        if (!selectedVehicle) return;
        try {
            const vehicleRef = doc(db, 'vehicles', selectedVehicle.id);
            await updateDoc(vehicleRef, { driver: driverName });
            toast({
                title: "Motorista Atribuído!",
                description: `${driverName} foi atribuído ao veículo ${selectedVehicle.plate}.`,
            });
            setDialogType(null);
        } catch (error) {
            console.error("Error assigning driver:", error);
            toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível atribuir o motorista.' });
        }
    };


  return (
    <>
      <PageHeader
        title="Frota de Veículos"
        description="Gerencie todos os veículos cadastrados na sua frota."
      >
        <Dialog open={openNewVehicleDialog} onOpenChange={(isOpen) => { setOpenNewVehicleDialog(isOpen); if (!isOpen) reset(); }}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2" />
              Adicionar Veículo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader>
                <DialogTitle>Adicionar Novo Veículo</DialogTitle>
                <DialogDescription>
                    Preencha as informações para cadastrar um novo veículo.
                </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                <div className="grid items-center gap-2">
                    <Label htmlFor="plate">Placa</Label>
                    <Input id="plate" placeholder="RDO1A12" {...register("plate")} />
                    {errors.plate && <p className="text-sm text-destructive">{errors.plate.message}</p>}
                </div>
                <div className="grid items-center gap-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input id="model" placeholder="Scania R450" {...register("model")} />
                     {errors.model && <p className="text-sm text-destructive">{errors.model.message}</p>}
                </div>
                <div className="grid items-center gap-2">
                    <Label htmlFor="year">Ano</Label>
                    <Input id="year" type="number" placeholder="2023" {...register("year")} />
                    {errors.year && <p className="text-sm text-destructive">{errors.year.message}</p>}
                </div>
                <div className="grid items-center gap-2">
                    <Label htmlFor="fuel">Combustível</Label>
                     <Controller
                        name="fuel"
                        control={control}
                        render={({ field }) => (
                           <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger id="fuel">
                                    <SelectValue placeholder="Selecione o tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="diesel">Diesel</SelectItem>
                                    <SelectItem value="etanol">Etanol</SelectItem>
                                    <SelectItem value="eletrico">Elétrico</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    />
                     {errors.fuel && <p className="text-sm text-destructive">{errors.fuel.message}</p>}
                </div>
                </div>
                <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpenNewVehicleDialog(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Veículo
                </Button>
                </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Veículos</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os veículos da sua frota.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={!!dialogType} onOpenChange={() => setDialogType(null)}>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Placa</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Motorista Atual</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Próxima Manutenção</TableHead>
                    <TableHead>
                    <span className="sr-only">Ações</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {isLoading ? (
                    <TableRow>
                        <TableCell colSpan={6}>
                            <Skeleton className="h-24 w-full" />
                        </TableCell>
                    </TableRow>
                ) : vehicles.length > 0 ? (
                    vehicles.map((vehicle) => (
                        <TableRow key={vehicle.id}>
                        <TableCell className="font-medium">{vehicle.plate}</TableCell>
                        <TableCell>{vehicle.model}</TableCell>
                        <TableCell>{vehicle.driver || "N/A"}</TableCell>
                        <TableCell>
                            <Badge variant={statusVariant[vehicle.status] || "default"}>
                            {vehicle.status}
                            </Badge>
                        </TableCell>
                        <TableCell>{vehicle.nextMaintenance || 'N/A'}</TableCell>
                        <TableCell>
                            <AlertDialog>
                                <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                    <MoreHorizontal className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                    <DialogTrigger asChild>
                                        <DropdownMenuItem onSelect={() => { setSelectedVehicle(vehicle); setDialogType("details"); }}>
                                            <Car className="mr-2 h-4 w-4" /> Ver Detalhes
                                        </DropdownMenuItem>
                                    </DialogTrigger>
                                    <DropdownMenuItem asChild>
                                    <Link href="/manutencoes">
                                        <Wrench className="mr-2 h-4 w-4" /> Agendar Manutenção
                                    </Link>
                                    </DropdownMenuItem>
                                    <DialogTrigger asChild>
                                        <DropdownMenuItem onSelect={() => { setSelectedVehicle(vehicle); setDialogType("assign"); }}>
                                            <User className="mr-2 h-4 w-4" /> Atribuir Motorista
                                        </DropdownMenuItem>
                                    </DialogTrigger>
                                    <AlertDialogTrigger asChild>
                                        <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                        </DropdownMenuItem>
                                    </AlertDialogTrigger>
                                </DropdownMenuContent>
                                </DropdownMenu>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta ação não pode ser desfeita. O veículo <span className="font-bold">{vehicle.plate}</span> será excluído permanentemente.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteVehicle(vehicle.id)} className={cn(buttonVariants({ variant: "destructive" }))}>
                                            Sim, Excluir
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                            Nenhum veículo cadastrado.
                        </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            {dialogType === "details" && <VehicleDetailsDialog vehicle={selectedVehicle} />}
            {dialogType === "assign" && <AssignDriverDialog vehicle={selectedVehicle} onAssign={handleAssignDriver} />}
           </Dialog>
        </CardContent>
      </Card>
    </>
  );
}

    
