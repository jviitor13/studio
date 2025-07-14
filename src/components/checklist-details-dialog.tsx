
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { Badge } from "./ui/badge";
import { Paperclip, MessageSquare, ThumbsUp, ThumbsDown, FileQuestion, Download } from "lucide-react";
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
      <DialogContent className="max-w-2xl">
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
                           <Paperclip className="h-4 w-4" /> Anexo
                        </p>
                        <div className="relative w-full max-w-xs aspect-video rounded-md overflow-hidden">
                            <Image src={item.photo} data-ai-hint="car checkup" alt={`Foto do item ${item.text}`} layout="fill" className="object-cover" />
                        </div>
                    </div>
                )}
              </div>
            ))}
             {checklist.questions.length === 0 && <p className="text-center text-muted-foreground">Nenhum item de checklist para exibir.</p>}
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
