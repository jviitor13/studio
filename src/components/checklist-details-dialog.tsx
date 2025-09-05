
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { Badge } from "./ui/badge";
import { Paperclip, MessageSquare, ThumbsUp, ThumbsDown, FileQuestion, Download, Camera, PenSquare, Truck } from "lucide-react";
import { CompletedChecklist } from "@/lib/types";
import { format } from "date-fns";


interface ChecklistDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  checklist: CompletedChecklist | null;
  onExport?: (checklist: CompletedChecklist) => void;
}

const statusIcons: Record<string, React.ReactNode> = {
  "OK": <ThumbsUp className="h-5 w-5 text-green-600" />,
  "Não OK": <ThumbsDown className="h-5 w-5 text-destructive" />,
  "N/A": <FileQuestion className="h-5 w-5 text-muted-foreground" />,
};

const statusBadge: Record<string, "default" | "destructive" | "secondary"> = {
    'OK': 'default',
    'Pendente': 'destructive',
}

const statusBadgeColor : {[key:string]: string} = {
    'OK': 'bg-green-500 hover:bg-green-600',
    'Pendente': ''
}

const vehicleImageLabels: Record<string, string> = {
    cavaloFrontal: "Cavalo - Frontal",
    cavaloLateralDireita: "Cavalo - Lat. Direita",
    cavaloLateralEsquerda: "Cavalo - Lat. Esquerda",
    carretaFrontal: "Carreta - Frontal",
    carretaLateralDireita: "Carreta - Lat. Direita",
    carretaLateralEsquerda: "Carreta - Lat. Esquerda",
}

export function ChecklistDetailsDialog({ isOpen, onClose, checklist, onExport }: ChecklistDetailsDialogProps) {
  if (!checklist) return null;

  const formattedDate = checklist.createdAt ? format(new Date(checklist.createdAt), "dd/MM/yyyy 'às' HH:mm") : 'Data não disponível';

  const handleExportClick = () => {
    if(onExport && checklist) {
        onExport(checklist);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Checklist: {checklist.id}</DialogTitle>
          <DialogDescription>
            Visualização completa do checklist realizado em {formattedDate} por {checklist.driver}.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-4 text-sm my-4">
            <div className="flex flex-col gap-1">
                <span className="font-semibold">Veículo:</span>
                <span className="text-muted-foreground">{checklist.vehicle}</span>
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-semibold">Modelo:</span>
                <span className="text-muted-foreground">{checklist.name}</span>
            </div>
            <div className="flex flex-col gap-1">
                <span className="font-semibold">Status:</span>
                <Badge variant={statusBadge[checklist.status]} className={`w-fit ${statusBadgeColor[checklist.status]}`}>
                    {checklist.status === 'OK' ? 'Concluído' : 'Com Pendências'}
                </Badge>
            </div>
        </div>

        <ScrollArea className="h-[50vh] border rounded-md p-4">
          <div className="space-y-4">
            {checklist.questions.map((item) => (
              <div key={item.id} className="p-3 border rounded-lg bg-muted/30">
                <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">{item.text}</p>
                    <div className="flex items-center gap-2">
                        {statusIcons[item.status]}
                        <span className="font-semibold">{item.status}</span>
                    </div>
                </div>
                {item.observation && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground border-t pt-2 mt-2">
                        <MessageSquare className="h-4 w-4 mt-0.5 shrink-0" />
                        <p>{item.observation}</p>
                    </div>
                )}
                 {item.photo && (
                    <div className="mt-2 border-t pt-2">
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                           <Paperclip className="h-4 w-4" /> Anexo do Item
                        </p>
                        <div className="relative w-full max-w-xs aspect-video rounded-md overflow-hidden">
                            <Image src={item.photo} data-ai-hint="car checkup" alt={`Foto do item ${item.text}`} fill className="object-cover" />
                        </div>
                    </div>
                )}
              </div>
            ))}
             {checklist.questions.length === 0 && <p className="text-center text-muted-foreground">Nenhum item de checklist para exibir.</p>}

            {checklist.vehicleImages && Object.values(checklist.vehicleImages).some(img => img) && (
                 <div className="p-3 border rounded-lg bg-muted/30">
                    <p className="font-medium mb-4 flex items-center gap-2"><Truck className="h-5 w-5" /> Fotos Gerais do Veículo</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(checklist.vehicleImages).map(([key, url]) => (
                            url ? (
                                <div key={key}>
                                    <p className="text-xs font-semibold mb-1">{vehicleImageLabels[key] || key}</p>
                                    <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                                        <Image src={url} alt={vehicleImageLabels[key]} fill className="object-cover" />
                                    </div>
                                </div>
                            ) : null
                        ))}
                    </div>
                </div>
            )}


            {(checklist.signatures?.assinaturaResponsavel || checklist.signatures?.assinaturaMotorista) && (
                <div className="p-3 border rounded-lg bg-muted/30">
                    <p className="font-medium mb-4">Validação e Assinaturas</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Seção Responsável */}
                        <div className="space-y-4">
                           <h4 className="font-semibold text-center md:text-left">Responsável Técnico</h4>
                           <p className="text-sm text-center md:text-left text-muted-foreground -mt-3">{checklist.responsibleName}</p>
                            {checklist.signatures.selfieResponsavel && (
                                <div>
                                    <p className="text-sm font-medium flex items-center gap-2"><Camera className="h-4 w-4" /> Selfie</p>
                                    <Image src={checklist.signatures.selfieResponsavel} alt="selfie" width={160} height={120} className="rounded-md border bg-white object-cover mt-1" />
                                </div>
                            )}
                            {checklist.signatures.assinaturaResponsavel && (
                                <div>
                                    <p className="text-sm font-medium flex items-center gap-2"><PenSquare className="h-4 w-4" /> Assinatura</p>
                                    <img src={checklist.signatures.assinaturaResponsavel} alt="assinatura" className="rounded-md border bg-white h-24 mt-1" />
                                </div>
                            )}
                        </div>
                        {/* Seção Motorista */}
                        <div className="space-y-4">
                           <h4 className="font-semibold text-center md:text-left">Motorista</h4>
                            <p className="text-sm text-center md:text-left text-muted-foreground -mt-3">{checklist.driver}</p>
                            {checklist.signatures.selfieMotorista && (
                                <div>
                                    <p className="text-sm font-medium flex items-center gap-2"><Camera className="h-4 w-4" /> Selfie</p>
                                    <Image src={checklist.signatures.selfieMotorista} alt="selfie" width={160} height={120} className="rounded-md border bg-white object-cover mt-1" />
                                </div>
                            )}
                            {checklist.signatures.assinaturaMotorista && (
                                <div>
                                    <p className="text-sm font-medium flex items-center gap-2"><PenSquare className="h-4 w-4" /> Assinatura</p>
                                    <img src={checklist.signatures.assinaturaMotorista} alt="assinatura" className="rounded-md border bg-white h-24 mt-1" />
                                </div>
                            )}
                        </div>
                     </div>
                </div>
            )}
          </div>
        </ScrollArea>
        <div className="flex justify-end gap-2 mt-4">
            {onExport && (
                 <Button type="button" variant="secondary" onClick={handleExportClick}>
                    <Download className="mr-2 h-4 w-4" />
                    Gerar PDF
                </Button>
            )}
            <DialogClose asChild>
                <Button type="button">Fechar</Button>
            </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
