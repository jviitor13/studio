
'use client';

import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { collection, addDoc, Timestamp, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Trash2 } from 'lucide-react';
import { SignaturePad } from '@/components/signature-pad';
import { PageHeader } from '@/components/page-header';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { compressImage } from '@/lib/image-compressor';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { ChecklistItem as ChecklistItemData, ChecklistTemplate } from '@/lib/checklist-templates-data';
import { ItemChecklistDialog } from '@/components/item-checklist-dialog';
import { Skeleton } from '@/components/ui/skeleton';

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
  questions: z.array(itemSchema),
  assinaturaResponsavel: z.string().min(1, 'A assinatura do responsável é obrigatória.'),
  assinaturaMotorista: z.string().min(1, 'A assinatura do motorista é obrigatória.'),
}).refine(data => {
    return data.questions.every(q => {
        if (q.photoRequirement === 'always' && !q.photo) return false;
        if (q.photoRequirement === 'if_not_ok' && q.status === 'Não OK' && !q.photo) return false;
        return true;
    });
}, {
    message: "Uma ou mais fotos obrigatórias não foram adicionadas.",
    path: ["questions"],
});

type ChecklistFormValues = z.infer<typeof checklistSchema>;

export default function MaintenanceChecklistPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    register,
    formState: { errors },
    reset
  } = useForm<ChecklistFormValues>({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      templateId: '',
      vehicleId: '',
      responsibleName: 'Pedro Mecânico',
      driverName: 'João Motorista',
      mileage: 0,
      questions: [],
      assinaturaResponsavel: '',
      assinaturaMotorista: '',
    },
  });

  const { fields, replace } = useFieldArray({ control, name: "questions" });

  useEffect(() => {
    setIsLoadingTemplates(true);
    const q = query(collection(db, 'checklist-templates'), where('type', '==', 'Manutenção'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const templatesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChecklistTemplate));
        setTemplates(templatesData);
        setIsLoadingTemplates(false);
    });
    return () => unsubscribe();
  }, []);

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
        setSelectedTemplate(template);
        const questions = template.questions.map(q => ({
            ...q,
            status: "N/A",
            observation: '',
            photo: ''
        } as const));
        replace(questions);
    } else {
        setSelectedTemplate(null);
        replace([]);
    }
  };


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
            type: "Manutenção",
            questions: data.questions,
            assinaturaResponsavel: data.assinaturaResponsavel,
            assinaturaMotorista: data.assinaturaMotorista,
        };

        const docRef = await addDoc(collection(db, 'completed-checklists'), submissionData);

        toast({
            title: "Sucesso!",
            description: "Checklist de manutenção enviado e ordem de serviço aberta.",
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
    }
  };

  const watchResponsibleName = watch("responsibleName");
  const watchDriverName = watch("driverName");

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6">
      <PageHeader
        title="Novo Checklist de Manutenção"
        description="Registre uma nova manutenção corretiva ou emergencial para um veículo."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
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
                    <Select onValueChange={(value) => {
                      field.onChange(value)
                      handleTemplateChange(value);
                    }} defaultValue={field.value}>
                      <SelectTrigger id="templateId"><SelectValue placeholder="Selecione o modelo" /></SelectTrigger>
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
                    <SelectTrigger id="vehicleId"><SelectValue placeholder="Selecione a placa" /></SelectTrigger>
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
              <Input id="responsibleName" {...register('responsibleName')} />
              {errors.responsibleName && <p className="text-sm text-destructive">{errors.responsibleName.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="driverName">Nome do Motorista</Label>
              <Input id="driverName" {...register('driverName')} />
              {errors.driverName && <p className="text-sm text-destructive">{errors.driverName.message}</p>}
            </div>
            <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="mileage">Quilometragem Atual</Label>
                <Input id="mileage" type="number" {...register('mileage', { valueAsNumber: true })} />
                {errors.mileage && <p className="text-sm text-destructive">{errors.mileage.message}</p>}
            </div>
          </CardContent>
        </Card>
        
        {selectedTemplate && (
            <>
                <Card>
                    <CardHeader>
                        <CardTitle>Itens de Verificação</CardTitle>
                        <CardDescription>Responda a todas as perguntas do checklist selecionado.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Items will be handled by the dialog */}
                    </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Assinaturas</CardTitle>
                    <CardDescription>O responsável e o motorista devem assinar para validar.</CardDescription>
                     {errors.assinaturaResponsavel && <p className="text-sm text-destructive mt-2">{errors.assinaturaResponsavel.message}</p>}
                     {errors.assinaturaMotorista && <p className="text-sm text-destructive mt-2">{errors.assinaturaMotorista.message}</p>}
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
            </>
        )}
        
        <CardFooter className="border-t px-6 py-4">
            <Button type="submit" size="lg" disabled={isSubmitting || !selectedTemplate}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Enviando...' : 'Finalizar e Abrir Ordem de Serviço'}
            </Button>
        </CardFooter>
      </form>
    </div>
  );
}
