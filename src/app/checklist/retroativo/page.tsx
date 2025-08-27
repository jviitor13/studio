
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { uploadImageAndGetURL } from '@/lib/storage';
import { Progress } from '@/components/ui/progress';
import { ImageUploader } from '@/components/image-uploader';


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
  cavaloPlate: z.string().min(7, 'A placa do cavalo é obrigatória.').max(8, 'Placa inválida.'),
  carretaPlate: z.string().min(7, 'A placa da carreta é obrigatória.').max(8, 'Placa inválida.'),
  responsibleName: z.string().min(1, 'O nome do responsável é obrigatório.'),
  driverName: z.string().min(1, 'O nome do motorista é obrigatório.'),
  mileage: z.coerce.number().min(1, 'A quilometragem é obrigatória.'),
  assinaturaResponsavel: z.string().min(1, "A assinatura do responsável é obrigatória."),
  assinaturaMotorista: z.string().min(1, "A assinatura do motorista é obrigatória."),
  selfieResponsavel: z.string().min(1, "A selfie do responsável é obrigatória."),
  selfieMotorista: z.string().min(1, "A selfie do motorista é obrigatória."),
  questions: z.array(checklistItemSchema).min(1, 'O checklist deve ter pelo menos um item.'),
  vehicleImages: z.object({
    cavaloFrontal: z.string().min(1, "A foto frontal do cavalo é obrigatória."),
    cavaloLateralDireita: z.string().min(1, "A foto da lateral direita do cavalo é obrigatória."),
    cavaloLateralEsquerda: z.string().min(1, "A foto da lateral esquerda do cavalo é obrigatória."),
    carretaFrontal: z.string().min(1, "A foto frontal da carreta é obrigatória."),
    carretaLateralDireita: z.string().min(1, "A foto da lateral direita da carreta é obrigatória."),
    carretaLateralEsquerda: z.string().min(1, "A foto da lateral esquerda da carreta é obrigatória."),
  }),
});

type ChecklistFormValues = z.infer<typeof checklistSchema>;
type ChecklistItemData = z.infer<typeof checklistItemSchema>;

