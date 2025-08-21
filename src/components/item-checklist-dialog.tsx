
"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle } from "./ui/alert";
import { ImageUploader } from "./image-uploader";


// Match the form values type
interface ChecklistItemFormValues {
    id: string;
    text: string;
    photoRequirement: "always" | "if_not_ok" | "never";
    status: "OK" | "Não OK" | "N/A";
    photo?: string;
    observation?: string;
}

interface ItemChecklistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: ChecklistItemFormValues | null;
  onSave: (data: { status: "OK" | "Não OK", photo?: string, observation?: string }) => void;
  allowGallery?: boolean;
}

export function ItemChecklistDialog({ isOpen, onClose, item, onSave, allowGallery = false }: ItemChecklistDialogProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<"OK" | "Não OK" | "N/A">("N/A");
  const [observation, setObservation] = useState("");
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (item) {
      setStatus(item.status || "N/A");
      setObservation(item.observation || "");
      setPhoto(item.photo);
      setError(null);
    }
  }, [item]);

  if (!item) return null;
  
  const isPhotoRequired = 
    item.photoRequirement === 'always' || 
    (item.photoRequirement === 'if_not_ok' && status === 'Não OK');

  const handleSave = () => {
    if (status === 'N/A') {
      setError("Por favor, avalie o item como 'OK' ou 'Não OK'.");
      return;
    }
    if (isPhotoRequired && !photo) {
      setError("Este item requer uma imagem para continuar.");
      return;
    }
    setError(null);
    onSave({ status, photo, observation });
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{item.text}</DialogTitle>
          <DialogDescription>Avalie o item e adicione observações ou fotos, se necessário.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Avaliação</Label>
            <RadioGroup
              value={status}
              onValueChange={(value: "OK" | "Não OK") => {
                setStatus(value);
                const willRequirePhoto = item.photoRequirement === 'always' || (item.photoRequirement === 'if_not_ok' && value === 'Não OK');
                if (!willRequirePhoto) {
                    setError(null);
                }
                 if (value !== 'N/A') {
                    setError(null);
                }
              }}
              className="flex items-center gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="OK" id={`${item.id}-ok`} />
                <Label htmlFor={`${item.id}-ok`}>OK</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Não OK" id={`${item.id}-notok`} />
                <Label htmlFor={`${item.id}-notok`}>Não OK</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`obs-${item.id}`}>Observações (opcional)</Label>
            <Textarea 
              id={`obs-${item.id}`}
              placeholder="Descreva o que foi observado..." 
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>
              Anexar Foto {isPhotoRequired && <span className="text-destructive ml-1">*</span>}
            </Label>
            <ImageUploader 
                onCapture={(imageDataUrl) => {
                    setPhoto(imageDataUrl);
                     if (isPhotoRequired && imageDataUrl) {
                        setError(null);
                    }
                }}
                initialImage={photo}
                allowGallery={allowGallery}
            />
             {error && (
                <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>{error}</AlertTitle>
                </Alert>
            )}
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">Cancelar</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
