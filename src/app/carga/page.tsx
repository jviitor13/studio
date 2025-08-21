
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { collection, Timestamp, onSnapshot, getDocs, addDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Clock, FileText, Send } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import { SelfieCapture } from '@/components/selfie-capture';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';

const cargaSchema = z.object({
  vehicleId: z.string().min(1, 'A seleção do veículo é obrigatória.'),
  driverName: z.string().min(1, 'O nome do motorista é obrigatório.'),
  operationType: z.enum(['carga', 'descarga'], { required_error: "Selecione o tipo de operação."}),
  startTime: z.instanceof(Date).nullable(),
  endTime: z.instanceof(Date).nullable(),
  initialCargoPhoto: z.string().optional(),
  finalCargoPhoto: z.string().optional(),
  documentPhoto: z.string().optional(),
  observations: z.string().optional(),
});

type CargaFormValues = z.infer<typeof cargaSchema>;

interface Vehicle {
    id: string; 
    plate: string;
    model: string;
}

export default function CargaPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [user, setUser] = useState(auth.currentUser);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);
    
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(setUser);
        return () => unsubscribe();
    }, []);

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
        register,
        watch,
        setValue,
        getValues,
    } = useForm<CargaFormValues>({
        resolver: zodResolver(cargaSchema),
        defaultValues: {
            vehicleId: '',
            driverName: user?.displayName || '',
            startTime: null,
            endTime: null,
        },
    });

    useEffect(() => {
        if (user?.displayName) {
          setValue('driverName', user.displayName);
        }
    }, [user, setValue]);

    useEffect(() => {
        const fetchVehicles = async () => {
            setIsLoadingVehicles(true);
            try {
                const querySnapshot = await getDocs(collection(db, "veiculos"));
                const vehiclesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
                setVehicles(vehiclesData);
            } catch (error) {
                console.error("Error fetching vehicles: ", error);
                toast({
                    variant: "destructive",
                    title: "Erro ao Carregar Veículos",
                });
            } finally {
                setIsLoadingVehicles(false);
            }
        };
        fetchVehicles();
    }, [toast]);
    
    const onSubmit = async (data: CargaFormValues) => {
        if (!data.startTime || !data.endTime) {
            toast({
                variant: 'destructive',
                title: 'Operação Incompleta',
                description: 'Você precisa registrar o início e o fim da operação.'
            });
            return;
        }

        try {
            await addDoc(collection(db, 'cargo-operations'), {
                ...data,
                startTime: Timestamp.fromDate(data.startTime),
                endTime: Timestamp.fromDate(data.endTime),
                createdAt: Timestamp.now()
            });
            toast({ title: 'Sucesso!', description: 'Registro de carga/descarga salvo.'});
            router.push('/dashboard');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao Salvar', description: 'Não foi possível salvar o registro.'});
        }
    };
    
    const startTime = watch('startTime');
    const endTime = watch('endTime');

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="mx-auto grid w-full max-w-4xl gap-6">
            <PageHeader
                title="Controle de Carga e Descarga"
                description="Registre o início e o fim das operações de carregamento."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Informações da Operação</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="vehicleId">Veículo *</Label>
                        {isLoadingVehicles ? <p>Carregando veículos...</p> : (
                            <Controller
                                name="vehicleId"
                                control={control}
                                render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger id="vehicleId" className={cn(errors.vehicleId && "border-destructive")}>
                                    <SelectValue placeholder="Selecione a placa" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vehicles.map(v => (
                                            <SelectItem key={v.id} value={v.id}>{v.plate} - {v.model}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                )}
                            />
                        )}
                        {errors.vehicleId && <p className="text-sm text-destructive">{errors.vehicleId.message}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="driverName">Nome do Motorista *</Label>
                        <Input id="driverName" {...register('driverName')} className={cn(errors.driverName && "border-destructive")} />
                         {errors.driverName && <p className="text-sm text-destructive">{errors.driverName.message}</p>}
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                        <Label>Tipo de Operação</Label>
                        <Controller 
                            name="operationType"
                            control={control}
                            render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <SelectTrigger className={cn(errors.operationType && "border-destructive")}>
                                        <SelectValue placeholder="Selecione Carga ou Descarga" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="carga">Carga</SelectItem>
                                        <SelectItem value="descarga">Descarga</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                         {errors.operationType && <p className="text-sm text-destructive">{errors.operationType.message}</p>}
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Controle de Tempo</CardTitle>
                    <CardDescription>Use os botões para registrar o início e o fim da operação.</CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                        <Button type="button" size="lg" disabled={!!startTime} onClick={() => setValue('startTime', new Date())}>
                            <Clock className="mr-2" /> Iniciar Carga/Descarga
                        </Button>
                        {startTime && <p className="text-sm text-center text-muted-foreground">Início: {format(startTime, 'dd/MM/yyyy HH:mm:ss')}</p>}
                    </div>
                     <div className="flex flex-col gap-2">
                        <Button type="button" size="lg" variant="secondary" disabled={!startTime || !!endTime} onClick={() => setValue('endTime', new Date())}>
                            <Clock className="mr-2" /> Finalizar Carga/Descarga
                        </Button>
                        {endTime && <p className="text-sm text-center text-muted-foreground">Fim: {format(endTime, 'dd/MM/yyyy HH:mm:ss')}</p>}
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Anexos Fotográficos</CardTitle>
                    <CardDescription>Capture fotos da carga e dos documentos.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-3 gap-6">
                    <div className="grid gap-3">
                        <Label>Carga (Antes)</Label>
                        <Controller
                            name="initialCargoPhoto"
                            control={control}
                            render={({ field }) => (
                                <SelfieCapture onCapture={field.onChange} />
                            )}
                        />
                    </div>
                     <div className="grid gap-3">
                        <Label>Carga (Depois)</Label>
                        <Controller
                            name="finalCargoPhoto"
                            control={control}
                            render={({ field }) => (
                                <SelfieCapture onCapture={field.onChange} />
                            )}
                        />
                    </div>
                    <div className="grid gap-3">
                        <Label>Documento / NF</Label>
                        <Controller
                            name="documentPhoto"
                            control={control}
                            render={({ field }) => (
                                <SelfieCapture onCapture={field.onChange} />
                            )}
                        />
                    </div>
                </CardContent>
            </Card>
            
             <Card>
                <CardHeader>
                    <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea placeholder="Adicione qualquer observação relevante sobre a carga, descarga ou documentação." {...register('observations')} />
                </CardContent>
            </Card>

            <CardFooter className="border-t px-6 py-4">
                <Button type="submit" size="lg" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    {isSubmitting ? 'Enviando...' : 'Finalizar e Enviar Registro'}
                </Button>
            </CardFooter>

        </form>
    );
}
