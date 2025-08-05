
'use client';

import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect, useCallback } from 'react';
import { collection, Timestamp, onSnapshot, query, where, addDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertTriangle, Edit } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import { ChecklistTemplate } from '@/lib/checklist-templates-data';
import { ItemChecklistDialog } from '@/components/item-checklist-dialog';
import { SignaturePad } from '@/components/signature-pad';
import { SelfieCapture } from '@/components/selfie-capture';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';


const checklistItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  photoRequirement: z.enum(["always", "if_not_ok", "never"]),
  status: z.enum(["OK", "Não OK", "N/A"]),
  photo: z.string().optional(),
  observation: z.string().optional(),
});

const checklistSchema = z.object({
  templateId: z.string().min(1, 'A seleção de um modelo de checklist é obrigatória.'),
  vehicleId: z.string().min(1, 'A seleção do veículo é obrigatória.'),
  responsibleName: z.string().min(1, 'O nome do responsável é obrigatório.'),
  driverName: z.string().min(1, 'O nome do motorista é obrigatório.'),
  mileage: z.coerce.number().min(1, 'A quilometragem é obrigatória.'),
  assinaturaResponsavel: z.string().min(1, "A assinatura do responsável é obrigatória."),
  assinaturaMotorista: z.string().min(1, "A assinatura do motorista é obrigatória."),
  selfieResponsavel: z.string().min(1, "A selfie do responsável é obrigatória."),
  selfieMotorista: z.string().min(1, "A selfie do motorista é obrigatória."),
  questions: z.array(checklistItemSchema),
}).refine(data => data.questions.every(item => item.status !== 'N/A'), {
    message: "Todos os itens de verificação devem ser avaliados (OK ou Não OK).",
    path: ["questions"],
}).refine(data => data.questions.every(item => {
    const needsPhoto = item.photoRequirement === 'always' || (item.photoRequirement === 'if_not_ok' && item.status === 'Não OK');
    return !needsPhoto || (needsPhoto && !!item.photo);
}), {
    message: "Uma ou mais fotos obrigatórias não foram adicionadas. Verifique os itens marcados.",
    path: ["questions"],
});


type ChecklistFormValues = z.infer<typeof checklistSchema>;
type ChecklistItemData = z.infer<typeof checklistItemSchema>;
interface Vehicle {
    id: string; // This is the plate
    plate: string;
    model: string;
}

