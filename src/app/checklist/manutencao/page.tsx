
'use client';

import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect, useCallback } from 'react';
import { collection, addDoc, Timestamp, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, CheckCircle, GripVertical } from 'lucide-react';
import { SignaturePad } from '@/components/signature-pad';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { ChecklistTemplate, ChecklistItem as ChecklistItemData } from '@/lib/checklist-templates-data';
import { ItemChecklistDialog } from '@/components/item-checklist-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';

const itemSchema = z.object({
  id: z.string(),
  text: z.string(),
  photoRequirement: z.enum(["always", "if_not_ok", "never"]),
  status: z.enum(["OK", "Não OK", "N/A"]),
  photo: z.string().optional(),
  observation: z.string().optional(),
});

const checklistSchema = z.object({
  templateId: z.string().min(1, 'Selecione um modelo de checklist.'),
  vehicleId: z.string().min(1, 'Selecione um veículo.'),
  responsibleName: z.string().min(1, 'O nome do responsável é obrigatório.'),
  driverName: z.string().min(1, 'O nome do motorista é obrigatório.'),
  mileage: z.coerce.number().min(1, 'A quilometragem é obrigatória.'),
  questions: z.array(itemSchema).min(1, "O checklist precisa ter itens.")
  .refine(items => items.every(item => item.status !== 'N/A'), {
    message: 'Todos os itens de verificação devem ser avaliados (OK ou Não OK).',
  }).refine(items => items.every(item => {
      if (item.photoRequirement === 'always') return !!item.photo;
      if (item.photoRequirement === 'if_not_ok' && item.status === 'Não OK') return !!item.photo;
      return true;
  }), {
    message: 'Uma ou mais fotos obrigatórias não foram adicionadas. Verifique os itens.',
  }),
  assinaturaResponsavel: z.string().min(1, 'A assinatura do responsável é obrigatória.'),
  assinaturaMotorista: z.string().min(1, 'A assinatura do motorista é obrigatória.'),
});


type ChecklistFormValues = z.infer<typeof checklistSchema>;

