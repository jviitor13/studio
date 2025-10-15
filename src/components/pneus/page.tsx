
"use client";

import * as React from "react";
import { PlusCircle, MoreHorizontal, Eye, Truck, Settings, Wrench, Calendar as CalendarIcon, Ban, Paperclip, Trash2, Loader2 } from "lucide-react";
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Calendar } from "@/components/ui/calendar";
// Firebase imports removed - using Django backend
// Firebase imports removed - using Django backend
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { compressImage } from "@/lib/image-compressor";
import Image from "next/image";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";


interface Tire {
    id: string;
    fireId: string;
    serial: string;
    brand: string;
    model: string;
    mfgDate: string;
    size: string;
    indices: string;
    type: string;
    status: "Em Uso" | "Em Estoque" | "Em Manutenção" | "Sucateado" | "Novo";
    retreads: number;
    lifespan: number;
    vehicleId?: string;
    position?: string;
    pressure?: string;
    depth?: string;
    photoUrl?: string;
}

interface Vehicle {
  id: string; // This is the plate
  plate: string;
  model: string;
}

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  "Em Uso": "default",
  "Novo": "default",
  "Em Estoque": "secondary",
  "Em Manutenção": "outline",
  "Sucateado": "destructive",
};

const TireDetailsDialog = ({ tire, open, onOpenChange }: { tire: Tire | null, open: boolean, onOpenChange: (open: boolean) => void }) => {
    if (!tire) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Detalhes do Pneu: {tire.fireId}</DialogTitle>
                    <DialogDescription>{tire.brand} {tire.model} - {tire.size}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto px-2 text-sm">
                    {tire.photoUrl && (
                        <div className="relative w-full aspect-video rounded-md overflow-hidden border">
                            <Image src={tire.photoUrl} alt={`Foto do pneu ${tire.fireId}`} fill className="object-contain" />
                        </div>
                    )}
                    <div className="space-y-2">
                        <h4 className="font-semibold text-base">Identificação</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-2 border rounded-md">
                            <div><span className="font-medium text-muted-foreground">ID/Fogo:</span> {tire.fireId}</div>
                            <div><span className="font-medium text-muted-foreground">Marca:</span> {tire.brand}</div>
                            <div><span className="font-medium text-muted-foreground">Nº de Série:</span> {tire.serial || 'N/A'}</div>
                            <div><span className="font-medium text-muted-foreground">Modelo:</span> {tire.model}</div>
                            <div><span className="font-medium text-muted-foreground">Data Fab.:</span> {tire.mfgDate || 'N/A'}</div>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <h4 className="font-semibold text-base">Especificações Técnicas</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-2 border rounded-md">
                            <div><span className="font-medium text-muted-foreground">Medida:</span> {tire.size}</div>
                            <div><span className="font-medium text-muted-foreground">Índices:</span> {tire.indices || 'N/A'}</div>
                            <div><span className="font-medium text-muted-foreground">Tipo:</span> {tire.type || 'N/A'}</div>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <h4 className="font-semibold text-base">Status e Vida Útil</h4>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 p-2 border rounded-md">
                            <div><span className="font-medium text-muted-foreground">Situação:</span> <Badge variant={statusVariant[tire.status]}>{tire.status}</Badge></div>
                             <div><span className="font-medium text-muted-foreground">Vida Útil:</span> {tire.lifespan}%</div>
                            <div><span className="font-medium text-muted-foreground">Nº de Reformas:</span> {tire.retreads}</div>
                            <div>
                                <span className="font-medium text-muted-foreground">Localização:</span> {tire.vehicleId ? `${tire.vehicleId} / ${tire.position}` : 'Em Estoque'}
                            </div>
                        </div>
                    </div>
                </div>
                 <DialogFooter className="mt-4 pt-4 border-t">
                    <Button type="button" onClick={() => onOpenChange(false)}>Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


const MaintenanceDialog = ({ tire }: { tire: Tire }) => {
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const [date, setDate] = React.useState<Date>();

    const handleSendToMaintenance = async () => {
        try {
            const tireRef = doc(db, 'pneus', tire.id);
            await updateDoc(tireRef, {
                status: 'Em Manutenção',
                vehicleId: '',
                position: '',
            });
            toast({
                title: "Envio Registrado!",
                description: `O pneu ${tire.fireId} foi enviado para manutenção.`,
            });
            setOpen(false);
        } catch (error) {
            console.error("Error sending to maintenance:", error);
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível enviar o pneu para manutenção." });
        }
    }
    
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Wrench className="mr-2 h-4 w-4"/>Enviar p/ Manutenção
                </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Enviar Pneu para Manutenção</DialogTitle>
                    <DialogDescription>
                        Preencha os dados para registrar o envio do pneu <span className="font-bold">{tire.fireId}</span>.
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

const ScrapDialog = ({ tire }: { tire: Tire }) => {
    const { toast } = useToast();

    const handleScrapTire = async () => {
        try {
            const tireRef = doc(db, 'pneus', tire.id);
            await updateDoc(tireRef, {
                status: 'Sucateado',
                vehicleId: '',
                position: '',
            });
            
            if (tire.vehicleId) {
                const vehicleRef = doc(db, 'vehicles', tire.vehicleId);
                await setDoc(vehicleRef, { status: "Disponível" }, { merge: true });
            }

            toast({
                title: "Pneu Sucateado!",
                description: `O pneu ${tire.fireId} foi marcado como sucateado.`,
            });
        } catch (error) {
            console.error("Error scrapping tire:", error);
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível sucatear o pneu." });
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                 <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                    <Ban className="mr-2 h-4 w-4" />Sucatear
                </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Sucateamento</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação é irreversível. O pneu <span className="font-bold">{tire.fireId}</span> será marcado como "Sucateado" e não poderá ser utilizado novamente. Deseja continuar?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleScrapTire} className={cn(buttonVariants({variant: "destructive"}))}>Sim, Sucatear</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

const TireMovementDialog = ({ tire }: { tire: Tire }) => {
    const { toast } = useToast();
    const [open, setOpen] = React.useState(false);
    const [vehicles, setVehicles] = React.useState<Vehicle[]>([]);
    const [selectedVehicle, setSelectedVehicle] = React.useState('');
    const [selectedPosition, setSelectedPosition] = React.useState('');

    React.useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "vehicles"), (snapshot) => {
            const vehiclesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
            setVehicles(vehiclesData);
        });
        return () => unsubscribe();
    }, []);

    const handleMoveTire = async () => {
        if (!selectedVehicle || !selectedPosition) {
            toast({ variant: 'destructive', title: "Erro", description: "Selecione o veículo e a posição." });
            return;
        }

        const q = query(collection(db, 'pneus'), where('vehicleId', '==', selectedVehicle), where('position', '==', selectedPosition));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            toast({ variant: 'destructive', title: "Posição Ocupada", description: `A posição ${selectedPosition} no veículo ${selectedVehicle} já está ocupada.` });
            return;
        }

        try {
            const tireRef = doc(db, 'pneus', tire.id);
            await updateDoc(tireRef, {
                status: 'Em Uso',
                vehicleId: selectedVehicle,
                position: selectedPosition,
            });

            const vehicleRef = doc(db, 'vehicles', selectedVehicle);
            await setDoc(vehicleRef, { status: 'Em Viagem' }, { merge: true });

            toast({
                title: "Pneu Movimentado!",
                description: `O pneu ${tire.fireId} foi instalado no veículo ${selectedVehicle}, posição ${selectedPosition}.`,
            });
            setOpen(false);
        } catch (error) {
            console.error("Error moving tire:", error);
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível movimentar o pneu." });
        }
    };

    const tirePositions = [
        { value: "DDE", label: "Dianteiro Direito Externo" },
        { value: "DDD", label: "Dianteiro Esquerdo Externo" },
        { value: "T1EI", label: "1º Eixo Traseiro - Esquerdo Interno" },
        { value: "T1EE", label: "1º Eixo Traseiro - Esquerdo Externo" },
        { value: "T1DI", label: "1º Eixo Traseiro - Direito Interno" },
        { value: "T1DE", label: "1º Eixo Traseiro - Direito Externo" },
        { value: "T2EI", label: "2º Eixo Traseiro - Esquerdo Interno" },
        { value: "T2EE", label: "2º Eixo Traseiro - Esquerdo Externo" },
        { value: "T2DI", label: "2º Eixo Traseiro - Direito Interno" },
        { value: "T2DE", label: "2º Eixo Traseiro - Direito Externo" },
    ];

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <DropdownMenuItem disabled={tire.status !== 'Em Estoque' && tire.status !== 'Novo'} onSelect={(e) => e.preventDefault()}>
                    <Truck className="mr-2 h-4 w-4"/>Movimentar
                </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Movimentar Pneu</DialogTitle>
                    <DialogDescription>
                        Instale o pneu <span className="font-bold">{tire.fireId}</span> em um veículo.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid items-center gap-2">
                        <Label htmlFor="vehicle-select">Veículo de Destino</Label>
                        <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                            <SelectTrigger id="vehicle-select"><SelectValue placeholder="Selecione um veículo..." /></SelectTrigger>
                            <SelectContent>
                                {vehicles.map(v => <SelectItem key={v.id} value={v.plate}>{v.plate} - {v.model}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid items-center gap-2">
                        <Label htmlFor="position-select">Posição de Instalação</Label>
                        <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                            <SelectTrigger id="position-select"><SelectValue placeholder="Selecione uma posição..." /></SelectTrigger>
                            <SelectContent>
                                {tirePositions.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button type="submit" onClick={handleMoveTire}>Confirmar Movimentação</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const NewTireDialog = ({ open, onOpenChange, onSave }: { open: boolean; onOpenChange: (open: boolean) => void; onSave: (data: any) => Promise<void> }) => {
    const [photo, setPhoto] = React.useState<string | undefined>(undefined);
    const [isCompressing, setIsCompressing] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const photoInputRef = React.useRef<HTMLInputElement>(null);
    const formRef = React.useRef<HTMLFormElement>(null);
    const { toast } = useToast();

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setIsCompressing(true);
            try {
                const compressedImage = await compressImage(file);
                setPhoto(compressedImage);
                setError(null);
            } catch (err) {
                toast({
                    variant: "destructive",
                    title: "Erro ao comprimir imagem",
                });
            } finally {
                setIsCompressing(false);
            }
            e.target.value = "";
        }
    };
    
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (!photo) {
            setError("A foto do pneu é obrigatória.");
            return;
        }

        const formData = new FormData(event.currentTarget);
        const data = Object.fromEntries(formData.entries());
        
        const newTire = {
            ...data,
            photoUrl: photo,
        };

        await onSave(newTire);
        // Reset state on successful save
        setPhoto(undefined);
        setError(null);
        formRef.current?.reset();
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <form onSubmit={handleSubmit} ref={formRef}>
                    <DialogHeader>
                        <DialogTitle>Cadastro Detalhado de Pneu</DialogTitle>
                        <DialogDescription>
                            Preencha todos os dados para um controle preciso do pneu.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto px-2">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Dados de Identificação</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="id">ID / Fogo 🔥 *</Label>
                                    <Input id="id" name="id" placeholder="Ex: PNEU-006" required/>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="serial">Número de Série</Label>
                                    <Input id="serial" name="serial" placeholder="Ex: Y78SDFG89" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="brand">Marca *</Label>
                                    <Input id="brand" name="brand" placeholder="Ex: Michelin" required/>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="model">Modelo *</Label>
                                    <Input id="model" name="model" placeholder="Ex: X Multi Z" required/>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="mfg-date">Data de Fabricação</Label>
                                    <Input id="mfg-date" name="mfg-date" type="week" />
                                </div>
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Especificações Técnicas</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="size">Medida *</Label>
                                    <Input id="size" name="size" placeholder="Ex: 275/80 R22.5" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="indices">Índice Carga/Velocidade</Label>
                                    <Input id="indices" name="indices" placeholder="Ex: 149/146L" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="type">Tipo (Construção)</Label>
                                    <Select name="type" defaultValue="radial">
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
                         <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Foto do Pneu</h3>
                            <div className="grid gap-2">
                                <Label>Anexar Foto *</Label>
                                {photo ? (
                                    <div className="relative w-full max-w-xs aspect-video rounded-md overflow-hidden">
                                        <Image src={photo} alt="Foto do pneu" fill className="object-cover" />
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2 h-7 w-7"
                                            onClick={() => setPhoto(undefined)}
                                            disabled={isCompressing}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <Input
                                            id="photo-tire"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            capture="environment"
                                            onChange={handleImageUpload}
                                            ref={photoInputRef}
                                            disabled={isCompressing}
                                        />
                                        <Button type="button" variant="outline" onClick={() => photoInputRef.current?.click()} disabled={isCompressing}>
                                            {isCompressing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Paperclip className="mr-2 h-4 w-4" />}
                                            {isCompressing ? 'Processando...' : 'Anexar arquivo'}
                                        </Button>
                                    </>
                                )}
                                {error && (
                                    <Alert variant="destructive" className="mt-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle>{error}</AlertTitle>
                                    </Alert>
                                )}
                            </div>
                        </div>
                        <Separator />
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Status e Vida Útil</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Situação Atual</Label>
                                    <Select name="status" defaultValue="Novo">
                                        <SelectTrigger id="status"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Novo">Novo (em estoque)</SelectItem>
                                            <SelectItem value="Em Estoque">Em Estoque</SelectItem>
                                            <SelectItem value="Em Uso">Em uso</SelectItem>
                                            <SelectItem value="Em Manutenção">Em manutenção</SelectItem>
                                            <SelectItem value="Sucateado">Sucateado</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="retreads">Número de Reformas</Label>
                                    <Input id="retreads" name="retreads" type="number" defaultValue={0} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="lifespan">Vida Útil Estimada (%)</Label>
                                    <Input id="lifespan" name="lifespan" type="number" placeholder="Ex: 85" defaultValue={100} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="mt-4 pt-4 border-t">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit">Salvar Pneu</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
};

export default function PneusPage() {
    const { toast } = useToast();
    const [openNewTireDialog, setOpenNewTireDialog] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);
    const [tires, setTires] = React.useState<Tire[]>([]);
    const [isDetailsDialogOpen, setIsDetailsDialogOpen] = React.useState(false);
    const [selectedTire, setSelectedTire] = React.useState<Tire | null>(null);

    React.useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "pneus"), (snapshot) => {
            const tiresData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tire));
            setTires(tiresData);
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSaveNewTire = async (data: any) => {
        const newTire = {
            fireId: data.id as string,
            serial: data.serial as string,
            brand: data.brand as string,
            model: data.model as string,
            mfgDate: data['mfg-date'] as string,
            size: data.size as string,
            indices: data.indices as string,
            type: data.type as string,
            status: data.status as Tire['status'],
            retreads: Number(data.retreads),
            lifespan: Number(data.lifespan),
            vehicleId: '',
            position: '',
            photoUrl: data.photoUrl,
        };

        if (!newTire.fireId || !newTire.brand || !newTire.model || !newTire.size) {
            toast({ variant: "destructive", title: "Erro", description: "Preencha todos os campos obrigatórios." });
            return;
        }

        try {
            await addDoc(collection(db, 'pneus'), newTire);
            toast({ title: "Sucesso!", description: "Novo pneu cadastrado." });
            setOpenNewTireDialog(false);
        } catch (error) {
            console.error("Error adding new tire:", error);
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível cadastrar o pneu." });
        }
    }

  return (
    <>
      <TireDetailsDialog tire={selectedTire} open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen} />
      <NewTireDialog open={openNewTireDialog} onOpenChange={setOpenNewTireDialog} onSave={handleSaveNewTire} />
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Gestão de Pneus"
          description="Gerencie o ciclo de vida completo dos pneus da sua frota."
        >
          <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
            <Link href="/pneus/visualizacao" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar por Veículo
              </Button>
            </Link>
            <Link href="/pneus/manutencao" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full">
                  <Wrench className="mr-2 h-4 w-4" />
                  Acompanhar Manutenções
              </Button>
            </Link>
            <Button className="w-full sm:w-auto" onClick={() => setOpenNewTireDialog(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Adicionar Pneu
            </Button>
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
            <div className="overflow-x-auto">
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
                  {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7}>
                            <Skeleton className="h-24 w-full" />
                        </TableCell>
                      </TableRow>
                  ) : (
                    tires.map((tire) => (
                        <TableRow key={tire.id}>
                        <TableCell className="font-medium">{tire.fireId}</TableCell>
                        <TableCell>{tire.brand} {tire.model}</TableCell>
                        <TableCell>{tire.size}</TableCell>
                        <TableCell>
                                <Badge variant={tire.lifespan > 75 ? 'default' : tire.lifespan < 25 ? 'destructive' : 'secondary'} className={tire.lifespan > 75 ? 'bg-green-500 hover:bg-green-600' : ''}>
                                    {tire.lifespan}%
                                </Badge>
                            </TableCell>
                        <TableCell>
                            <Badge variant={statusVariant[tire.status] || 'secondary'}>
                            {tire.status}
                            </Badge>
                        </TableCell>
                        <TableCell>{tire.vehicleId ? `${tire.vehicleId} / ${tire.position}` : 'Em Estoque'}</TableCell>
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
                                <DropdownMenuItem onSelect={() => { setSelectedTire(tire); setIsDetailsDialogOpen(true); }}>
                                  <Eye className="mr-2 h-4 w-4"/>Ver Detalhes
                                </DropdownMenuItem>
                                <TireMovementDialog tire={tire} />
                                <DropdownMenuSeparator />
                                <MaintenanceDialog tire={tire} />
                                <ScrapDialog tire={tire} />
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    ))
                  )}
                  {!isLoading && tires.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={7} className="text-center h-24">
                                Nenhum pneu cadastrado.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