export default function MaintenanceChecklistPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);

  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(true);

  const [currentItem, setCurrentItem] = useState<{item: ChecklistItemData, index: number} | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(setUser);
    return () => unsubscribe();
  }, []);
  
  useEffect(() => {
    const q = query(collection(db, "checklist-templates"), where("type", "==", "Manutenção"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const templatesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChecklistTemplate));
        setTemplates(templatesData);
        setIsLoadingTemplates(false);
    }, (error) => {
        console.error("Firebase Error:", error);
        toast({
            variant: "destructive",
            title: "Erro ao Carregar Modelos",
            description: "Não foi possível buscar os modelos de checklist."
        });
        setIsLoadingTemplates(false);
    });

    const fetchVehicles = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "vehicles"));
            const vehiclesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
            setVehicles(vehiclesData);
        } catch (error) {
            console.error("Error fetching vehicles: ", error);
            toast({
                variant: "destructive",
                title: "Erro ao Carregar Veículos",
                description: "Não foi possível buscar a lista de veículos.",
            });
        } finally {
            setIsLoadingVehicles(false);
        }
    };

    fetchVehicles();

    return () => unsubscribe();
  }, [toast]);


  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    register,
    watch,
    getValues,
    setValue,
    reset,
    trigger
  } = useForm<ChecklistFormValues>({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      templateId: '',
      vehicleId: '',
      responsibleName: user?.displayName || '',
      driverName: '',
      mileage: 0,
      assinaturaResponsavel: '',
      assinaturaMotorista: '',
      selfieResponsavel: '',
      selfieMotorista: '',
      questions: [],
    },
    mode: 'onChange',
  });

  const { fields, replace, update } = useFieldArray({
    control,
    name: "questions",
  });
  
  useEffect(() => {
    if (user?.displayName) {
      setValue('responsibleName', user.displayName);
    }
  }, [user, setValue]);


  const handleTemplateChange = useCallback((templateId: string) => {
    const selectedTemplate = templates.find(t => t.id === templateId);
    if (selectedTemplate) {
        setValue('templateId', templateId);
        const newQuestions = selectedTemplate.questions.map(q => ({
            ...q,
            status: 'N/A' as const,
            photo: '',
            observation: '',
        }));
        replace(newQuestions);
        trigger();
    } else {
        setValue('templateId', '');
        replace([]);
    }
  }, [templates, replace, setValue, trigger]);


  const handleSaveItem = useCallback((data: { status: "OK" | "Não OK"; photo?: string; observation?: string; }) => {
    if (currentItem) {
        const updatedItem = {
            ...fields[currentItem.index],
            ...data,
        };
        update(currentItem.index, updatedItem);
        // Delay trigger to allow state to update before validation
        setTimeout(() => trigger("questions"), 100); 
    }
    setCurrentItem(null);
  }, [currentItem, fields, update, trigger]);

  const handleReview = async () => {
    const isValid = await trigger();
    if(isValid) {
        setIsReviewing(true);
    } else {
        console.log(errors)
        toast({
            variant: "destructive",
            title: "Campos Inválidos",
            description: "Por favor, preencha todos os campos obrigatórios, incluindo assinaturas e selfies, e avalie todos os itens antes de finalizar.",
        });
    }
  }
  

  const onSubmit = async (data: ChecklistFormValues) => {
    try {
        const hasIssues = data.questions.some(q => q.status === "Não OK");
        
        const submissionData = {
            ...data,
            name: templates.find(t => t.id === data.templateId)?.name || 'Checklist de Manutenção',
            type: "Manutenção",
            category: templates.find(t => t.id === data.templateId)?.category || 'nao_aplicavel',
            driver: data.driverName,
            createdAt: Timestamp.now(),
            status: hasIssues ? "Pendente" : "OK",
            vehicleImages: [],
            generalObservations: '',
        };

        const checklistDocRef = await addDoc(collection(db, 'completed-checklists'), submissionData);
        
        toast({
            title: "Sucesso!",
            description: "Checklist de manutenção finalizado com sucesso.",
        });
        
        router.push(`/checklist/completed/${checklistDocRef.id}`);

    } catch (error: any) {
        console.error("Checklist submission error:", error);
        toast({
            variant: "destructive",
            title: "Erro no Envio",
            description: `Não foi possível finalizar o checklist. Detalhes: ${error.message}`,
        });
    } finally {
        setIsReviewing(false);
    }
  };
  
  const selectedTemplateId = watch('templateId');

  return (
    <>
    <ItemChecklistDialog
        isOpen={!!currentItem}
        onClose={() => setCurrentItem(null)}
        item={currentItem?.item ?? null}
        onSave={handleSaveItem}
    />
    <AlertDialog open={isReviewing} onOpenChange={setIsReviewing}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revisar e Finalizar Checklist</AlertDialogTitle>
          <AlertDialogDescription>
            Confirme os dados abaixo. Após o envio, uma ordem de serviço será gerada se houver pendências.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="text-sm space-y-2">
            <p><strong>Veículo:</strong> {getValues("vehicleId")}</p>
            <p><strong>Responsável:</strong> {getValues("responsibleName")}</p>
            <p><strong>Motorista:</strong> {getValues("driverName")}</p>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Confirmar e Enviar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>


    <form onSubmit={(e) => e.preventDefault()} className="mx-auto grid w-full max-w-4xl gap-6">
      <PageHeader
        title="Checklist de Manutenção"
        description="Preencha os itens para registrar uma nova manutenção."
      />
      <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Seleção de Modelo</CardTitle>
                <CardDescription>Escolha o modelo de checklist a ser utilizado.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingTemplates ? <Skeleton className="h-10 w-full" /> : (
                    <Controller
                        name="templateId"
                        control={control}
                        render={({ field }) => (
                        <Select onValueChange={(value) => {
                            field.onChange(value);
                            handleTemplateChange(value);
                        }} defaultValue={field.value}>
                            <SelectTrigger id="templateId" className={cn(errors.templateId && "border-destructive")}>
                                <SelectValue placeholder="Selecione o modelo" />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map(template => (
                                    <SelectItem key={template.id} value={template.id}>{template.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        )}
                    />
                )}
                 {errors.templateId && <p className="text-sm text-destructive mt-2">{errors.templateId.message}</p>}
            </CardContent>
        </Card>

      {selectedTemplateId && (
          <>
            <Card>
                <CardHeader>
                    <CardTitle>Informações Gerais</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                     <div className="grid gap-2">
                        <Label htmlFor="vehicleId">Veículo *</Label>
                        {isLoadingVehicles ? <Skeleton className="h-10 w-full" /> : (
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
                                            <SelectItem key={v.id} value={v.plate}>{v.plate} - {v.model}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                )}
                            />
                        )}
                        {errors.vehicleId && <p className="text-sm text-destructive">{errors.vehicleId.message}</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="mileage">Quilometragem Atual *</Label>
                        <Input id="mileage" type="number" {...register('mileage')} className={cn(errors.mileage && "border-destructive")} />
                        {errors.mileage && <p className="text-sm text-destructive">{errors.mileage.message}</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="responsibleName">Nome do Técnico Responsável *</Label>
                        <Input id="responsibleName" {...register('responsibleName')} className={cn(errors.responsibleName && "border-destructive")} />
                         {errors.responsibleName && <p className="text-sm text-destructive">{errors.responsibleName.message}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="driverName">Nome do Motorista *</Label>
                        <Input id="driverName" {...register('driverName')} className={cn(errors.driverName && "border-destructive")} />
                        {errors.driverName && <p className="text-sm text-destructive">{errors.driverName.message}</p>}
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Itens de Verificação</CardTitle>
                    <CardDescription>Avalie cada item da lista abaixo.</CardDescription>
                    {errors.questions && typeof errors.questions.message === 'string' && (
                        <p className="text-sm text-destructive mt-2">{errors.questions.message}</p>
                    )}
                </CardHeader>
                <CardContent className="space-y-3">
                    {fields.map((item, index) => {
                        const needsPhoto = item.photoRequirement === 'always' || (item.photoRequirement === 'if_not_ok' && item.status === 'Não OK');
                        const photoMissing = needsPhoto && !item.photo;
                         return (
                            <div
                                key={item.id}
                                className={cn(
                                    "p-3 border rounded-lg flex justify-between items-center",
                                    item.status === 'N/A' && 'border-dashed',
                                    photoMissing && 'border-destructive'
                                )}
                            >
                                <div>
                                    <p className="font-medium">{item.text}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {item.status === 'N/A' && <Badge variant="outline">Pendente</Badge>}
                                        {item.status === 'OK' && <Badge className="bg-green-600 hover:bg-green-700">OK</Badge>}
                                        {item.status === 'Não OK' && <Badge variant="destructive">Não OK</Badge>}
                                        {photoMissing && <Badge variant="destructive" className="animate-pulse">Foto Obrigatória</Badge>}
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const questionValue = getValues(`questions.${index}`);
                                        setCurrentItem({ item: questionValue, index });
                                    }}
                                >
                                    <Edit className="mr-2 h-4 w-4"/>
                                    Avaliar
                                </Button>
                            </div>
                         );
                    })}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Validação e Assinaturas</CardTitle>
                    <CardDescription>O responsável e o motorista devem registrar a selfie e assinar abaixo para validar o checklist.</CardDescription>
                     {(errors.assinaturaResponsavel || errors.assinaturaMotorista || errors.selfieResponsavel || errors.selfieMotorista) && (
                        <p className="text-sm text-destructive mt-2">Selfie e assinatura de ambos são obrigatórias.</p>
                     )}
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-12">
                     <div className="grid gap-4">
                        <Label>Responsável Técnico: {watch('responsibleName')}</Label>
                        <Controller
                            name="selfieResponsavel"
                            control={control}
                            render={({ field }) => (
                                <SelfieCapture onCapture={field.onChange} />
                            )}
                        />
                         {errors.selfieResponsavel && <p className="text-sm text-destructive -mt-2">{errors.selfieResponsavel.message}</p>}
                        <Controller
                            name="assinaturaResponsavel"
                            control={control}
                            render={({ field }) => (
                                <SignaturePad onEnd={field.onChange} />
                            )}
                        />
                         {errors.assinaturaResponsavel && <p className="text-sm text-destructive -mt-2">{errors.assinaturaResponsavel.message}</p>}
                     </div>
                     <div className="grid gap-4">
                         <Label>Motorista: {watch('driverName')}</Label>
                        <Controller
                            name="selfieMotorista"
                            control={control}
                            render={({ field }) => (
                                <SelfieCapture onCapture={field.onChange} />
                            )}
                        />
                         {errors.selfieMotorista && <p className="text-sm text-destructive -mt-2">{errors.selfieMotorista.message}</p>}
                        <Controller
                            name="assinaturaMotorista"
                            control={control}
                            render={({ field }) => (
                                <SignaturePad onEnd={field.onChange} />
                            )}
                        />
                         {errors.assinaturaMotorista && <p className="text-sm text-destructive -mt-2">{errors.assinaturaMotorista.message}</p>}
                     </div>
                </CardContent>
            </Card>
            
            <CardFooter className="border-t px-6 py-4">
                <Button type="button" size="lg" onClick={handleReview} disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Finalizando...
                        </>
                    ) : (
                        'Revisar e Finalizar Checklist'
                    )}
                </Button>
            </CardFooter>
          </>
        )}
        </div>
    </form>
    </>
  );
}
