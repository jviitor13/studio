
"use client";

import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Paperclip, Trash2, Loader2 } from "lucide-react";
import Image from "next/image";
import { ChecklistItem as ChecklistItemData } from "@/lib/checklist-templates-data";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle } from "./ui/alert";
import { compressImage } from "@/lib/image-compressor";


interface ItemChecklistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: ChecklistItemData | null;
  onSave: (data: { status: "OK" | "Não OK", photo?: string, observation?: string }) => void;
}

export function ItemChecklistDialog({ isOpen, onClose, item, onSave }: ItemChecklistDialogProps) {
  const { toast } = useToast();
  const [status, setStatus] = useState<"OK" | "Não OK">("OK");
  const [observation, setObservation] = useState("");
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (item) {
      // Don't pre-set status to N/A, force user to choose OK or Not OK
      setStatus(item.status === "Não OK" ? "Não OK" : "OK");
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
    if (isPhotoRequired && !photo) {
      setError("Este item requer imagem para continuar.");
      return;
    }
    setError(null);
    onSave({ status, photo, observation });
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setIsCompressing(true);
      try {
        const compressedImage = await compressImage(file);
        setPhoto(compressedImage);
        if (isPhotoRequired) {
            setError(null);
        }
      } catch (err) {
        console.error("Image compression error:", err);
        toast({
          variant: "destructive",
          title: "Erro ao comprimir imagem",
          description: "Não foi possível processar a imagem. Tente novamente.",
        });
      } finally {
        setIsCompressing(false);
      }
      e.target.value = "";
    }
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
            {photo ? (
              <div className="relative w-full max-w-xs aspect-video rounded-md overflow-hidden">
                  <Image src={photo} alt={`Foto do item ${item.text}`} layout="fill" className="object-cover" />
                  <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-7 w-7"
                      onClick={() => setPhoto(undefined)}
                      disabled={isCompressing}
                  >
                      <Trash2 className="h-4 w-4" />
                  </Button>
              </div>
            ) : (
                <>
                <Input
                    id={`photo-${item.id}`}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                    ref={photoInputRef}
                    disabled={isCompressing}
                />
                <Button variant="outline" onClick={() => photoInputref.current?.click()} disabled={isCompressing}>
                    {isCompressing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Paperclip className="mr-2 h-4 w-4" />
                    )}
                    {isCompressing ? 'Processando...' : 'Anexar arquivo'}
                </Button>
                </>
            )}
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
          <Button type="button" onClick={handleSave} disabled={isCompressing}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    