
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
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Camera, Trash2, AlertTriangle, Paperclip } from "lucide-react";
import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { initialMaintenanceChecklist } from "@/lib/maintenance-checklist-data";
import { cn } from "@/lib/utils";

const itemSchema = z.object({
  id: z.string(),
  text: z.string(),
  status: z.enum(["OK", "Não OK", "N/A"]),
});

const sectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  items: z.array(itemSchema),
  observations: z.string().optional(),
  photo: z.string().optional(),
});

const checklistSchema = z.object({
  vehicleId: z.string().min(1, "Selecione um veículo"),
  responsibleName: z.string().min(1, "Nome do responsável é obrigatório"),
  mileage: z.coerce.number().min(1, "Quilometragem é obrigatória"),
  sections: z.array(sectionSchema),
});

type ChecklistFormValues = z.infer<typeof checklistSchema>;

export default function MaintenanceChecklistPage() {
  const { toast } = useToast();

  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm<ChecklistFormValues>({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      vehicleId: "",
      responsibleName: "Pedro Mecânico", // Mock, could come from auth
      mileage: 0,
      sections: initialMaintenanceChecklist,
    },
  });

  const { fields: sectionFields, update: updateSection } = useFieldArray({
    control,
    name: "sections",
  });

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    sectionIndex: number
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > 4 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "A imagem não pode ter mais que 4MB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const base64Image = reader.result as string;
        setValue(`sections.${sectionIndex}.photo`, base64Image, { shouldValidate: true });
      };
      e.target.value = "";
    }
  };

  const onSubmit = (data: ChecklistFormValues) => {
    console.log("Checklist de Manutenção enviado:", JSON.stringify(data, null, 2));

    const hasIssues = data.sections.some(section =>
      section.items.some(item => item.status === "Não OK")
    );

    if (hasIssues) {
      toast({
        variant: "destructive",
        title: "Atenção!",
        description: "Checklist salvo com pendências. Verifique os itens marcados como 'NÃO OK'.",
      });
    } else {
      toast({
        title: "Checklist de Manutenção Enviado!",
        description: "O checklist foi registrado com sucesso.",
      });
    }
  };

  return (
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
                render={({ field }) => <Input id="mileage" type="number" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />}
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
                    <Controller
                      name={`sections.${sectionIndex}.items`}
                      control={control}
                      render={({ field }) => (
                        <div className="space-y-4">
                          {field.value.map((item, itemIndex) => {
                            const currentStatus = watch(`sections.${sectionIndex}.items.${itemIndex}.status`);
                            return (
                              <div
                                key={item.id}
                                className={cn(
                                    "p-4 border rounded-lg transition-colors",
                                    currentStatus === "Não OK" ? "bg-destructive/10 border-destructive" : ""
                                )}
                              >
                                <Label className="font-medium flex justify-between items-center">
                                  <span>{item.text}</span>
                                  {currentStatus === "Não OK" && <AlertTriangle className="h-5 w-5 text-destructive" />}
                                </Label>
                                <Controller
                                  name={`sections.${sectionIndex}.items.${itemIndex}.status`}
                                  control={control}
                                  render={({ field: itemField }) => (
                                    <RadioGroup
                                      onValueChange={itemField.onChange}
                                      defaultValue={itemField.value}
                                      className="flex items-center gap-6 mt-2"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="OK" id={`${item.id}-ok`} />
                                        <Label htmlFor={`${item.id}-ok`}>OK</Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="Não OK" id={`${item.id}-notok`} />
                                        <Label htmlFor={`${item.id}-notok`}>Não OK</Label>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="N/A" id={`${item.id}-na`} />
                                        <Label htmlFor={`${item.id}-na`}>N/A</Label>
                                      </div>
                                    </RadioGroup>
                                  )}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    />
                    
                    <div className="grid gap-2">
                        <Label htmlFor={`obs-${section.id}`}>Observações</Label>
                        <Controller 
                            name={`sections.${sectionIndex}.observations`}
                            control={control}
                            render={({ field }) => (
                                <Textarea id={`obs-${section.id}`} placeholder={`Observações sobre ${section.title.toLowerCase()}...`} {...field} />
                            )}
                        />
                    </div>
                    
                    <div className="grid gap-2">
                        <Label>Anexar Foto</Label>
                        {watch(`sections.${sectionIndex}.photo`) ? (
                            <div className="relative w-full max-w-xs aspect-video rounded-md overflow-hidden">
                                <Image src={watch(`sections.${sectionIndex}.photo`)!} alt={`Foto da seção ${section.title}`} layout="fill" className="object-cover" />
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2 h-7 w-7"
                                    onClick={() => setValue(`sections.${sectionIndex}.photo`, undefined)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <Label htmlFor={`photo-${section.id}`} className="flex items-center gap-2 p-2 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80 w-fit">
                                <Paperclip className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Anexar arquivo</span>
                                <Input
                                    id={`photo-${section.id}`}
                                    type="file"
                                    className="hidden"
                                    accept="image/png, image/jpeg"
                                    onChange={(e) => handleImageUpload(e, sectionIndex)}
                                />
                            </Label>
                        )}
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
  );
}
