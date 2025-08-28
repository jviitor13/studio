
'use client';

import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect, useCallback } from 'react';
import { collection, Timestamp, query, where, addDoc, getDocs, doc, setDoc, updateDoc, writeBatch, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, AlertTriangle, Edit, ArrowLeft, ArrowRight } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { cn } from '@/lib/utils';
import { ChecklistTemplate } from '@/lib/checklist-templates-data';
import { ItemChecklistDialog } from '@/components/item-checklist-dialog';
import { SignaturePad } from '@/components/signature-pad';
import { SelfieCapture } from '@/components/selfie-capture';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { uploadImageAndGetURL } from '@/lib/storage';
import { Progress } from '@/components/ui/progress';


const checklistItemSchema = z.object({
  id: z.string(),
  text: z.string(),
  photoRequirement: z.enum(["always", "if_not_ok", "never"]),
  status: z.enum(["OK", "Não OK", "N/A"]),
  photo: z.string().optional(),
  observation: z.string().optional(),
});

const vehicleImagesSchema = z.object({
    cavaloFrontal: z.string().min(1, "A foto frontal do cavalo é obrigatória."),
    cavaloLateralDireita: z.string().min(1, "A foto da lateral direita do cavalo é obrigatória."),
    cavaloLateralEsquerda: z.string().min(1, "A foto da lateral esquerda do cavalo é obrigatória."),
    carretaFrontal: z.string().min(1, "A foto frontal da carreta é obrigatória."),
    carretaLateralDireita: z.string().min(1, "A foto da lateral direita da carreta é obrigatória."),
    carretaLateralEsquerda: z.string().min(1, "A foto da lateral esquerda da carreta é obrigatória."),
});

const signaturesSchema = z.object({
  assinaturaResponsavel: z.string().min(1, "A assinatura do responsável é obrigatória."),
  assinaturaMotorista: z.string().min(1, "A assinatura do motorista é obrigatória."),
  selfieResponsavel: z.string().min(1, "A selfie do responsável é obrigatória."),
  selfieMotorista: z.string().min(1, "A selfie do motorista é obrigatória."),
});

const checklistSchema = z.object({
  templateId: z.string().min(1, 'A seleção de um modelo de checklist é obrigatória.'),
  cavaloPlate: z.string().min(7, 'A placa do cavalo é obrigatória.').max(8, 'Placa inválida.'),
  carretaPlate: z.string().min(7, 'A placa da carreta é obrigatória.').max(8, 'Placa inválida.'),
  responsibleName: z.string().min(1, 'O nome do responsável é obrigatório.'),
  driverName: z.string().min(1, 'O nome do motorista é obrigatório.'),
  mileage: z.coerce.number().min(1, 'A quilometragem é obrigatória.'),
  questions: z.array(checklistItemSchema).min(1, 'O checklist deve ter pelo menos um item.'),
  vehicleImages: vehicleImagesSchema,
  signatures: signaturesSchema,
});

type ChecklistFormValues = z.infer<typeof checklistSchema>;
type ChecklistItemData = z.infer<typeof checklistItemSchema>;

const formSteps = [
    { id: 1, title: 'Informações Gerais', fields: ['templateId', 'cavaloPlate', 'carretaPlate', 'responsibleName', 'driverName', 'mileage'] },
    { id: 2, title: 'Itens de Verificação', fields: ['questions'] },
    { id: 3, title: 'Fotos Gerais do Veículo', fields: ['vehicleImages'] },
    { id: 4, title: 'Validação e Assinaturas', fields: ['signatures'] },
];

