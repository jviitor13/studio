
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
import { Camera, Trash2 } from "lucide-react";
import Image from 'next/image';
import { initialMaintenanceQuestions } from "@/lib/maintenance-checklist-data";

const answerSchema = z.object({
  questionId: z.string(),
  questionText: z.string(),
  questionType: z.enum(["boolean", "text", "photo"]),
  answer: z.any(),
});

const checklistSchema = z.object({
  vehicleId: z.string().min(1, "Selecione um veículo"),
  mechanicId: z.string().min(1, "Identificação do mecânico é obrigatória"),
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

export default function MaintenanceChecklistPage() {
  const { toast } = useToast();
  
  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<ChecklistFormValues>({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      vehicleId: "",
      mechanicId: "Pedro Mecânico", // Mock data, would come from auth
      observations: "",
      answers: initialMaintenanceQuestions.map(q => ({
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

  const handleQuestionImageUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
     if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        if (file.size > 4 * 1024 * 1024) {
            toast({ variant: "destructive", title: "Erro", description: "A imagem não pode ter mais que 4MB." });
            return;
        }
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const base64Image = reader.result as string;
            update(index, { ...fields[index], answer: base64Image });
        };
        e.target.value = '';
     }
  };

  const onSubmit = (data: ChecklistFormValues) => {
    console.log("Maintenance Checklist Submitted:", JSON.stringify(data, null, 2));
    toast({ title: "Checklist de Manutenção Enviado!", description: "O checklist foi registrado com sucesso." });
  };
  
  return (
    <>
      <div className="mx-auto grid w-full max-w-4xl gap-2">
        <h1 className="text-3xl font-semibold font-headline">Checklist de Manutenção</h1>
        <p className="text-muted-foreground">Preencha todos os itens de verificação técnica do veículo.</p>
      </div>
      <div className="mx-auto grid w-full max-w-4xl items-start gap-6">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Informações do Veículo e Mecânico</CardTitle>
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
                      <Label htmlFor="mechanicId">Mecânico Responsável</Label>
                      <Controller
                          name="mechanicId"
                          control={control}
                          render={({ field }) => <Input id="mechanicId" type="text" {...field} disabled />}
                      />
                      {errors.mechanicId && <p className="text-sm text-destructive">{errors.mechanicId.message}</p>}
                  </div>
                </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Itens de Inspeção Técnica</CardTitle>
              <CardDescription>Verifique cada item e anote as conformidades e problemas.</CardDescription>
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
                                            <Label htmlFor={`q-${item.id}`}>Conforme / Verificado</Label>
                                        </div>
                                    )
                                case 'text':
                                    return <Textarea placeholder="Descreva a condição ou medida..." {...field} />;
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
                                                    <Input id={`photo-${item.id}`} type="file" className="hidden" accept="image/png, image/jpeg" onChange={(e) => handleQuestionImageUpload(e, index)} />
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
                <Label htmlFor="observacoes">Observações e Diagnóstico Final</Label>
                 <Controller name="observations" control={control} render={({ field }) => (
                    <Textarea id="observacoes" placeholder="Descreva qualquer problema encontrado e as ações recomendadas." {...field} rows={4} />
                 )} />
              </div>
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit">Finalizar e Salvar Checklist</Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </>
  );
}