export default function RetroactiveChecklistPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);

  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  const [currentItem, setCurrentItem] = useState<{item: ChecklistItemData, index: number} | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submissionStatus, setSubmissionStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);


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
      assinaturaResponsavel: '',
      assinaturaMotorista: '',
      selfieResponsavel: '',
      selfieMotorista: '',
      questions: [],
      vehicleImages: {
        cavaloFrontal: '',
        cavaloLateralDireita: '',
        cavaloLateralEsquerda: '',
        carretaFrontal: '',
        carretaLateralDireita: '',
        carretaLateralEsquerda: '',
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
     trigger();
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

  const handleReview = async () => {
    const isFormValid = await trigger();
    const questions = getValues("questions");
    const allQuestionsAnswered = questions.every(q => q.status !== 'N/A');

    if (!allQuestionsAnswered) {
        toast({
            variant: "destructive",
            title: "Checklist Incompleto",
            description: "Existem itens de checklist pendentes. Por favor, avalie todos os itens.",
        });
        return;
    }

    if(isFormValid) {
        setIsReviewing(true);
    } else {
        toast({
            variant: "destructive",
            title: "Campos Inválidos",
            description: "Por favor, preencha todos os campos obrigatórios antes de finalizar. Verifique os campos marcados em vermelho.",
        });
    }
  }

 const onSubmit = async (data: ChecklistFormValues) => {
    setIsSubmitting(true);
    setSubmissionStatus('Iniciando envio...');
    setUploadProgress(0);

    const checklistId = `checklist-${Date.now()}`;
    
    // 1. Create a "clean" data object with only non-image data
    const submissionData: any = {
      templateId: data.templateId,
      cavaloPlate: data.cavaloPlate,
      carretaPlate: data.carretaPlate,
      responsibleName: data.responsibleName,
      driverName: data.driverName,
      mileage: data.mileage,
      questions: data.questions.map(q => ({
        id: q.id,
        text: q.text,
        photoRequirement: q.photoRequirement,
        status: q.status,
        observation: q.observation || '',
        photo: '', // Initialize photo URL as empty
      })),
      vehicleImages: {
        cavaloFrontal: '',
        cavaloLateralDireita: '',
        cavaloLateralEsquerda: '',
        carretaFrontal: '',
        carretaLateralDireita: '',
        carretaLateralEsquerda: '',
      },
      assinaturaResponsavel: '',
      assinaturaMotorista: '',
      selfieResponsavel: '',
      selfieMotorista: '',
    };
    
    // 2. Collect all images that need uploading into a flat array
    const imagesToUpload: { fieldPath: string; dataUrl: string }[] = [];
    if (data.selfieResponsavel?.startsWith('data:image')) imagesToUpload.push({ fieldPath: 'selfieResponsavel', dataUrl: data.selfieResponsavel });
    if (data.selfieMotorista?.startsWith('data:image')) imagesToUpload.push({ fieldPath: 'selfieMotorista', dataUrl: data.selfieMotorista });
    if (data.assinaturaResponsavel?.startsWith('data:image')) imagesToUpload.push({ fieldPath: 'assinaturaResponsavel', dataUrl: data.assinaturaResponsavel });
    if (data.assinaturaMotorista?.startsWith('data:image')) imagesToUpload.push({ fieldPath: 'assinaturaMotorista', dataUrl: data.assinaturaMotorista });

    Object.entries(data.vehicleImages).forEach(([key, value]) => {
      if (value?.startsWith('data:image')) imagesToUpload.push({ fieldPath: `vehicleImages.${key}`, dataUrl: value });
    });

    data.questions.forEach((q, index) => {
      if (q.photo?.startsWith('data:image')) imagesToUpload.push({ fieldPath: `questions.${index}.photo`, dataUrl: q.photo });
    });
    
    const totalImages = imagesToUpload.length;
    let uploadedCount = 0;
    
    try {
      // 3. Upload all images sequentially
      for (const imgInfo of imagesToUpload) {
        uploadedCount++;
        setSubmissionStatus(`Enviando imagem ${uploadedCount} de ${totalImages}...`);
        
        const url = await uploadImageAndGetURL(imgInfo.dataUrl, checklistId, `${imgInfo.fieldPath.replace(/\./g, '-')}-${Date.now()}`);

        // 4. Populate the submissionData object with the returned URL
        const pathParts = imgInfo.fieldPath.split('.');
        let currentLevel: any = submissionData;
        for (let i = 0; i < pathParts.length - 1; i++) {
            currentLevel = currentLevel[pathParts[i]];
        }
        currentLevel[pathParts[pathParts.length - 1]] = url;

        setUploadProgress((uploadedCount / totalImages) * 100);
      }

      setSubmissionStatus('Finalizando o checklist...');
      setUploadProgress(100);

      // 5. Save the final, clean data to Firestore
      const hasIssues = data.questions.some((q) => q.status === "Não OK");
      
      const finalChecklistData = {
          ...submissionData,
          vehicle: `${data.cavaloPlate} / ${data.carretaPlate}`,
          name: templates.find(t => t.id === data.templateId)?.name || 'Checklist de Manutenção',
          type: "Manutenção",
          category: templates.find(t => t.id === data.templateId)?.category || 'nao_aplicavel',
          driver: data.driverName,
          createdAt: Timestamp.now(),
          status: hasIssues ? "Pendente" : "OK",
          generalObservations: '',
      };

      const checklistDocRef = await addDoc(collection(db, 'completed-checklists'), finalChecklistData);
      
      toast({
          title: "Sucesso!",
          description: "Checklist retroativo finalizado com sucesso.",
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
        setIsSubmitting(false);
        setIsReviewing(false);
        setUploadProgress(0);
        setSubmissionStatus('');
    }
  };

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
  
  const selectedTemplateId = watch('templateId');


  return (
    <>
    <ItemChecklistDialog
        isOpen={!!currentItem}
        onClose={() => setCurrentItem(null)}
        item={currentItem?.item ?? null}
        onSave={handleSaveItem}
        allowGallery={true}
    />
    <AlertDialog open={isReviewing} onOpenChange={setIsReviewing}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revisar e Finalizar Checklist</AlertDialogTitle>
          <AlertDialogDescription>
            Confirme os dados abaixo. Após o envio, uma ordem de serviço será gerada se houver pendências.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {isSubmitting ? (
             <div className="space-y-4 py-4">
                <Progress value={uploadProgress} />
                <p className="text-sm text-center text-muted-foreground">{submissionStatus}</p>
            </div>
        ) : (
            <div className="text-sm space-y-2">
                <p><strong>Cavalo:</strong> {getValues("cavaloPlate")}</p>
                <p><strong>Carreta:</strong> {getValues("carretaPlate")}</p>
                <p><strong>Responsável:</strong> {getValues("responsibleName")}</p>
                <p><strong>Motorista:</strong> {getValues("driverName")}</p>
            </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSubmitting ? 'Enviando...' : 'Confirmar e Enviar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>


    <form onSubmit={(e) => e.preventDefault()} className="mx-auto grid w-full max-w-4xl gap-6">
      <PageHeader
        title="Checklist Retroativo (Admin)"
        description="Preencha um checklist de manutenção com a opção de anexar fotos da galeria."
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
            </Card>

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

            <Card>
                <CardHeader>
                    <CardTitle>Fotos Gerais do Veículo</CardTitle>
                    <CardDescription>Anexe as 6 fotos obrigatórias do conjunto (cavalo e carreta).</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-12">
                    <div className="space-y-6">
                        <h3 className="font-semibold text-lg text-center">Cavalo Mecânico</h3>
                        <div className="grid gap-4">
                            <Label>Foto Frontal *</Label>
                            <Controller name="vehicleImages.cavaloFrontal" control={control} render={({ field }) => <ImageUploader onCapture={field.onChange} cameraType="environment" allowGallery={true} />} />
                            {errors.vehicleImages?.cavaloFrontal && <p className="text-sm text-destructive">{errors.vehicleImages.cavaloFrontal.message}</p>}
                        </div>
                         <div className="grid gap-4">
                            <Label>Foto Lateral Direita *</Label>
                            <Controller name="vehicleImages.cavaloLateralDireita" control={control} render={({ field }) => <ImageUploader onCapture={field.onChange} cameraType="environment" allowGallery={true} />} />
                            {errors.vehicleImages?.cavaloLateralDireita && <p className="text-sm text-destructive">{errors.vehicleImages.cavaloLateralDireita.message}</p>}
                        </div>
                         <div className="grid gap-4">
                            <Label>Foto Lateral Esquerda *</Label>
                            <Controller name="vehicleImages.cavaloLateralEsquerda" control={control} render={({ field }) => <ImageUploader onCapture={field.onChange} cameraType="environment" allowGallery={true} />} />
                            {errors.vehicleImages?.cavaloLateralEsquerda && <p className="text-sm text-destructive">{errors.vehicleImages.cavaloLateralEsquerda.message}</p>}
                        </div>
                    </div>
                     <div className="space-y-6">
                        <h3 className="font-semibold text-lg text-center">Carreta</h3>
                        <div className="grid gap-4">
                            <Label>Foto Frontal *</Label>
                            <Controller name="vehicleImages.carretaFrontal" control={control} render={({ field }) => <ImageUploader onCapture={field.onChange} cameraType="environment" allowGallery={true} />} />
                            {errors.vehicleImages?.carretaFrontal && <p className="text-sm text-destructive">{errors.vehicleImages.carretaFrontal.message}</p>}
                        </div>
                         <div className="grid gap-4">
                            <Label>Foto Lateral Direita *</Label>
                            <Controller name="vehicleImages.carretaLateralDireita" control={control} render={({ field }) => <ImageUploader onCapture={field.onChange} cameraType="environment" allowGallery={true} />} />
                            {errors.vehicleImages?.carretaLateralDireita && <p className="text-sm text-destructive">{errors.vehicleImages.carretaLateralDireita.message}</p>}
                        </div>
                         <div className="grid gap-4">
                            <Label>Foto Lateral Esquerda *</Label>
                            <Controller name="vehicleImages.carretaLateralEsquerda" control={control} render={({ field }) => <ImageUploader onCapture={field.onChange} cameraType="environment" allowGallery={true} />} />
                            {errors.vehicleImages?.carretaLateralEsquerda && <p className="text-sm text-destructive">{errors.vehicleImages.carretaLateralEsquerda.message}</p>}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Validação e Assinaturas</CardTitle>
                    <CardDescription>O responsável e o motorista devem registrar a selfie e assinar abaixo para validar o checklist.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-12">
                     <div className="grid gap-4">
                        <Label>Responsável Técnico: {watch('responsibleName')}</Label>
                        <Controller
                            name="selfieResponsavel"
                            control={control}
                            render={({ field }) => (
                                <ImageUploader onCapture={field.onChange} allowGallery={true} />
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
                                <ImageUploader onCapture={field.onChange} allowGallery={true} />
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
                 <Button type="button" size="lg" onClick={handleReview} disabled={isSubmitting || !selectedTemplateId}>
                    Revisar e Finalizar Checklist
                </Button>
            </CardFooter>
          </>
        )}
        </div>
    </form>
    </>
  );
}

    