
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';

const checklistSchema = z.object({
  vehicleId: z.string().min(1, 'A seleção do veículo é obrigatória.'),
  maintenanceDate: z.string(),
  technicianName: z.string().min(1, 'O nome do técnico é obrigatório.'),
  mileage: z.coerce.number().min(1, 'A quilometragem é obrigatória.'),
  visualInspection: z.object({
    tires: z.boolean().default(false),
    lights: z.boolean().default(false),
    bodywork: z.boolean().default(false),
  }),
  mechanicalCheck: z.object({
    engineOil: z.enum(['OK', 'Baixo', 'Vazamento']),
    brakeFluid: z.enum(['OK', 'Baixo']),
  }),
  observations: z.string().optional(),
});

type ChecklistFormValues = z.infer<typeof checklistSchema>;

export default function MaintenanceChecklistPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
    register,
    watch,
  } = useForm<ChecklistFormValues>({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      vehicleId: '',
      maintenanceDate: format(new Date(), 'dd/MM/yyyy'),
      technicianName: user?.displayName || '',
      mileage: 0,
      visualInspection: {
        tires: false,
        lights: false,
        bodywork: false,
      },
      mechanicalCheck: {
        engineOil: 'OK',
        brakeFluid: 'OK',
      },
      observations: '',
    },
    mode: 'onChange', // Validate on change to enable/disable button
  });

  // Watch user changes to update form default value
  useEffect(() => {
    if (user?.displayName) {
      register('technicianName', { value: user.displayName });
    }
  }, [user, register]);

  const onSubmit = async (data: ChecklistFormValues) => {
    try {
      // 1. Salvar o checklist no Firestore
      const checklistDocRef = await addDoc(collection(db, 'checklists'), {
        ...data,
        createdAt: Timestamp.now(),
        type: 'manutencao',
      });

      // 2. Criar uma nova ordem de serviço vinculada
      const serviceOrderDocRef = await addDoc(collection(db, 'ordens_de_servico'), {
        checklistId: checklistDocRef.id,
        vehicleId: data.vehicleId,
        technicianName: data.technicianName,
        status: 'Aberta',
        createdAt: Timestamp.now(),
        description: 'Ordem de serviço gerada a partir de checklist de manutenção.',
      });

      toast({
        title: "Sucesso!",
        description: "Checklist salvo e ordem de serviço criada.",
      });

      // 3. Redirecionar para a nova ordem de serviço
      router.push(`/ordem-de-servico/${serviceOrderDocRef.id}`);

    } catch (error: any) {
      console.error("Checklist submission error:", error);
      toast({
        variant: "destructive",
        title: "Erro no Envio",
        description: `Não foi possível finalizar o checklist. Detalhes: ${error.message}`,
      });
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6">
      <PageHeader
        title="Checklist de Manutenção"
        description="Preencha os itens para registrar uma nova manutenção."
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Informações Gerais</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                     <div className="grid gap-2">
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
                                    <SelectItem value="RDO1A12">RDO1A12 - Scania R450</SelectItem>
                                    <SelectItem value="RDO2C24">RDO2C24 - MB Actros</SelectItem>
                                    <SelectItem value="RDO3B45">RDO3B45 - Volvo FH 540</SelectItem>
                                </SelectContent>
                            </Select>
                            )}
                        />
                        {errors.vehicleId && <p className="text-sm text-destructive">{errors.vehicleId.message}</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="mileage">Quilometragem Atual *</Label>
                        <Input id="mileage" type="number" {...register('mileage')} className={cn(errors.mileage && "border-destructive")} />
                        {errors.mileage && <p className="text-sm text-destructive">{errors.mileage.message}</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="technicianName">Nome do Técnico</Label>
                        <Input id="technicianName" {...register('technicianName')} readOnly className="bg-muted" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="maintenanceDate">Data da Manutenção</Label>
                        <Input id="maintenanceDate" {...register('maintenanceDate')} readOnly className="bg-muted" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Inspeção Visual</CardTitle>
                    <CardDescription>Marque os itens que foram verificados.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <Controller
                        name="visualInspection.tires"
                        control={control}
                        render={({ field }) => (
                            <div className="flex items-center space-x-2">
                                <Checkbox id="vi-tires" checked={field.value} onCheckedChange={field.onChange} />
                                <Label htmlFor="vi-tires" className="font-normal">Pneus (calibragem e desgaste)</Label>
                            </div>
                        )}
                    />
                    <Controller
                        name="visualInspection.lights"
                        control={control}
                        render={({ field }) => (
                            <div className="flex items-center space-x-2">
                                <Checkbox id="vi-lights" checked={field.value} onCheckedChange={field.onChange} />
                                <Label htmlFor="vi-lights" className="font-normal">Faróis, lanternas e setas</Label>
                            </div>
                        )}
                    />
                     <Controller
                        name="visualInspection.bodywork"
                        control={control}
                        render={({ field }) => (
                            <div className="flex items-center space-x-2">
                                <Checkbox id="vi-bodywork" checked={field.value} onCheckedChange={field.onChange} />
                                <Label htmlFor="vi-bodywork" className="font-normal">Lataria e vidros (avarias)</Label>
                            </div>
                        )}
                    />
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Verificação Mecânica</CardTitle>
                     <CardDescription>Avalie os níveis e condições dos itens abaixo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-2">
                        <Label>Nível do Óleo do Motor</Label>
                         <Controller
                            name="mechanicalCheck.engineOil"
                            control={control}
                            render={({ field }) => (
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="OK" id="oil-ok" />
                                        <Label htmlFor="oil-ok" className="font-normal">OK</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Baixo" id="oil-low" />
                                        <Label htmlFor="oil-low" className="font-normal">Baixo</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Vazamento" id="oil-leak" />
                                        <Label htmlFor="oil-leak" className="font-normal">Com Vazamento</Label>
                                    </div>
                                </RadioGroup>
                            )}
                        />
                    </div>
                     <Separator />
                     <div className="grid gap-2">
                        <Label>Fluido de Freio</Label>
                        <Controller
                            name="mechanicalCheck.brakeFluid"
                            control={control}
                            render={({ field }) => (
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="OK" id="brake-ok" />
                                        <Label htmlFor="brake-ok" className="font-normal">OK</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Baixo" id="brake-low" />
                                        <Label htmlFor="brake-low" className="font-normal">Baixo</Label>
                                    </div>
                                </RadioGroup>
                            )}
                        />
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Observações Gerais</CardTitle>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder="Descreva qualquer outra observação, problema ou recomendação..."
                        {...register('observations')}
                    />
                </CardContent>
            </Card>

            <CardFooter className="border-t px-6 py-4">
                <Button type="submit" size="lg" disabled={!isValid || isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Finalizando...
                        </>
                    ) : (
                        'Finalizar e Abrir Ordem de Serviço'
                    )}
                </Button>
            </CardFooter>
        </div>
      </form>
    </div>
  );
}
