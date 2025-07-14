
"use client";

import { useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, Loader2, Camera, Trash2, Image as ImageIcon } from "lucide-react";
import Image from 'next/image';
import { handleDamageAssessment } from "@/lib/actions";
import { DamageAssessmentDialog } from "@/components/damage-assessment-dialog";
import { initialQuestions } from "@/lib/checklist-data";
import { db } from "@/lib/firebase";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";


const answerSchema = z.object({
  questionId: z.string(),
  questionText: z.string(),
  questionType: z.enum(["boolean", "text", "photo"]),
  answer: z.any(),
});

const checklistSchema = z.object({
  vehicleId: z.string().min(1, "Selecione um veículo"),
  initialKm: z.coerce.number().min(1, "Quilometragem inicial é obrigatória"),
  observations: z.string().optional(),
  answers: z.array(answerSchema).refine(
    (answers) => {
      return answers.every((a) => {
        if (a.questionType === "boolean") return typeof a.answer === "boolean";
        if (a.questionType === "text") return typeof a.answer === "string" && a.answer.length > 0;
        if (a.questionType === "photo") return typeof a.answer === "string" && a.answer.length > 0;
        return true;
      });
    },
    { message: "Todas as perguntas obrigatórias devem ser respondidas." }
  ),
});


type ChecklistFormValues = z.infer<typeof checklistSchema>;

