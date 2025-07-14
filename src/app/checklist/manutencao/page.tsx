
"use client";

import { useState, useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, FileQuestion, MessageSquare, Paperclip, ThumbsDown, ThumbsUp, ListChecks, AlertTriangle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChecklistTemplate } from "@/lib/checklist-templates-data";
import { ItemChecklistDialog } from "@/components/item-checklist-dialog";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, addDoc, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { SignaturePad } from "@/components/signature-pad";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";


type ItemData = ChecklistTemplate['questions'][0] & { status: "OK" | "Não OK" | "N/A", photo?: string, observation?: string };

const itemSchema = z.object({
  id: z.string(),
  text: z.string(),
  photoRequirement: z.enum(["always", "if_not_ok", "never"]),
  status: z.enum(["OK", "Não OK", "N/A"]),
  photo: z.string().optional(),
  observation: z.string().optional(),
}).refine(data => {
    if (data.status === 'N/A') return true;
    if (data.photoRequirement === 'always') {
        return !!data.photo;
    }
    if (data.photoRequirement === 'if_not_ok' && data.status === 'Não OK') {
        return !!data.photo;
    }
    return true;
}, {
    message: "Foto é obrigatória para esta avaliação.",
    path: ["photo"],
});


const checklistSchema = z.object({
  templateId: z.string(),
  templateName: z.string(),
  vehicleId: z.string().min(1, "Selecione um veículo"),
  responsibleName: z.string().min(1, "Nome do responsável é obrigatório"),
  driverName: z.string().min(1, "Nome do motorista é obrigatório"),
  mileage: z.coerce.number().min(1, "Quilometragem é obrigatória"),
  questions: z.array(itemSchema),
  generalObservations: z.string().optional(),
  assinaturaResponsavel: z.string().min(1, "Assinatura do responsável é obrigatória."),
  assinaturaMotorista: z.string().min(1, "Assinatura do motorista é obrigatória."),
});

type ChecklistFormValues = z.infer<typeof checklistSchema>;

const statusIcons = {
  "OK": <ThumbsUp className="h-5 w-5 text-green-600" />,
  "Não OK": <ThumbsDown className="h-5 w-5 text-destructive" />,
  "N/A": <FileQuestion className="h-5 w-5 text-muted-foreground" />,
};

function TemplateSelectionScreen({ onSelect, templates, isLoading }: { onSelect: (template: ChecklistTemplate) => void, templates: ChecklistTemplate[], isLoading: boolean }) {
  return (
    <div className="mx-auto grid w-full max-w-4xl gap-6">
      <div className="flex flex-col gap-2 text-center">
        <ListChecks className="h-12 w-12 mx-auto text-primary" />
        <h1 className="text-3xl font-semibold font-headline">
          Checklist de Manutenção
        </h1>
        <p className="text-muted-foreground">
          Primeiro, selecione o modelo de checklist que deseja utilizar para a inspeção.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Qual modelo de checklist deseja utilizar?</CardTitle>
          <CardDescription>Os modelos contêm perguntas específicas para cada tipo de veículo ou inspeção.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            templates.map(template => (
             <Card key={template.id} className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-semibold">{template.name}</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {template.type} - {template.category.replace(/_/g, ' ')}
                </p>
              </div>
              <Button onClick={() => onSelect(template)}>Selecionar</Button>
            </Card>
            ))
          )}
           {!isLoading && templates.length === 0 && (
              <p className="text-center text-muted-foreground">Nenhum modelo de checklist encontrado. Crie um na tela de "Modelos de Checklist".</p>
           )}
        </CardContent>
      </Card>
    </div>
  );
}


