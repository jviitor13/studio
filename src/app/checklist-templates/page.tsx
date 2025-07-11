"use client";

import { useState } from 'react';
import { PageHeader } from "@/components/page-header";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Trash2, GripVertical } from "lucide-react";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { defaultChecklistTemplates } from '@/lib/checklist-templates-data';

const questionSchema = z.object({
    id: z.string(),
    text: z.string().min(1, "O texto da pergunta é obrigatório."),
    photoRequirement: z.enum(["always", "if_not_ok", "never"]),
});

const templateSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "O título do modelo é obrigatório."),
    type: z.enum(["manutencao", "viagem", "retorno"]),
    category: z.enum(["cavalo_mecanico", "carreta", "caminhao_3_4", "moto"]),
    questions: z.array(questionSchema),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

export default function ChecklistTemplatePage() {
    const { toast } = useToast();
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateFormValues>(defaultChecklistTemplates[0]);

    const { control, register, handleSubmit, formState: { errors }, watch } = useForm<TemplateFormValues>({
        resolver: zodResolver(templateSchema),
        values: selectedTemplate, // Use values to sync form with state
        resetOptions: {
            keepDirtyValues: true,
        },
    });

    const { fields, append, remove, move } = useFieldArray({
        control,
        name: "questions",
    });
    
    const handleTemplateChange = (templateId: string) => {
      const template = defaultChecklistTemplates.find(t => t.id === templateId);
      if (template) {
        setSelectedTemplate(template);
      }
    };

    const onSubmit = (data: TemplateFormValues) => {
        console.log("Saving template:", JSON.stringify(data, null, 2));
        toast({
            title: "Modelo Salvo!",
            description: "O modelo de checklist foi salvo com sucesso.",
        });
    };

    const addQuestion = () => {
        append({ id: `q-${Date.now()}`, text: "", photoRequirement: "if_not_ok" });
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Modelos de Checklist"
                description="Crie e gerencie os modelos de checklist para toda a operação."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Seleção de Modelo</CardTitle>
                    <CardDescription>Selecione um modelo para visualizar ou editar. Você também pode criar um novo.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Select onValueChange={handleTemplateChange} defaultValue={selectedTemplate.id}>
                        <SelectTrigger className="max-w-md">
                            <SelectValue placeholder="Selecione um modelo..." />
                        </SelectTrigger>
                        <SelectContent>
                            {defaultChecklistTemplates.map(template => (
                                <SelectItem key={template.id} value={template.id}>
                                    {template.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>Editando Modelo: {watch("name")}</CardTitle>
                        <CardDescription>
                            Adicione, remova ou reordene as perguntas abaixo. As alterações serão refletidas nos novos checklists.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Nome do Modelo</Label>
                                <Input id="name" {...register("name")} />
                                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="type">Tipo</Label>
                                <Controller
                                    name="type"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="manutencao">Manutenção</SelectItem>
                                                <SelectItem value="viagem">Viagem</SelectItem>
                                                <SelectItem value="retorno">Retorno</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="category">Categoria</Label>
                                <Controller
                                    name="category"
                                    control={control}
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger id="category"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cavalo_mecanico">Cavalo Mecânico</SelectItem>
                                                <SelectItem value="carreta">Carreta</SelectItem>
                                                <SelectItem value="caminhao_3_4">Caminhão 3/4</SelectItem>
                                                <SelectItem value="moto">Moto</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </div>
                        </div>

                        <div className="border rounded-lg p-4 space-y-4">
                            <h3 className="font-semibold">Perguntas do Checklist</h3>
                            {fields.map((field, index) => (
                                <div key={field.id} className="flex items-center gap-2 p-2 rounded-md border bg-muted/50">
                                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                                    <span className="font-semibold">{index + 1}.</span>
                                    <Input
                                        placeholder="Digite a pergunta"
                                        {...register(`questions.${index}.text`)}
                                        className="flex-1"
                                    />
                                    <Controller
                                      name={`questions.${index}.photoRequirement`}
                                      control={control}
                                      render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger className="w-[240px]">
                                                <SelectValue placeholder="Regra da foto" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="if_not_ok">Foto se "Não OK"</SelectItem>
                                                <SelectItem value="always">Foto sempre obrigatória</SelectItem>
                                                <SelectItem value="never">Foto nunca obrigatória</SelectItem>
                                            </SelectContent>
                                        </Select>
                                      )}
                                    />
                                    <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                    {errors.questions?.[index]?.text && <p className="text-sm text-destructive -ml-2">{errors.questions?.[index]?.text?.message}</p>}
                                </div>
                            ))}
                            <Button type="button" variant="outline" onClick={addQuestion}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Adicionar Pergunta
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4 flex justify-between">
                       <Button type="submit">Salvar Modelo</Button>
                       <Button type="button" variant="secondary">Clonar Modelo</Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
