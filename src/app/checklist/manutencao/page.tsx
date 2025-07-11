"use client";

import { useState } from "react";
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
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, CheckCircle, FileQuestion, MessageSquare, Paperclip, ThumbsDown, ThumbsUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { initialMaintenanceChecklist, ChecklistItem as ItemData } from "@/lib/maintenance-checklist-data";
import { ItemChecklistDialog } from "@/components/item-checklist-dialog";
import { Textarea } from "@/components/ui/textarea";

const itemSchema = z.object({
  id: z.string(),
  text: z.string(),
  status: z.enum(["OK", "Não OK", "N/A"]),
  photo: z.string().optional(),
  observation: z.string().optional(),
});

const sectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  items: z.array(itemSchema),
  observations: z.string().optional(),
});

const checklistSchema = z.object({
  vehicleId: z.string().min(1, "Selecione um veículo"),
  responsibleName: z.string().min(1, "Nome do responsável é obrigatório"),
  mileage: z.coerce.number().min(1, "Quilometragem é obrigatória"),
  sections: z.array(sectionSchema),
});

type ChecklistFormValues = z.infer<typeof checklistSchema>;

const statusIcons = {
  "OK": <ThumbsUp className="h-5 w-5 text-green-600" />,
  "Não OK": <ThumbsDown className="h-5 w-5 text-destructive" />,
  "N/A": <FileQuestion className="h-5 w-5 text-muted-foreground" />,
};

export default function MaintenanceChecklistPage() {
  const { toast } = useToast();
  const [selectedItem, setSelectedItem] = useState<{ sectionIndex: number; itemIndex: number; item: ItemData } | null>(null);

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<ChecklistFormValues>({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      vehicleId: "",
      responsibleName: "Pedro Mecânico", // Mock, could come from auth
      mileage: undefined,
      sections: initialMaintenanceChecklist,
    },
    mode: 'onChange' 
  });

  const { fields: sectionFields } = useFieldArray({
    control,
    name: "sections",
  });

  const handleOpenDialog = (sectionIndex: number, itemIndex: number, item: any) => {
    setSelectedItem({ sectionIndex, itemIndex, item: watch(`sections.${sectionIndex}.items.${itemIndex}`) as any });
  };
  
  const handleDialogSave = (data: { status: "OK" | "Não OK" | "N/A"; photo?: string; observation?: string }) => {
    if (selectedItem) {
      const { sectionIndex, itemIndex } = selectedItem;
      setValue(`sections.${sectionIndex}.items.${itemIndex}.status`, data.status, { shouldValidate: true });
      setValue(`sections.${sectionIndex}.items.${itemIndex}.photo`, data.photo, { shouldValidate: true });
      setValue(`sections.${sectionIndex}.items.${itemIndex}.observation`, data.observation, { shouldValidate: true });
      setSelectedItem(null);
    }
  };

  const onSubmit = (data: ChecklistFormValues) => {
    console.log("Checklist de Manutenção enviado:", JSON.stringify(data, null, 2));

    const hasIssues = data.sections.some(section =>
      section.items.some(item => item.status === "Não OK")
    );
    
    toast({
        title: "Checklist Enviado com Sucesso!",
        description: hasIssues 
            ? "O checklist foi registrado com pendências para acompanhamento."
            : "O checklist foi registrado sem pendências.",
    });
  };

  return (
    <>
      <ItemChecklistDialog
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        item={selectedItem?.item as any}
        onSave={handleDialogSave}
      />
      <div className="mx-auto grid w-full max-w-4xl gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold font-headline">
            Checklist de Inspeção do Veículo
          </h1>
          <p className="text-muted-foreground">
            Realize a inspeção completa do veículo, preenchendo todas as seções.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>Informações Gerais</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-6">
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

          <Accordion type="multiple" className="w-full space-y-4 mt-6" defaultValue={initialMaintenanceChecklist.map(s => s.id)}>
            {sectionFields.map((section, sectionIndex) => (
                <Card key={section.id}>
                  <AccordionItem value={section.id} className="border-b-0">
                    <AccordionTrigger className="p-6 text-lg font-semibold hover:no-underline">
                      {section.title}
                    </AccordionTrigger>
                    <AccordionContent className="p-6 pt-0">
                      <div className="space-y-6">
                          <div className="space-y-2">
                            {section.items.map((item, itemIndex) => {
                              const currentItemState = watch(`sections.${sectionIndex}.items.${itemIndex}`);
                              const isCompleted = currentItemState.status !== "N/A";
                              
                              return (
                                <button
                                  type="button"
                                  key={item.id}
                                  onClick={() => handleOpenDialog(sectionIndex, itemIndex, item)}
                                  className="w-full text-left p-4 border rounded-lg transition-colors flex justify-between items-center hover:bg-muted/50"
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
                              );
                            })}
                          </div>
                        
                        <div className="grid gap-2">
                            <Label htmlFor={`obs-${section.id}`}>Observações Gerais da Seção</Label>
                            <Controller 
                                name={`sections.${sectionIndex}.observations`}
                                control={control}
                                render={({ field }) => (
                                    <Textarea id={`obs-${section.id}`} placeholder={`Observações sobre ${section.title.toLowerCase()}...`} {...field} value={field.value ?? ''} />
                                )}
                            />
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Card>
              ))}
          </Accordion>

          <Card className="mt-6">
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit" size="lg">Finalizar Checklist</Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </>
  );
}
