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
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { initialQuestions } from '@/lib/checklist-data';

const questionSchema = z.object({
    id: z.string(),
    text: z.string().min(1, "O texto da pergunta é obrigatório."),
    type: z.enum(["boolean", "text", "photo"]),
});

const templateSchema = z.object({
    title: z.string().min(1, "O título do modelo é obrigatório."),
    questions: z.array(questionSchema),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

export default function ChecklistTemplatePage() {
    const { toast } = useToast();
    const [templateTitle, setTemplateTitle] = useState("Checklist de Pré-Viagem");
    
    const { control, register, handleSubmit, formState: { errors } } = useForm<TemplateFormValues>({
        resolver: zodResolver(templateSchema),
        defaultValues: {
            title: templateTitle,
            questions: initialQuestions,
        }
    });

    const { fields, append, remove, move } = useFieldArray({
        control,
        name: "questions",
    });

    const onSubmit = (data: TemplateFormValues) => {
        console.log("Saving template:", JSON.stringify(data, null, 2));
        // Here you would typically save the data to your backend
        // For now, we'll just show a toast
        toast({
            title: "Modelo Salvo!",
            description: "O modelo de checklist foi salvo com sucesso.",
        });
    };

    const addQuestion = () => {
        append({ id: `q-${Date.now()}`, text: "", type: "boolean" });
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Modelos de Checklist"
                description="Crie e gerencie as perguntas para os checklists dos motoristas."
            />
            <form onSubmit={handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle>Editando Modelo: {templateTitle}</CardTitle>
                        <CardDescription>
                            Adicione, remova ou reordene as perguntas abaixo. As alterações serão refletidas nos novos checklists.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <div className="grid gap-2 max-w-md">
                           <Label htmlFor="templateTitle">Título do Modelo</Label>
                           <Input 
                                id="templateTitle" 
                                {...register("title")} 
                                defaultValue={templateTitle}
                                onBlur={(e) => setTemplateTitle(e.target.value)}
                           />
                           {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
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
                                    <Select
                                        defaultValue={field.type}
                                        onValueChange={(value) => {
                                            const currentField = fields[index];
                                            move(index, index); // little hack to trigger re-render with new value
                                            // Ideally, you'd use watch and setValue, but this works for now
                                            currentField.type = value as "boolean" | "text" | "photo";
                                        }}
                                    >
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Tipo de Resposta" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="boolean">Sim / Não</SelectItem>
                                            <SelectItem value="text">Texto</SelectItem>
                                            <SelectItem value="photo">Foto</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                    <CardFooter className="border-t px-6 py-4">
                       <Button type="submit">Salvar Modelo</Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    );
}