export default function MaintenanceChecklistPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);

  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  const [currentItem, setCurrentItem] = useState<{item: ChecklistItemData, index: number} | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submissionStatus, setSubmissionStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [checklistId, setChecklistId] = useState<string | null>(null);


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

    return () => unsubscribe();
  }, [toast]);


  const {
    control,
    handleSubmit,
    formState: { errors },
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
      cavaloPlate: '',
      carretaPlate: '',
      responsibleName: user?.displayName || '',
      driverName: '',
      mileage: 0,
      questions: [],
      vehicleImages: {
        cavaloFrontal: '',
        cavaloLateralDireita: '',
        cavaloLateralEsquerda: '',
        carretaFrontal: '',
        carretaLateralDireita: '',
        carretaLateralEsquerda: '',
      },
      signatures: {
        assinaturaResponsavel: '',
        assinaturaMotorista: '',
        selfieResponsavel: '',
        selfieMotorista: '',
      }
    },
    mode: 'onBlur',
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
    } else {
        setValue('templateId', '');
        replace([]);
    }
     trigger('templateId');
  }, [templates, replace, setValue, trigger]);


  const handleSaveItem = useCallback((data: { status: "OK" | "Não OK"; photo?: string; observation?: string; }) => {
    if (currentItem) {
        const updatedItem = {
            ...fields[currentItem.index],
            ...data,
        };
        update(currentItem.index, updatedItem);
        setTimeout(() => trigger(`questions.${currentItem.index}`), 100); 
    }
    setCurrentItem(null);
  }, [currentItem, fields, update, trigger]);

  const handlePrevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };
    
    const handleNextStep = async () => {
        const fieldsToValidate = formSteps[currentStep - 1].fields as (keyof ChecklistFormValues)[];
        const isValid = await trigger(fieldsToValidate);

        if (!isValid) {
            toast({
                variant: "destructive",
                title: "Campos Incompletos",
                description: `Por favor, preencha todos os campos obrigatórios da etapa "${formSteps[currentStep - 1].title}" antes de avançar.`,
            });
            return;
        }

        setIsSubmitting(true);
        setSubmissionStatus('Salvando progresso...');
        setUploadProgress(25 * (currentStep -1));

        try {
            if (currentStep === 1) {
                const data = getValues();
                const newChecklistId = `checklist-${Date.now()}`;
                const checklistRef = doc(db, 'completed-checklists', newChecklistId);
                const selectedTemplate = templates.find(t => t.id === data.templateId);
                
                const submissionData = {
                    id: newChecklistId,
                    templateId: data.templateId,
                    cavaloPlate: data.cavaloPlate,
                    carretaPlate: data.carretaPlate,
                    responsibleName: data.responsibleName,
                    driverName: data.driverName,
                    mileage: data.mileage,
                    vehicle: `${data.cavaloPlate} / ${data.carretaPlate}`,
                    name: selectedTemplate?.name || 'Checklist de Manutenção',
                    type: "Manutenção",
                    category: selectedTemplate?.category || 'nao_aplicavel',
                    driver: data.driverName,
                    createdAt: Timestamp.now(),
                    status: "Em Andamento",
                    questions: data.questions.map(q => ({ id: q.id, text: q.text, status: q.status, observation: q.observation || '' })),
                };

                await setDoc(checklistRef, submissionData);
                setChecklistId(newChecklistId);
            } else if (checklistId) {
                 const data = getValues();
                const checklistRef = doc(db, 'completed-checklists', checklistId);
                
                const imagesToUpload: { fieldPath: string; dataUrl: string }[] = [];
                let updateData: { [key: string]: any } = {};

                if (currentStep === 2) {
                    const questions = data.questions;
                    if (questions.some(q => q.status === 'N/A')) {
                        toast({ variant: "destructive", title: "Checklist Incompleto", description: "Avalie todos os itens antes de prosseguir." });
                        setIsSubmitting(false);
                        return;
                    }
                     questions.forEach((q, index) => {
                        if(q.photo?.startsWith('data:image')) {
                            imagesToUpload.push({ fieldPath: `questions.${index}.photo`, dataUrl: q.photo });
                        }
                    });
                    updateData.questions = questions.map(q => ({ ...q, photo: q.photo?.startsWith('data:image') ? '' : q.photo }));
                } else if (currentStep === 3) {
                     Object.entries(data.vehicleImages).forEach(([key, value]) => {
                        if(value.startsWith('data:image')) {
                            imagesToUpload.push({ fieldPath: `vehicleImages.${key}`, dataUrl: value });
                        }
                    });
                     updateData.vehicleImages = { ...data.vehicleImages };
                } else if (currentStep === 4) {
                     Object.entries(data.signatures).forEach(([key, value]) => {
                        if(value.startsWith('data:image')) {
                            imagesToUpload.push({ fieldPath: `signatures.${key}`, dataUrl: value });
                        }
                    });
                     updateData.signatures = { ...data.signatures };
                }

                let uploadedCount = 0;
                for (const imgInfo of imagesToUpload) {
                    uploadedCount++;
                    setSubmissionStatus(`Enviando imagem ${uploadedCount} de ${imagesToUpload.length}...`);
                    const url = await uploadImageAndGetURL(imgInfo.dataUrl, checklistId, `${imgInfo.fieldPath.replace(/\./g, '-')}-${Date.now()}`);
                    
                    // Set the URL in the updateData object using lodash.set or similar logic
                    const pathParts = imgInfo.fieldPath.split('.');
                    let current = updateData;
                    for (let i = 0; i < pathParts.length - 1; i++) {
                        current = current[pathParts[i]];
                    }
                    current[pathParts[pathParts.length - 1]] = url;

                    setUploadProgress(25 * (currentStep -1) + (uploadedCount / imagesToUpload.length) * 25);
                }

                await updateDoc(checklistRef, updateData);

                if (currentStep === 4) {
                    const finalData = getValues();
                    const hasIssues = finalData.questions.some((q) => q.status === "Não OK");
                    await updateDoc(checklistRef, { status: hasIssues ? "Pendente" : "OK" });
                    toast({ title: "Sucesso!", description: "Checklist de manutenção finalizado com sucesso." });
                    router.push(`/checklist/completed/${checklistId}`);
                    return;
                }
            }
             if (currentStep < formSteps.length) {
                setCurrentStep(prev => prev + 1);
            }
        } catch (error: any) {
            console.error("Error during step progression:", error);
            toast({ variant: "destructive", title: "Erro ao Salvar", description: `Não foi possível salvar o progresso. Detalhes: ${error.message}`});
            if(checklistId) {
                await updateDoc(doc(db, 'completed-checklists', checklistId), { status: "Falhou" }).catch();
            }
        } finally {
            setIsSubmitting(false);
            setSubmissionStatus('');
        }
    };


 const onSubmit = (data: ChecklistFormValues) => {
    handleNextStep();
 }
  
  const selectedTemplateId = watch('templateId');
  const [shouldTriggerValidation, setShouldTriggerValidation] = useState(false);
  const currentQuestions = watch('questions');

   useEffect(() => {
      if (shouldTriggerValidation) {
          trigger('questions');
          setShouldTriggerValidation(false);
          toast({
              title: "Tudo OK!",
              description: "Todos os itens foram marcados como 'OK'.",
          });
      }
  }, [currentQuestions, shouldTriggerValidation, trigger, toast]);


  const handleMarkAllOk = () => {
    fields.forEach((_item, index) => {
        const currentItem = getValues(`questions.${index}`);
        if (currentItem.status !== 'OK') {
            update(index, { ...currentItem, status: 'OK' });
        }
    });
    setShouldTriggerValidation(true);
  }


  return (
    <>
    <ItemChecklistDialog
        isOpen={!!currentItem}
        onClose={() => setCurrentItem(null)}
        item={currentItem?.item ?? null}
        onSave={handleSaveItem}
    />
     <AlertDialog open={isSubmitting && currentStep === 4}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Finalizando o Envio...</AlertDialogTitle>
                <AlertDialogDescription>
                    Estamos processando as últimas informações. Por favor, aguarde.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-4 py-4">
                <Progress value={uploadProgress} />
                <p className="text-sm text-center text-muted-foreground">{submissionStatus}</p>
            </div>
        </AlertDialogContent>
    </AlertDialog>


    <form onSubmit={(e) => e.preventDefault()} className="mx-auto grid w-full max-w-4xl gap-6">
      <PageHeader
        title="Checklist de Manutenção"
        description={formSteps[currentStep - 1].title}
      />
      <Progress value={25 * currentStep} className="w-full h-2" />
      <div className="space-y-8">
        
        {currentStep === 1 && (
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
                 {selectedTemplateId && (
                    <>
                        <CardHeader>
                            <CardTitle>Informações Gerais</CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="cavaloPlate">Placa do Cavalo *</Label>
                                <Input id="cavaloPlate" placeholder="ABC1D23" {...register('cavaloPlate')} className={cn(errors.cavaloPlate && "border-destructive")} />
                                {errors.cavaloPlate && <p className="text-sm text-destructive">{errors.cavaloPlate.message}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="carretaPlate">Placa da Carreta *</Label>
                                <Input id="carretaPlate" placeholder="ABC1D23" {...register('carretaPlate')} className={cn(errors.carretaPlate && "border-destructive")} />
                                {errors.carretaPlate && <p className="text-sm text-destructive">{errors.carretaPlate.message}</p>}
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
                            <div className="grid gap-2 md:col-span-2">
                                <Label htmlFor="driverName">Nome do Motorista *</Label>
                                <Input id="driverName" {...register('driverName')} className={cn(errors.driverName && "border-destructive")} />
                                {errors.driverName && <p className="text-sm text-destructive">{errors.driverName.message}</p>}
                            </div>
                        </CardContent>
                    </>
                 )}
            </Card>
        )}

      {currentStep === 2 && (
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Itens de Verificação</CardTitle>
                            <CardDescription>Avalie cada item da lista abaixo.</CardDescription>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={handleMarkAllOk}>
                            <CheckCircle className="mr-2 h-4 w-4 text-green-600"/>
                            Marcar Todos como OK
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3">
                    {fields.map((item, index) => {
                         return (
                            <div
                                key={item.id}
                                className={cn(
                                    "p-3 border rounded-lg flex justify-between items-center",
                                    item.status === 'N/A' && 'border-dashed'
                                )}
                            >
                                <div>
                                    <p className="font-medium">{item.text}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {item.status === 'N/A' && <Badge variant="outline">Pendente</Badge>}
                                        {item.status === 'OK' && <Badge className="bg-green-600 hover:bg-green-700">OK</Badge>}
                                        {item.status === 'Não OK' && <Badge variant="destructive">Não OK</Badge>}
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
        )}

        {currentStep === 3 && (
            <Card>
                 <CardHeader>
                    <CardTitle>Fotos Gerais do Veículo</CardTitle>
                    <CardDescription>Capture as 6 fotos obrigatórias do conjunto (cavalo e carreta).</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-12">
                     {/* Fotos do Cavalo */}
                    <div className="space-y-6">
                        <h3 className="font-semibold text-lg text-center">Cavalo Mecânico</h3>
                        <div className="grid gap-4">
                            <Label>Foto Frontal *</Label>
                            <Controller name="vehicleImages.cavaloFrontal" control={control} render={({ field }) => <SelfieCapture onCapture={field.onChange} cameraType="environment" />} />
                            {errors.vehicleImages?.cavaloFrontal && <p className="text-sm text-destructive">{errors.vehicleImages.cavaloFrontal.message}</p>}
                        </div>
                         <div className="grid gap-4">
                            <Label>Foto Lateral Direita *</Label>
                            <Controller name="vehicleImages.cavaloLateralDireita" control={control} render={({ field }) => <SelfieCapture onCapture={field.onChange} cameraType="environment" />} />
                            {errors.vehicleImages?.cavaloLateralDireita && <p className="text-sm text-destructive">{errors.vehicleImages.cavaloLateralDireita.message}</p>}
                        </div>
                         <div className="grid gap-4">
                            <Label>Foto Lateral Esquerda *</Label>
                            <Controller name="vehicleImages.cavaloLateralEsquerda" control={control} render={({ field }) => <SelfieCapture onCapture={field.onChange} cameraType="environment" />} />
                             {errors.vehicleImages?.cavaloLateralEsquerda && <p className="text-sm text-destructive">{errors.vehicleImages.cavaloLateralEsquerda.message}</p>}
                        </div>
                    </div>
                    {/* Fotos da Carreta */}
                     <div className="space-y-6">
                        <h3 className="font-semibold text-lg text-center">Carreta</h3>
                        <div className="grid gap-4">
                            <Label>Foto Frontal *</Label>
                            <Controller name="vehicleImages.carretaFrontal" control={control} render={({ field }) => <SelfieCapture onCapture={field.onChange} cameraType="environment" />} />
                             {errors.vehicleImages?.carretaFrontal && <p className="text-sm text-destructive">{errors.vehicleImages.carretaFrontal.message}</p>}
                        </div>
                         <div className="grid gap-4">
                            <Label>Foto Lateral Direita *</Label>
                            <Controller name="vehicleImages.carretaLateralDireita" control={control} render={({ field }) => <SelfieCapture onCapture={field.onChange} cameraType="environment" />} />
                             {errors.vehicleImages?.carretaLateralDireita && <p className="text-sm text-destructive">{errors.vehicleImages.carretaLateralDireita.message}</p>}
                        </div>
                         <div className="grid gap-4">
                            <Label>Foto Lateral Esquerda *</Label>
                            <Controller name="vehicleImages.carretaLateralEsquerda" control={control} render={({ field }) => <SelfieCapture onCapture={field.onChange} cameraType="environment" />} />
                             {errors.vehicleImages?.carretaLateralEsquerda && <p className="text-sm text-destructive">{errors.vehicleImages.carretaLateralEsquerda.message}</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>
        )}

        {currentStep === 4 && (
            <Card>
                <CardHeader>
                    <CardTitle>Validação e Assinaturas</CardTitle>
                    <CardDescription>O responsável e o motorista devem registrar a selfie e assinar abaixo para validar o checklist.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-12">
                     <div className="grid gap-4">
                        <Label>Responsável Técnico: {watch('responsibleName')}</Label>
                        <Controller
                            name="signatures.selfieResponsavel"
                            control={control}
                            render={({ field }) => <SelfieCapture onCapture={field.onChange} />}
                        />
                         {errors.signatures?.selfieResponsavel && <p className="text-sm text-destructive -mt-2">{errors.signatures.selfieResponsavel.message}</p>}
                        <Controller
                            name="signatures.assinaturaResponsavel"
                            control={control}
                            render={({ field }) => <SignaturePad onEnd={field.onChange} />}
                        />
                         {errors.signatures?.assinaturaResponsavel && <p className="text-sm text-destructive -mt-2">{errors.signatures.assinaturaResponsavel.message}</p>}
                     </div>
                     <div className="grid gap-4">
                         <Label>Motorista: {watch('driverName')}</Label>
                        <Controller
                            name="signatures.selfieMotorista"
                            control={control}
                            render={({ field }) => <SelfieCapture onCapture={field.onChange} />}
                        />
                         {errors.signatures?.selfieMotorista && <p className="text-sm text-destructive -mt-2">{errors.signatures.selfieMotorista.message}</p>}
                        <Controller
                            name="signatures.assinaturaMotorista"
                            control={control}
                            render={({ field }) => <SignaturePad onEnd={field.onChange} />}
                        />
                         {errors.signatures?.assinaturaMotorista && <p className="text-sm text-destructive -mt-2">{errors.signatures.assinaturaMotorista.message}</p>}
                     </div>
                </CardContent>
            </Card>
        )}
            
        <CardFooter className="border-t px-6 py-4 flex justify-between">
            <div>
                {currentStep > 1 && (
                    <Button type="button" variant="outline" onClick={handlePrevStep} disabled={isSubmitting}>
                         <ArrowLeft className="mr-2 h-4 w-4"/>
                        Voltar
                    </Button>
                )}
            </div>
            <div>
                <Button type="button" onClick={handleNextStep} disabled={isSubmitting || !selectedTemplateId}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    {isSubmitting ? 'Salvando...' : (currentStep === formSteps.length ? 'Finalizar e Enviar' : 'Avançar')}
                    {!isSubmitting && currentStep < formSteps.length && <ArrowRight className="ml-2 h-4 w-4"/>}
                </Button>
            </div>
        </CardFooter>
        </div>
    </form>
    </>
  );
}

    