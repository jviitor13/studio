"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UploadCloud, Loader2 } from "lucide-react";
import Image from 'next/image';
import { handleDamageAssessment } from "@/lib/actions";
import { DamageAssessmentDialog } from "@/components/damage-assessment-dialog";

const checklistSchema = z.object({
  vehicleId: z.string().min(1, "Selecione um veículo"),
  cnhOk: z.boolean().refine(val => val === true, "CNH deve estar válida"),
  epiOk: z.boolean().refine(val => val === true, "EPI deve estar completo"),
  attentionTest: z.string().min(1, "Selecione uma opção"),
  phoneCharged: z.string().min(1, "Selecione uma opção"),
  tachoOk: z.string().min(1, "Selecione uma opção"),
  initialKm: z.coerce.number().min(1, "Quilometragem inicial é obrigatória"),
  observations: z.string().optional(),
});

type ChecklistFormValues = z.infer<typeof checklistSchema>;

export default function PreTripChecklistPage() {
  const { toast } = useToast();
  const [vehicleImages, setVehicleImages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [damageInfo, setDamageInfo] = useState("");
  
  const { control, handleSubmit, formState: { errors } } = useForm<ChecklistFormValues>({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      cnhOk: false,
      epiOk: false,
      observations: "",
    }
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
            vehicleId: "RDO2C24" // Placeholder
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

  const onSubmit = (data: ChecklistFormValues) => {
    if(vehicleImages.length === 0) {
        toast({ variant: "destructive", title: "Erro", description: "É obrigatório o envio de pelo menos uma foto do veículo." });
        return;
    }
    console.log(data);
    toast({ title: "Checklist Enviado!", description: "Seu checklist de viagem foi enviado com sucesso." });
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
              <CardTitle>Informações do Veículo</CardTitle>
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
                          render={({ field }) => <Input id="initialKm" type="number" {...field} />}
                      />
                      {errors.initialKm && <p className="text-sm text-destructive">{errors.initialKm.message}</p>}
                  </div>
                </div>
                <div className="grid gap-2">
                    <Label>Fotos do Veículo (Frente, Traseira, Laterais)</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {vehicleImages.map((src, index) => (
                            <div key={index} className="relative aspect-video rounded-md overflow-hidden" data-ai-hint="car truck">
                                <Image src={src} alt={`Veículo ${index + 1}`} fill className="object-cover" />
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
                                <Input id="photo-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleImageUpload} disabled={isProcessing} />
                            </Label>
                        )}
                    </div>
                     {vehicleImages.length === 0 && <p className="text-sm text-destructive">Envio de foto é obrigatório</p>}
                </div>
            </CardContent>
          </Card>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Verificações do Motorista</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="flex items-center space-x-2">
                <Controller name="cnhOk" control={control} render={({ field }) => <Checkbox id="cnhOk" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="cnhOk">CNH está válida e comigo?</Label>
              </div>
              {errors.cnhOk && <p className="text-sm text-destructive -mt-4">{errors.cnhOk.message}</p>}

              <div className="flex items-center space-x-2">
                <Controller name="epiOk" control={control} render={({ field }) => <Checkbox id="epiOk" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="epiOk">Estou com meu EPI completo?</Label>
              </div>
              {errors.epiOk && <p className="text-sm text-destructive -mt-4">{errors.epiOk.message}</p>}

              <div className="grid gap-2">
                <Label>Realizei o teste de atenção?</Label>
                <Controller name="attentionTest" control={control} render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="sim" id="at-sim" /><Label htmlFor="at-sim">Sim</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="nao" id="at-nao" /><Label htmlFor="at-nao">Não</Label></div>
                    </RadioGroup>
                )} />
                {errors.attentionTest && <p className="text-sm text-destructive">{errors.attentionTest.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label>Celular carregado e com créditos?</Label>
                <Controller name="phoneCharged" control={control} render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="sim" id="pc-sim" /><Label htmlFor="pc-sim">Sim</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="nao" id="pc-nao" /><Label htmlFor="pc-nao">Não</Label></div>
                    </RadioGroup>
                )} />
                {errors.phoneCharged && <p className="text-sm text-destructive">{errors.phoneCharged.message}</p>}
              </div>

               <div className="grid gap-2">
                <Label>Tacógrafo funcionando corretamente?</Label>
                <Controller name="tachoOk" control={control} render={({ field }) => (
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="sim" id="to-sim" /><Label htmlFor="to-sim">Sim</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="nao" id="to-nao" /><Label htmlFor="to-nao">Não</Label></div>
                    </RadioGroup>
                )} />
                 {errors.tachoOk && <p className="text-sm text-destructive">{errors.tachoOk.message}</p>}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="observacoes">Observações</Label>
                 <Controller name="observations" control={control} render={({ field }) => (
                    <Textarea id="observacoes" placeholder="Alguma observação sobre o veículo ou a viagem?" {...field} />
                 )} />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button type="submit">Enviar Checklist</Button>
            </CardFooter>
          </Card>
        </form>
      </div>
    </>
  );
}
