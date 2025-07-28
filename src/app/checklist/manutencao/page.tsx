
'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
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

const checklistSchema = z.object({
  templateId: z.string().min(1, 'Selecione um modelo de checklist.'),
  vehicleId: z.string().min(1, 'Selecione um veículo.'),
  responsibleName: z.string().min(1, 'O nome do responsável é obrigatório.'),
  driverName: z.string().min(1, 'O nome do motorista é obrigatório.'),
  mileage: z.coerce.number().min(1, 'A quilometragem é obrigatória.'),
  photo: z.string().min(1, 'A foto do item em manutenção é obrigatória.'),
  assinaturaResponsavel: z.string().min(1, 'A assinatura do responsável é obrigatória.'),
  assinaturaMotorista: z.string().min(1, 'A assinatura do motorista é obrigatória.'),
  maintenanceItem: z.string().min(1, "O item de manutenção é obrigatório"),
});

type ChecklistFormValues = z.infer<typeof checklistSchema>;

export default function MaintenanceChecklistPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ChecklistFormValues>({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      templateId: '',
      vehicleId: '',
      responsibleName: 'Pedro Mecânico',
      driverName: 'João Motorista',
      mileage: undefined,
      photo: '',
      assinaturaResponsavel: '',
      assinaturaMotorista: '',
      maintenanceItem: ''
    },
  });

  const watchedPhoto = watch('photo');
  const watchResponsibleName = watch("responsibleName");
  const watchDriverName = watch("driverName");

  const onSubmit = async (data: ChecklistFormValues) => {
    setIsSubmitting(true);
    try {
        const submissionData = {
            name: data.templateId, // Using templateId as the name for consistency
            vehicle: data.vehicleId,
            mileage: data.mileage,
            responsibleName: data.responsibleName,
            driver: data.driverName,
            createdAt: Timestamp.now(),
            status: "Pendente", // Maintenance checklists always start as pending
            type: "Manutenção",
            questions: [{
                id: 'maintenance-item',
                text: data.maintenanceItem,
                status: 'Não OK',
                photo: data.photo,
                observation: 'Item em manutenção.',
                photoRequirement: 'always'
            }],
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

  const handlePhotoCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressedImage = await compressImage(file, 0.8, 1024);
        setValue('photo', compressedImage, { shouldValidate: true, shouldDirty: true });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao processar a imagem.' });
      } finally {
        setIsCompressing(false);
      }
    }
  };

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
            <CardDescription>Preencha os dados principais do veículo e da manutenção.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label htmlFor="templateId">Modelo do Checklist</Label>
              <Controller
                name="templateId"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger id="templateId"><SelectValue placeholder="Selecione o modelo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manutenção Corretiva">Manutenção Corretiva</SelectItem>
                      <SelectItem value="Manutenção Emergencial">Manutenção Emergencial</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
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
              <Input id="responsibleName" {...(register('responsibleName'))} />
              {errors.responsibleName && <p className="text-sm text-destructive">{errors.responsibleName.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="driverName">Nome do Motorista</Label>
              <Input id="driverName" {...(register('driverName'))} />
              {errors.driverName && <p className="text-sm text-destructive">{errors.driverName.message}</p>}
            </div>
            <div className="grid gap-2 md:col-span-2">
                <Label htmlFor="mileage">Quilometragem Atual</Label>
                <Input id="mileage" type="number" {...register('mileage')} />
                {errors.mileage && <p className="text-sm text-destructive">{errors.mileage.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Item e Evidência</CardTitle>
                <CardDescription>Descreva o item em manutenção e anexe uma foto como evidência.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-2">
                    <Label htmlFor="maintenanceItem">Item em Manutenção</Label>
                    <Input id="maintenanceItem" placeholder="Ex: Pneu dianteiro direito, motor de arranque..." {...register('maintenanceItem')} />
                    {errors.maintenanceItem && <p className="text-sm text-destructive">{errors.maintenanceItem.message}</p>}
                </div>
                <div className="grid gap-2">
                    <Label>Foto do Item</Label>
                    {watchedPhoto ? (
                        <div className="relative w-full max-w-xs aspect-video rounded-md overflow-hidden">
                            <Image src={watchedPhoto} alt="Foto do item" layout="fill" className="object-cover" />
                            <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => setValue('photo', '')}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <Label htmlFor="photo-upload" className="flex flex-col items-center justify-center w-full max-w-xs h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                            <div className="flex flex-col items-center justify-center text-center">
                                {isCompressing ? <Loader2 className="h-8 w-8 text-primary animate-spin" /> : <Camera className="w-8 h-8 mb-2 text-gray-500" />}
                                <p className="text-sm text-gray-500">{isCompressing ? 'Processando...' : 'Tirar Foto'}</p>
                            </div>
                            <Input id="photo-upload" type="file" className="hidden" accept="image/*" capture="environment" onChange={handlePhotoCapture} disabled={isCompressing} />
                        </Label>
                    )}
                    {errors.photo && <p className="text-sm text-destructive">{errors.photo.message}</p>}
                </div>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assinaturas</CardTitle>
            <CardDescription>O responsável e o motorista devem assinar para validar.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-8">
            <div className="grid gap-2">
              <Label className="font-semibold">Assinatura do Responsável</Label>
              <SignaturePad onEnd={(signature) => setValue('assinaturaResponsavel', signature, { shouldValidate: true, shouldDirty: true })} />
              {errors.assinaturaResponsavel && <p className="text-sm text-destructive">{errors.assinaturaResponsavel.message}</p>}
              <p className="text-sm text-muted-foreground">Responsável: {watchResponsibleName || 'N/A'}</p>
            </div>
            <div className="grid gap-2">
              <Label className="font-semibold">Assinatura do Motorista</Label>
              <SignaturePad onEnd={(signature) => setValue('assinaturaMotorista', signature, { shouldValidate: true, shouldDirty: true })} />
              {errors.assinaturaMotorista && <p className="text-sm text-destructive">{errors.assinaturaMotorista.message}</p>}
              <p className="text-sm text-muted-foreground">Motorista: {watchDriverName || 'N/A'}</p>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Enviando...' : 'Finalizar e Abrir Ordem de Serviço'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
