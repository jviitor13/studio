
"use client";

import { useState, useEffect } from 'react';
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
import { PlusCircle, Trash2, GripVertical, CheckCircle } from "lucide-react";
import { useFieldArray, useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { ChecklistTemplate } from '@/lib/checklist-templates-data';
import { Skeleton } from '@/components/ui/skeleton';
import { 
    AlertDialog, 
    AlertDialogAction, 
    AlertDialogContent, 
    AlertDialogDescription, 
    AlertDialogFooter, 
    AlertDialogHeader, 
    AlertDialogTitle
} from '@/components/ui/alert-dialog';


const questionSchema = z.object({
    id: z.string(),
    text: z.string().min(1, "O texto da pergunta é obrigatório."),
    photoRequirement: z.enum(["always", "if_not_ok", "never"]),
});

const templateSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "O título do modelo é obrigatório."),
    type: z.enum(["Manutenção", "viagem", "retorno"]),
    category: z.enum(["cavalo_mecanico", "carreta", "caminhao_3_4", "moto"]),
    questions: z.array(questionSchema),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

export default function ChecklistTemplatePage() {
    const { toast } = useToast();
    const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTemplate, setSelectedTemplate] = useState<ChecklistTemplate | null>(null);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [isEditingNew, setIsEditingNew] = useState(false);


    const { control, register, handleSubmit, formState: { errors }, watch, reset, setValue } = useForm<TemplateFormValues>({
        resolver: zodResolver(templateSchema),
        defaultValues: {
          name: "",
          type: "Manutenção",
          category: "cavalo_mecanico",
          questions: [],
        },
    });

    useEffect(() => {
        setIsLoading(true);
        const unsubscribe = onSnapshot(collection(db, 'checklist-templates'), (snapshot) => {
            const templatesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChecklistTemplate));
            setTemplates(templatesData);
            setIsLoading(false);
        }, (error) => {
            console.error("Firebase snapshot error:", error);
            toast({
                variant: "destructive",
                title: "Erro ao Carregar Modelos",
                description: "Não foi possível buscar os dados do Firestore. Verifique suas credenciais do Firebase.",
            });
            setIsLoading(false);
        });
        return () => unsubscribe();
    }, [toast]);
    
    useEffect(() => {
        if (!isEditingNew) {
            reset(selectedTemplate ?? { name: "", type: "Manutenção", category: "cavalo_mecanico", questions: [] });
        }
    }, [selectedTemplate, reset, isEditingNew]);


    const { fields, append, remove, move } = useFieldArray({
        control,
        name: "questions",
    });
    
    const handleTemplateChange = (templateId: string) => {
      const template = templates.find(t => t.id === templateId);
      if (template) {
        setIsEditingNew(false);
        setSelectedTemplate(template);
      }
    };

    const handleNewTemplate = () => {
      setSelectedTemplate(null);
      setIsEditingNew(true);
      reset({
        name: "Novo Modelo",
        type: "Manutenção",
        category: "cavalo_mecanico",
        questions: [{ id: `q-${Date.now()}`, text: "Nova Pergunta", photoRequirement: "if_not_ok" }]
      })
    }
    
    const onSubmit = async (data: TemplateFormValues) => {
        try {
            const dataToSave = { ...data };
            delete dataToSave.id;

            if (selectedTemplate?.id && !isEditingNew) {
                const docRef = doc(db, 'checklist-templates', selectedTemplate.id);
                await setDoc(docRef, dataToSave, { merge: true });
                toast({
                    title: "Modelo Atualizado!",
                    description: "O modelo de checklist foi atualizado com sucesso.",
                });
            } else {
                const docRef = await addDoc(collection(db, 'checklist-templates'), dataToSave);
                const newTemplate = { ...data, id: docRef.id };
                setSelectedTemplate(newTemplate);
                setIsEditingNew(false);
                setShowSuccessDialog(true);
            }
        } catch (error) {
            console.error("Error saving template:", error);
            toast({
                variant: "destructive",
                title: "Erro ao Salvar",
                description: "Não foi possível salvar o modelo. Verifique as credenciais do Firebase e a conexão com a internet.",
            });
        }
    };
    
    const handleDeleteTemplate = async () => {
        if (!selectedTemplate?.id) return;
        try {
            await deleteDoc(doc(db, 'checklist-templates', selectedTemplate.id));
            toast({
                title: "Modelo Excluído",
                description: "O modelo foi excluído com sucesso.",
            });
            setSelectedTemplate(null);
            setIsEditingNew(false);
            reset();
        } catch (error) {
             toast({
                variant: "destructive",
                title: "Erro ao Excluir",
                description: "Não foi possível excluir o modelo.",
            });
        }
    }

    const addQuestion = () => {
        append({ id: `q-${Date.now()}`, text: "", photoRequirement: "if_not_ok" });
    };

    return (
        <>
            <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        Modelo Criado com Sucesso!
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Seu novo modelo foi salvo. Você pode continuar editando e adicionando perguntas.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>Continuar Editando</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>


            <div className="flex flex-col gap-6">
                <PageHeader
                    title="Modelos de Checklist"
                    description="Crie e gerencie os modelos de checklist para toda a operação."
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Seleção de Modelo</CardTitle>
                        <CardDescription>Selecione um modelo para editar, ou crie um novo.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex gap-4 items-center">
                        {isLoading ? (
                        <Skeleton className="h-10 w-full max-w-md" />
                        ) : (
                        <Select onValueChange={handleTemplateChange} value={selectedTemplate?.id ?? ""}>
                            <SelectTrigger className="max-w-md">
                                <SelectValue placeholder="Selecione um modelo..." />
                            </SelectTrigger>
                            <SelectContent>
                                {templates.map(template => (
                                    <SelectItem key={template.id} value={template.id}>
                                        {template.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        )}
                        <Button onClick={handleNewTemplate}>Novo Modelo</Button>
                    </CardContent>
                </Card>

                {(selectedTemplate || isEditingNew) && (
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Card>
                        <CardHeader>
                            <CardTitle>{isEditingNew ? "Criando Novo Modelo": `Editando: ${watch("name")}`}</CardTitle>
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
                                                    <SelectItem value="Manutenção">Manutenção</SelectItem>
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
                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
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
                            {selectedTemplate && (
                                <Button type="button" variant="destructive" onClick={handleDeleteTemplate}>Excluir Modelo</Button>
                            )}
                        </CardFooter>
                    </Card>
                </form>
                )}
            </div>
        </>
    );
}