export default function PreTripChecklistPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [vehicleImages, setVehicleImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [damageInfo, setDamageInfo] = useState("");
  
  const { control, handleSubmit, formState: { errors }, watch, reset } = useForm<ChecklistFormValues>({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      vehicleId: "",
      initialKm: 0,
      observations: "",
      answers: initialQuestions.map(q => ({
          questionId: q.id,
          questionText: q.text,
          questionType: q.type,
          answer: q.type === 'boolean' ? false : ''
      }))
    }
  });

  const { fields, update } = useFieldArray({
    control,
    name: "answers",
  });

  const handleVehicleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 4 * 1024 * 1024) {
          toast({ variant: "destructive", title: "Erro", description: "A imagem não pode ter mais que 4MB." });
          return;
      }

      setIsProcessing(true);
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Image = reader.result as string;
        setVehicleImages(prev => [...prev, base64Image]);

        try {
          const result = await handleDamageAssessment({
            vehicleImageUri: base64Image,
            checklistId: `checklist-${Date.now()}`,
            vehicleId: watch("vehicleId") || "RDO-GEN"
          });
          
          if(result.success && result.data?.damageDetected) {
            setDamageInfo(result.data.damageDescription || "Nenhuma descrição fornecida.");
            setDialogOpen(true);
          } else if (!result.success) {
            toast({ variant: "destructive", title: "Erro na Análise", description: result.error });
          }

        } catch (error) {
          toast({ variant: "destructive", title: "Erro", description: "Falha ao processar a imagem." });
        } finally {
          setIsProcessing(false);
        }
      };
      e.target.value = '';
    }
  };

  const handleQuestionImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
     if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const base64Image = reader.result as string;
            update(index, { ...fields[index], answer: base64Image });
        };
     }
  };


  const onSubmit = async (data: ChecklistFormValues) => {
    if(vehicleImages.length === 0) {
        toast({ variant: "destructive", title: "Erro", description: "É obrigatório o envio de pelo menos uma foto do veículo." });
        return;
    }
    
    // This is a simplified transformation. A real-world scenario might be more complex.
    const questionsForFirestore = data.answers.map(a => ({
        id: a.questionId,
        text: a.questionText,
        status: a.answer === true ? 'OK' : (a.answer ? 'OK' : 'Não OK'), // Simplified logic
        observation: a.questionType === 'text' ? a.answer : '',
        photo: a.questionType === 'photo' ? a.answer : '',
        photoRequirement: 'never' as const, // Simplified
    }));

    try {
        const hasIssues = questionsForFirestore.some(item => item.status === "Não OK");
        const submissionData = {
          createdAt: Timestamp.now(),
          status: hasIssues ? "Pendente" : "OK",
          type: "viagem",
          category: 'nao_aplicavel',
          name: 'Checklist de Viagem',
          driver: 'Motorista Padrão', // Should come from auth
          vehicle: data.vehicleId,
          mileage: data.initialKm,
          questions: questionsForFirestore,
          generalObservations: data.observations,
        };

        await addDoc(collection(db, 'completed-checklists'), submissionData);

        toast({
            title: "Checklist Enviado com Sucesso!",
            description: "Seu checklist de viagem foi registrado.",
        });
        reset();
        router.push("/dashboard");

    } catch (error) {
        console.error("Checklist submission error:", error);
        toast({
            variant: "destructive",
            title: "Erro no Envio",
            description: "Não foi possível enviar o checklist de viagem.",
        });
    }
  };
  
  return (
    <>
      <DamageAssessmentDialog 
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        damageDescription={damageInfo}
        onConfirm={() => {
            setDialogOpen(false);
            toast({ title: "Aviso", description: "Prossiga com o preenchimento, mas não se esqueça de adicionar a justificativa nas observações." });
        }}
      />
      <div className="mx-auto grid w-full max-w-4xl gap-2">
        <h1 className="text-3xl font-semibold font-headline">Checklist de Viagem</h1>
        <p className="text-muted-foreground">Preencha todos os campos para iniciar sua jornada com segurança.</p>
      </div>
      <div className="mx-auto grid w-full max-w-4xl items-start gap-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Informações Iniciais</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <Label htmlFor="initialKm">Quilometragem Inicial</Label>
                      <Controller
                          name="initialKm"
                          control={control}
                          render={({ field }) => <Input id="initialKm" type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />}
                      />
                      {errors.initialKm && <p className="text-sm text-destructive">{errors.initialKm.message}</p>}
                  </div>
                </div>
                <div className="grid gap-2">
                    <Label>Fotos Gerais do Veículo (Frente, Traseira, Laterais)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {vehicleImages.map((src, index) => (
                            <div key={index} className="relative aspect-video rounded-md overflow-hidden" data-ai-hint="car truck">
                                <Image src={src} alt={`Veículo ${index + 1}`} layout="fill" className="object-cover" />
                            </div>
                        ))}
                        {vehicleImages.length < 4 && (
                            <Label htmlFor="photo-upload" className="flex flex-col items-center justify-center w-full h-full aspect-video border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                    {isProcessing ? (
                                        <Loader2 className="w-8 h-8 mb-4 text-primary animate-spin" />
                                    ) : (
                                        <UploadCloud className="w-8 h-8 mb-4 text-gray-500" />
                                    )}
                                    <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Clique para enviar</span></p>
                                    <p className="text-xs text-gray-500">PNG, JPG (MAX. 4MB)</p>
                                </div>
                                <Input id="photo-upload" type="file" className="hidden" accept="image/*" capture="environment" onChange={handleVehicleImageUpload} disabled={isProcessing} />
                            </Label>
                        )}
                    </div>
                     {vehicleImages.length === 0 && <p className="text-sm text-destructive">Envio de foto geral do veículo é obrigatório</p>}
                </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Itens de Verificação</CardTitle>
              <CardDescription>Responda a todas as perguntas abaixo.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              {fields.map((item, index) => (
                <div key={item.id} className="grid gap-3 p-4 border rounded-lg">
                   <Label className="font-semibold">{index + 1}. {item.questionText}</Label>
                    <Controller
                        name={`answers.${index}.answer`}
                        control={control}
                        render={({ field }) => {
                            switch(item.questionType) {
                                case 'boolean':
                                    return (
                                        <div className="flex items-center space-x-2">
                                            <Checkbox checked={field.value} onCheckedChange={field.onChange} id={`q-${item.id}`} />
                                            <Label htmlFor={`q-${item.id}`}>Sim / Verificado</Label>
                                        </div>
                                    )
                                case 'text':
                                    return <Textarea placeholder="Digite sua resposta..." {...field} />;
                                case 'photo':
                                    return (
                                        <div>
                                            {field.value ? (
                                                <div className="relative w-full max-w-xs aspect-video rounded-md overflow-hidden">
                                                    <Image src={field.value} alt="Foto da resposta" layout="fill" className="object-cover" />
                                                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => field.onChange('')}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <Label htmlFor={`photo-${item.id}`} className="flex flex-col items-center justify-center w-full max-w-xs h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                                                    <div className="flex flex-col items-center justify-center text-center">
                                                        <Camera className="w-8 h-8 mb-2 text-gray-500" />
                                                        <p className="text-sm text-gray-500">Enviar Foto</p>
                                                    </div>
                                                    <Input id={`photo-${item.id}`} type="file" className="hidden" accept="image/*" capture="environment" onChange={(e) => handleQuestionImageUpload(e, index)} />
                                                </Label>
                                            )}
                                        </div>
                                    )
                                default:
                                    return null;
                            }
                        }}
                    />
                    {errors.answers?.[index]?.answer && <p className="text-sm text-destructive">Este campo é obrigatório</p>}
                </div>
              ))}

              <div className="grid gap-2">
                <Label htmlFor="observacoes">Observações Gerais</Label>
                 <Controller name="observations" control={control} render={({ field }) => (
                    <Textarea id="observacoes" placeholder="Alguma observação sobre o veículo ou a viagem?" {...field} />
                 )} />
              </div>
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit">Enviar Checklist</Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </>
  );
}

    