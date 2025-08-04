
"use client";

import * as React from "react";
import { PlusCircle, Wrench, History, MoreHorizontal, Play, Ban, CheckCircle } from "lucide-react";
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
import { PageHeader } from "@/components/page-header";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { collection, addDoc, onSnapshot, doc, updateDoc, Timestamp, query, orderBy, setDoc } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";


interface Maintenance {
    id: string;
    vehicleId: string;
    serviceType: string;
    scheduledDate: string;
    status: "Agendada" | "Em Andamento" | "Concluída" | "Cancelada";
    createdAt: string;
    cost?: number;
    startedAt?: Timestamp;
    completedAt?: Timestamp;
}

interface Vehicle {
    id: string;
    plate: string;
    model: string;
}

const maintenanceSchema = z.object({
    vehicleId: z.string().min(1, "A seleção do veículo é obrigatória."),
    serviceType: z.string().min(3, "O tipo de serviço é obrigatório."),
    scheduledDate: z.date({ required_error: "A data do agendamento é obrigatória." }),
});

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;


const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  "Agendada": "secondary",
  "Em Andamento": "default",
  "Concluída": "outline",
  "Cancelada": "destructive",
};

export default function ManutencoesPage() {
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const [openCompleteDialog, setOpenCompleteDialog] = React.useState(false);
    const [selectedMaintenance, setSelectedMaintenance] = React.useState<Maintenance | null>(null);
    const [maintenanceCost, setMaintenanceCost] = React.useState<string>("");

    const [maintenances, setMaintenances] = React.useState<Maintenance[]>([]);
    const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);

    const { control, handleSubmit, register, formState: { errors, isSubmitting }, reset } = useForm<MaintenanceFormValues>({
      resolver: zodResolver(maintenanceSchema),
    });

    React.useEffect(() => {
        const q = query(collection(db, "manutencoes"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: (doc.data().createdAt as Timestamp).toDate().toISOString(),
                scheduledDate: (doc.data().scheduledDate as Timestamp).toDate().toISOString(),
            } as Maintenance));
            setMaintenances(data);
            setIsLoading(false);
        });
        
        const unsubscribeVehicles = onSnapshot(collection(db, "vehicles"), (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
            setVehicles(data);
        });

        return () => {
          unsubscribe();
          unsubscribeVehicles();
        };
    }, []);

    const onSubmit = async (data: MaintenanceFormValues) => {
        try {
            await addDoc(collection(db, "manutencoes"), {
                ...data,
                scheduledDate: Timestamp.fromDate(data.scheduledDate),
                status: "Agendada",
                createdAt: Timestamp.now(),
            });
            toast({
                title: "Agendamento Criado!",
                description: "A manutenção foi adicionada à agenda.",
            });
            setOpen(false);
            reset();
        } catch (error) {
            console.error("Error creating maintenance:", error);
            toast({
                variant: "destructive",
                title: "Erro ao Agendar",
                description: "Não foi possível criar o agendamento. Tente novamente."
            });
        }
    };
    
    const updateMaintenanceStatus = async (maintenance: Maintenance, status: Maintenance['status']) => {
        try {
            const docRef = doc(db, 'manutencoes', maintenance.id);
            let updates: any = { status };
            const vehicleRef = doc(db, 'vehicles', maintenance.vehicleId);

            if (status === 'Em Andamento') {
                updates.startedAt = Timestamp.now();
                 await updateDoc(vehicleRef, { status: 'Em Manutenção' });
            }
            if (status === 'Cancelada') {
                 await updateDoc(vehicleRef, { status: 'Disponível' });
            }
            await updateDoc(docRef, updates);
            toast({
                title: "Status Atualizado!",
                description: `A manutenção foi marcada como "${status}".`
            });
        } catch (error) {
            console.error("Error updating status:", error);
            toast({
                variant: "destructive",
                title: "Erro ao Atualizar",
                description: "Não foi possível alterar o status da manutenção."
            });
        }
    }
    
     const handleCompleteMaintenance = async () => {
        if (!selectedMaintenance || !maintenanceCost) {
            toast({ variant: 'destructive', title: "Erro", description: "O custo da manutenção é obrigatório." });
            return;
        }

        try {
            const maintenanceRef = doc(db, 'manutencoes', selectedMaintenance.id);
            await updateDoc(maintenanceRef, {
                status: 'Concluída',
                completedAt: Timestamp.now(),
                cost: parseFloat(maintenanceCost.replace(',', '.')),
            });
            
            const vehicleRef = doc(db, 'vehicles', selectedMaintenance.vehicleId);
            await updateDoc(vehicleRef, { status: 'Disponível' });

            toast({
                title: "Manutenção Concluída!",
                description: `O serviço no veículo ${selectedMaintenance.vehicleId} foi finalizado.`,
            });
            setOpenCompleteDialog(false);
            setSelectedMaintenance(null);
            setMaintenanceCost("");
        } catch (error) {
            console.error("Error completing maintenance:", error);
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível finalizar a manutenção." });
        }
    };
    
    const formatDate = (dateString: string) => {
        if (!dateString) return 'N/A';
        return format(new Date(dateString), "dd/MM/yyyy");
    };
    
    const scheduledMaintenances = maintenances.filter(m => m.status === 'Agendada' || m.status === 'Em Andamento');
    const historyMaintenances = maintenances.filter(m => m.status === 'Concluída' || m.status === 'Cancelada');


  return (
    <>
    {/* Dialog for completing maintenance */}
    <Dialog open={openCompleteDialog} onOpenChange={setOpenCompleteDialog}>
        <DialogContent>
             <DialogHeader>
                <DialogTitle>Concluir Manutenção</DialogTitle>
                <DialogDescription>
                    Informe o custo final para concluir o serviço no veículo <span className="font-bold">{selectedMaintenance?.vehicleId}</span>.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                 <div className="grid items-center gap-2">
                    <Label htmlFor="cost">Custo Total (R$)</Label>
                    <Input 
                        id="cost" 
                        type="text" 
                        placeholder="Ex: 1500,50" 
                        value={maintenanceCost} 
                        onChange={(e) => setMaintenanceCost(e.target.value)} 
                    />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpenCompleteDialog(false)}>Cancelar</Button>
                <Button type="button" onClick={handleCompleteMaintenance}>Concluir Serviço</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Manutenções"
        description="Acompanhe e agende as manutenções da frota."
      >
        <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) reset(); }}>
          <DialogTrigger asChild>
             <Button>
                <PlusCircle className="mr-2" />
                Agendar Manutenção
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit(onSubmit)}>
                <DialogHeader>
                <DialogTitle>Agendar Nova Manutenção</DialogTitle>
                <DialogDescription>
                    Preencha os detalhes para agendar um novo serviço de manutenção.
                </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                <div className="grid items-center gap-2">
                    <Label htmlFor="vehicleId">Veículo *</Label>
                    <Controller
                        name="vehicleId"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger id="vehicleId" className={cn(errors.vehicleId && "border-destructive")}>
                                    <SelectValue placeholder="Selecione a placa" />
                                </SelectTrigger>
                                <SelectContent>
                                    {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.id} - {v.model}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                    />
                    {errors.vehicleId && <p className="text-sm text-destructive mt-1">{errors.vehicleId.message}</p>}
                </div>
                <div className="grid items-center gap-2">
                    <Label htmlFor="serviceType">Tipo de Serviço *</Label>
                    <Input id="serviceType" placeholder="Ex: Troca de óleo, Revisão de freios" {...register("serviceType")} className={cn(errors.serviceType && "border-destructive")} />
                    {errors.serviceType && <p className="text-sm text-destructive mt-1">{errors.serviceType.message}</p>}
                </div>
                <div className="grid items-center gap-2">
                    <Label htmlFor="scheduledDate">Data do Agendamento *</Label>
                    <Controller
                        name="scheduledDate"
                        control={control}
                        render={({ field }) => (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                    id="scheduledDate"
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !field.value && "text-muted-foreground",
                                        errors.scheduledDate && "border-destructive"
                                    )}
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "PPP") : <span>Selecione a data</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        )}
                    />
                    {errors.scheduledDate && <p className="text-sm text-destructive mt-1">{errors.scheduledDate.message}</p>}
                </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? 'Agendando...' : 'Agendar'}
                    </Button>
                </DialogFooter>
            </form>
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
                    <TableHead>Veículo</TableHead>
                    <TableHead>Serviço</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                     <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={5}><Skeleton className="h-24 w-full" /></TableCell></TableRow>
                  ) : scheduledMaintenances.length > 0 ? (
                    scheduledMaintenances.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.vehicleId}</TableCell>
                            <TableCell>{item.serviceType}</TableCell>
                            <TableCell>{formatDate(item.scheduledDate)}</TableCell>
                            <TableCell><Badge variant={statusVariant[item.status]}>{item.status}</Badge></TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                        {item.status === 'Agendada' && (
                                            <DropdownMenuItem onSelect={() => updateMaintenanceStatus(item, 'Em Andamento')}>
                                                <Play className="mr-2 h-4 w-4" /> Iniciar Serviço
                                            </DropdownMenuItem>
                                        )}
                                        {item.status === 'Em Andamento' && (
                                            <DropdownMenuItem onSelect={() => {
                                                setSelectedMaintenance(item);
                                                setOpenCompleteDialog(true);
                                            }}>
                                                <CheckCircle className="mr-2 h-4 w-4" /> Concluir Serviço
                                            </DropdownMenuItem>
                                        )}
                                         <DropdownMenuItem className="text-destructive" onSelect={() => updateMaintenanceStatus(item, 'Cancelada')}>
                                            <Ban className="mr-2 h-4 w-4" /> Cancelar Agendamento
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))
                  ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhuma manutenção agendada.
                    </TableCell>
                  </TableRow>
                  )}
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
                    <TableHead>Veículo</TableHead>
                    <TableHead>Serviço Realizado</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Custo</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {isLoading ? (
                    <TableRow><TableCell colSpan={5}><Skeleton className="h-24 w-full" /></TableCell></TableRow>
                   ) : historyMaintenances.length > 0 ? (
                    historyMaintenances.map((item) => (
                        <TableRow key={item.id}>
                             <TableCell className="font-medium">{item.vehicleId}</TableCell>
                            <TableCell>{item.serviceType}</TableCell>
                            <TableCell>{formatDate(item.scheduledDate)}</TableCell>
                             <TableCell>{item.cost ? item.cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/D'}</TableCell>
                            <TableCell><Badge variant={statusVariant[item.status]}>{item.status}</Badge></TableCell>
                        </TableRow>
                    ))
                   ) : (
                   <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Nenhum histórico de manutenção encontrado.
                    </TableCell>
                  </TableRow>
                   )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}


    

    

    