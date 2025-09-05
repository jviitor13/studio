
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Camera, Check, RefreshCw, Loader2, VideoOff, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { compressImage } from '@/lib/image-compressor';

interface SelfieCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  cameraType?: 'user' | 'environment';
  initialImage?: string | null;
}

export const SelfieCapture: React.FC<SelfieCaptureProps> = ({ onCapture, cameraType = 'user', initialImage = null }) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<'idle' | 'streaming' | 'captured' | 'confirmed'>('idle');
  const [imageSrc, setImageSrc] = useState<string | null>(initialImage);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialImage) {
        setMode('confirmed');
        setImageSrc(initialImage);
    }
  }, [initialImage]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setMode('streaming');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraType },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access error:", err);
      const errorMessage = "Não foi possível acessar a câmera. Verifique as permissões.";
      setError(errorMessage);
      toast({ variant: "destructive", title: "Acesso à Câmera Negado", description: errorMessage });
      setMode('idle');
    }
  }, [cameraType, toast]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleTakePhoto = useCallback(async () => {
    if (mode !== 'streaming' || !videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    stopCamera();
    
    try {
      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const blob = await fetch(rawDataUrl).then(res => res.blob());
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      
      const compressedDataUrl = await compressImage(file);

      setImageSrc(compressedDataUrl);
      setMode('captured');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Erro ao processar imagem' });
      setMode('streaming');
    }
  }, [mode, toast, stopCamera]);

  const handleRetake = () => {
    setImageSrc(null);
    onCapture('');
    setMode('idle');
  };

  const handleConfirm = async () => {
    if (!imageSrc) return;
    onCapture(imageSrc);
    setMode('confirmed');
    toast({ title: 'Sucesso!', description: 'Imagem confirmada.' });
  };
  
  const handleRemove = () => {
    setImageSrc(null);
    onCapture('');
    setMode('idle');
  };

  const renderButtons = () => {
    switch(mode) {
        case 'idle':
            return (
                <Button type="button" onClick={startCamera}>
                    <Camera className="mr-2 h-4 w-4" />
                    Ativar Câmera
                </Button>
            );
        case 'streaming':
            return (
                <Button type="button" onClick={handleTakePhoto}>
                    <Camera className="mr-2 h-4 w-4" />
                    Capturar Foto
                </Button>
            );
        case 'captured':
             return (
                <>
                    <Button type="button" variant="outline" onClick={handleRetake}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Tirar Novamente
                    </Button>
                    <Button type="button" onClick={handleConfirm}>
                        <Check className="mr-2 h-4 w-4" />
                        Confirmar Foto
                    </Button>
                </>
            );
        case 'confirmed':
            return (
                <Button type="button" variant="destructive" onClick={handleRemove}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remover Foto
                </Button>
            );
        default:
            return null;
    }
  }

  return (
    <div className="w-full space-y-2">
      <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted border flex items-center justify-center">
        {mode === 'idle' && (
           <div className="text-center p-2">
              <Camera className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Clique para ativar a câmera</p>
           </div>
        )}

        {mode === 'streaming' && <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />}

        {(mode === 'captured' || mode === 'confirmed') && imageSrc && (
          <Image src={imageSrc} alt="Foto capturada" fill className="object-cover" />
        )}
        
        {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background p-4">
                <Alert variant="destructive">
                    <VideoOff className="h-4 w-4" />
                    <AlertTitle>Erro de Câmera</AlertTitle>
                    <AlertDescription>
                        {error}
                    </AlertDescription>
                </Alert>
            </div>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        {renderButtons()}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