export default function MaintenanceChecklistPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<{ itemIndex: number; item: ItemData } | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'checklist-templates'), (snapshot) => {
        const templatesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChecklistTemplate));
        setTemplates(templatesData.filter(t => t.type === 'manutencao'));
        setIsTemplatesLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const { control, handleSubmit, formState: { errors, isSubmitting }, setValue, watch, reset } = useForm<ChecklistFormValues>({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      vehicleId: "",
      responsibleName: "Pedro Mecânico", // Mock, could come from auth
      driverName: "João Motorista",
      mileage: undefined,
      questions: [],
      generalObservations: "",
      assinaturaResponsavel: "",
      assinaturaMotorista: "",
    },
    mode: 'onBlur' 
  });
  
  const { fields: questionFields } = useFieldArray({
      control,
      name: "questions"
  });

  const watchResponsibleName = watch("responsibleName");
  const watchDriverName = watch("driverName");
  const watchAllErrors = errors;
  const showSignatureError = !!(watchAllErrors.assinaturaResponsavel || watchAllErrors.assinaturaMotorista) && (!watch('assinaturaResponsavel') || !watch('assinaturaMotorista'));


  const handleSelectTemplate = (template: ChecklistTemplate) => {
    setSelectedTemplate(template);
    const initialItems = template.questions.map(q => ({
      ...q,
      status: "N/A" as const,
      photo: undefined,
      observation: undefined,
    }));
    reset({
        templateId: template.id,
        templateName: template.name,
        vehicleId: "",
        responsibleName: "Pedro Mecânico", // Mock
        driverName: "João Motorista",
        mileage: undefined,
        questions: initialItems,
        generalObservations: "",
        assinaturaResponsavel: "",
        assinaturaMotorista: "",
    });
  };

  const handleOpenDialog = (itemIndex: number) => {
    setSelectedItem({ itemIndex, item: watch(`questions.${itemIndex}`) as any });
  };
  
  const handleDialogSave = (data: { status: "OK" | "Não OK" | "N/A"; photo?: string; observation?: string }) => {
    if (selectedItem) {
      const { itemIndex } = selectedItem;
      setValue(`questions.${itemIndex}.status`, data.status, { shouldValidate: true });
      setValue(`questions.${itemIndex}.photo`, data.photo, { shouldValidate: true });
      setValue(`questions.${itemIndex}.observation`, data.observation, { shouldValidate: true });
      setSelectedItem(null);
    }
  };

  const onSubmit = async (data: ChecklistFormValues) => {
    try {
      const hasIssues = data.questions.some(item => item.status === "Não OK");
      const submissionData = {
        templateId: data.templateId,
        templateName: data.templateName,
        vehicleId: data.vehicleId,
        mileage: data.mileage,
        questions: data.questions.map(q => ({
            id: q.id,
            text: q.text,
            photoRequirement: q.photoRequirement,
            status: q.status,
            photo: q.photo ?? '',
            observation: q.observation ?? ''
        })),
        generalObservations: data.generalObservations ?? '',
        responsibleName: data.responsibleName ?? '',
        createdAt: Timestamp.now(),
        status: hasIssues ? "Pendente" : "OK",
        type: selectedTemplate?.type,
        category: selectedTemplate?.category,
        name: selectedTemplate?.name,
        driver: data.driverName ?? '',
        vehicle: data.vehicleId,
        assinaturaResponsavel: data.assinaturaResponsavel,
        assinaturaMotorista: data.assinaturaMotorista,
      };

      const docRef = await addDoc(collection(db, 'completed-checklists'), submissionData);
      router.push(`/checklist/completed/${docRef.id}`);

    } catch (error) {
       console.error("Checklist submission error:", error);
       toast({
        variant: "destructive",
        title: "Erro no Envio",
        description: "Não foi possível enviar o checklist. Verifique os campos e tente novamente.",
      });
    }
  };
  
  if (!selectedTemplate) {
    return <TemplateSelectionScreen templates={templates} isLoading={isTemplatesLoading} onSelect={handleSelectTemplate} />;
  }

  return (
    <>
      <ItemChecklistDialog
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem?.item as any}
        onSave={handleDialogSave}
        key={selectedItem?.item.id}
      />
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold font-headline">
            {selectedTemplate.name}
          </h1>
          <p className="text-muted-foreground">
            Realize a inspeção completa do veículo, preenchendo todos os itens.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="vehicleId">Veículo</Label>
                <Controller
                  name="vehicleId"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger id="vehicleId">
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
                <Controller
                  name="responsibleName"
                  control={control}
                  render={({ field }) => <Input id="responsibleName" {...field} />}
                />
                {errors.responsibleName && <p className="text-sm text-destructive">{errors.responsibleName.message}</p>}
              </div>
              <div className="grid gap-2">
                  <Label htmlFor="driverName">Nome do Motorista</Label>
                  <Controller
                      name="driverName"
                      control={control}
                      render={({field}) => <Input id="driverName" {...field} />}
                  />
                  {errors.driverName && <p className="text-sm text-destructive">{errors.driverName.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="mileage">Quilometragem Atual</Label>
                <Controller
                  name="mileage"
                  control={control}
                  render={({ field }) => <Input id="mileage" type="number" {...field} value={field.value ?? ""} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />}
                />
                {errors.mileage && <p className="text-sm text-destructive">{errors.mileage.message}</p>}
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
                <CardTitle>Itens de Verificação</CardTitle>
            </CardHeader>
             <CardContent className="space-y-2">
              {questionFields.map((item, itemIndex) => {
                const currentItemState = watch(`questions.${itemIndex}`);
                const isCompleted = currentItemState.status !== "N/A";
                const errorForThisItem = errors.questions?.[itemIndex]?.photo?.message;
                
                return (
                  <div key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleOpenDialog(itemIndex)}
                      className="w-full text-left p-4 border rounded-lg transition-colors flex justify-between items-center hover:bg-muted/50 data-[error=true]:border-destructive"
                      data-error={!!errorForThisItem}
                    >
                      <span className="font-medium">{item.text}</span>
                      <div className="flex items-center gap-3">
                        {currentItemState.photo && <Paperclip className="h-4 w-4 text-muted-foreground" />}
                        {currentItemState.observation && <MessageSquare className="h-4 w-4 text-muted-foreground" />}
                        {isCompleted ? (
                          statusIcons[currentItemState.status]
                        ) : (
                          <CheckCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                    {errorForThisItem && <p className="text-sm text-destructive mt-1">{errorForThisItem}</p>}
                  </div>
                );
              })}
             </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
                <CardTitle>Observações Gerais</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="grid gap-2">
                    <Label htmlFor="generalObservations">Observações Gerais do Checklist</Label>
                    <Controller 
                        name="generalObservations"
                        control={control}
                        render={({ field }) => (
                            <Textarea id="generalObservations" placeholder="Observações gerais sobre a inspeção..." {...field} value={field.value ?? ''} />
                        )}
                    />
                </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
                <CardTitle>Assinaturas</CardTitle>
                <CardDescription>O responsável técnico e o motorista devem assinar para validar o checklist.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8">
                <div className="grid gap-2">
                    <Label className="font-semibold">Assinatura do Responsável Técnico</Label>
                    <SignaturePad
                        onEnd={(signature) => {
                          setValue('assinaturaResponsavel', signature, { shouldValidate: true, shouldDirty: true });
                        }}
                    />
                    <p className="text-sm text-muted-foreground">Responsável: {watchResponsibleName || 'N/A'}</p>
                    {errors.assinaturaResponsavel && <p className="text-sm text-destructive">{errors.assinaturaResponsavel.message}</p>}
                </div>
                 <div className="grid gap-2">
                    <Label className="font-semibold">Assinatura do Motorista</Label>
                    <SignaturePad
                        onEnd={(signature) => {
                          setValue('assinaturaMotorista', signature, { shouldValidate: true, shouldDirty: true });
                        }}
                    />
                    <p className="text-sm text-muted-foreground">Motorista: {watchDriverName || 'N/A'}</p>
                    {errors.assinaturaMotorista && <p className="text-sm text-destructive">{errors.assinaturaMotorista.message}</p>}
                </div>
            </CardContent>
             {showSignatureError && (
                <CardContent>
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Assinaturas Obrigatórias</AlertTitle>
                        <AlertDescription>Ambas as assinaturas são necessárias para finalizar o checklist.</AlertDescription>
                    </Alert>
                </CardContent>
            )}
            <CardFooter className="border-t px-6 py-4 flex justify-between">
              <Button type="submit" size="lg" disabled={isSubmitting}>{isSubmitting ? 'Enviando...' : 'Finalizar Checklist'}</Button>
              <Button type="button" variant="outline" onClick={() => setSelectedTemplate(null)}>Cancelar e Voltar</Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </>
  );
}