export default function MaintenanceChecklistPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [currentItem, setCurrentItem] = useState<{item: ChecklistItemData, index: number} | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    register,
    formState: { errors },
    getValues,
    trigger
  } = useForm<ChecklistFormValues>({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      templateId: '',
      vehicleId: '',
      responsibleName: '',
      driverName: '',
      mileage: 0,
      questions: [],
      assinaturaResponsavel: '',
      assinaturaMotorista: '',
    },
    mode: 'onChange'
  });
  
  const { fields, replace, update } = useFieldArray({ control, name: "questions" });

  useEffect(() => {
    setIsLoadingTemplates(true);
    const q = query(collection(db, 'checklist-templates'), where('type', '==', 'Manutenção'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const templatesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChecklistTemplate));
        setTemplates(templatesData);
        setIsLoadingTemplates(false);
    }, (error) => {
        console.error("Error fetching templates:", error);
        toast({
            variant: "destructive",
            title: "Erro ao Carregar Modelos",
            description: "Não foi possível buscar os dados do Firestore.",
        });
        setIsLoadingTemplates(false);
    });
    return () => unsubscribe();
  }, [toast]);

  const handleTemplateChange = (templateId: string) => {
    setValue('templateId', templateId, { shouldValidate: true });
    const template = templates.find(t => t.id === templateId);
    if (template) {
        setSelectedTemplate(template);
        const questions = template.questions.map(q => ({
            ...q,
            status: "N/A" as const, // Initial unevaluated state
            observation: '',
            photo: ''
        }));
        replace(questions);
    } else {
        setSelectedTemplate(null);
        replace([]);
    }
  };

  const handleSaveItem = useCallback((data: { status: "OK" | "Não OK"; photo?: string; observation?: string }) => {
    if (currentItem) {
      const currentQuestion = getValues(`questions.${currentItem.index}`);
      update(currentItem.index, {
        ...currentQuestion,
        status: data.status,
        photo: data.photo,
        observation: data.observation,
      });
      // Use a timeout to ensure state update before triggering validation
      setTimeout(() => trigger("questions"), 100);
    }
    setCurrentItem(null);
  }, [currentItem, update, getValues, trigger]);

  const handleReview = async () => {
    const isValid = await trigger();
    if (isValid) {
      setIsReviewing(true);
    } else {
       toast({ variant: "destructive", title: "Campos Inválidos", description: "Por favor, revise os campos marcados em vermelho e tente novamente." });
    }
  }


  const onSubmit = async (data: ChecklistFormValues) => {
    setIsSubmitting(true);
    
    try {
        const hasIssues = data.questions.some(item => item.status === "Não OK");

        const submissionData = {
            name: selectedTemplate?.name || 'Checklist de Manutenção',
            vehicle: data.vehicleId,
            mileage: data.mileage,
            responsibleName: data.responsibleName,
            driver: data.driverName,
            createdAt: Timestamp.now(),
            status: hasIssues ? "Pendente" : "OK",
            type: "Manutenção" as const,
            category: selectedTemplate?.category,
            questions: data.questions,
            assinaturaResponsavel: data.assinaturaResponsavel,
            assinaturaMotorista: data.assinaturaMotorista,
        };

        const docRef = await addDoc(collection(db, 'completed-checklists'), submissionData);

        toast({
            title: "Sucesso!",
            description: "Checklist de manutenção enviado com sucesso.",
        });

        router.push(`/checklist/completed/${docRef.id}`);

    } catch (error: any) {
        console.error("Checklist submission error:", error);
        toast({
            variant: "destructive",
            title: "Erro no Envio",
            description: `Não foi possível enviar o checklist. Detalhes: ${error.message}`,
        });
    } finally {
        setIsSubmitting(false);
        setIsReviewing(false);
    }
  };

  const watchResponsibleName = watch("responsibleName");
  const watchDriverName = watch("driverName");

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
                Confirme os dados abaixo antes de finalizar. Esta ação não poderá ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="text-sm space-y-2 max-h-60 overflow-y-auto pr-2">
                <p><strong>Veículo:</strong> {getValues("vehicleId")}</p>
                <p><strong>Responsável:</strong> {getValues("responsibleName")}</p>
                <p><strong>Motorista:</strong> {getValues("driverName")}</p>
                <p><strong>Quilometragem:</strong> {getValues("mileage")}</p>
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

    <form className="mx-auto grid w-full max-w-4xl gap-6" onSubmit={(e) => e.preventDefault()}>
        <PageHeader
            title="Novo Checklist de Manutenção"
            description="Registre uma nova manutenção corretiva ou emergencial para um veículo."
        />

        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Informações Gerais</CardTitle>
                    <CardDescription>Primeiro, selecione o modelo e preencha os dados principais.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="grid gap-2">
                        <Label htmlFor="templateId">Modelo do Checklist</Label>
                        {isLoadingTemplates ? <Skeleton className="h-10 w-full" /> : (
                            <Controller
                                name="templateId"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={handleTemplateChange} value={field.value}>
                                        <SelectTrigger id="templateId" className={cn(errors.templateId && "border-destructive")}>
                                          <SelectValue placeholder="Selecione o modelo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                        )}
                        {errors.templateId && <p className="text-sm text-destructive">{errors.templateId.message}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="vehicleId">Veículo</Label>
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
                        <Label htmlFor="responsibleName">Nome do Responsável</Label>
                        <Input id="responsibleName" {...register('responsibleName')} className={cn(errors.responsibleName && "border-destructive")} />
                        {errors.responsibleName && <p className="text-sm text-destructive">{errors.responsibleName.message}</p>}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="driverName">Nome do Motorista</Label>
                        <Input id="driverName" {...register('driverName')} className={cn(errors.driverName && "border-destructive")} />
                        {errors.driverName && <p className="text-sm text-destructive">{errors.driverName.message}</p>}
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="mileage">Quilometragem Atual</Label>
                        <Input id="mileage" type="number" {...register('mileage')} className={cn(errors.mileage && "border-destructive")} />
                        {errors.mileage && <p className="text-sm text-destructive">{errors.mileage.message}</p>}
                    </div>
                </CardContent>
            </Card>
            
            {selectedTemplate && (
                <>
                    <Card>
                        <CardHeader>
                            <CardTitle>Itens de Verificação</CardTitle>
                            <CardDescription>Clique em cada item para avaliá-lo.</CardDescription>
                            {errors.questions && (
                                <p className="text-sm text-destructive font-semibold mt-2 p-2 bg-destructive/10 rounded-md">
                                    {errors.questions.message}
                                </p>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {fields.map((item, index) => {
                                const questionState = watch(`questions.${index}`);
                                const isPhotoMissing = (item.photoRequirement === 'always' && !questionState.photo) || (item.photoRequirement === 'if_not_ok' && questionState.status === 'Não OK' && !questionState.photo);
                                const isNotAnswered = questionState.status === 'N/A';
                                return (
                                    <div key={item.id}
                                        onClick={() => setCurrentItem({ item, index })}
                                        className={`flex items-center justify-between p-3 border rounded-md cursor-pointer transition-colors hover:bg-muted/80 ${isNotAnswered ? 'border-dashed' : ''} ${isPhotoMissing ? 'border-destructive' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {questionState.status === 'OK' && <CheckCircle className="h-5 w-5 text-green-600" />}
                                            {questionState.status === 'Não OK' && <AlertTriangle className="h-5 w-5 text-destructive" />}
                                            {isNotAnswered && <GripVertical className="h-5 w-5 text-muted-foreground" />}
                                            <span>{item.text}</span>
                                        </div>
                                        <Button type="button" variant="ghost" size="sm">Editar</Button>
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Assinaturas</CardTitle>
                            <CardDescription>O responsável e o motorista devem assinar para validar.</CardDescription>
                             {(errors.assinaturaResponsavel || errors.assinaturaMotorista) && (
                                <p className="text-sm text-destructive font-semibold mt-2 p-2 bg-destructive/10 rounded-md">
                                    {errors.assinaturaResponsavel?.message || errors.assinaturaMotorista?.message}
                                </p>
                            )}
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-8">
                            <div className="grid gap-2">
                                <Label className="font-semibold">Assinatura do Responsável</Label>
                                <SignaturePad onEnd={(signature) => setValue('assinaturaResponsavel', signature, { shouldValidate: true, shouldDirty: true })} />
                                <p className="text-sm text-muted-foreground">Responsável: {watchResponsibleName || 'N/A'}</p>
                            </div>
                            <div className="grid gap-2">
                                <Label className="font-semibold">Assinatura do Motorista</Label>
                                <SignaturePad onEnd={(signature) => setValue('assinaturaMotorista', signature, { shouldValidate: true, shouldDirty: true })} />
                                <p className="text-sm text-muted-foreground">Motorista: {watchDriverName || 'N/A'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    <CardFooter className="border-t px-6 py-4">
                        <Button type="button" size="lg" onClick={handleReview} disabled={isSubmitting || !selectedTemplate}>
                            {isSubmitting ? 'Enviando...' : 'Revisar e Finalizar Checklist'}
                        </Button>
                    </CardFooter>
                </>
            )}
        </div>
    </form>
    </>
  );
}

    