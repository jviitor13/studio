
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Camera, Check, RefreshCw, Loader2, VideoOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadImageAndGetURLClient } from '@/lib/storage';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { cn } from '@/lib/utils';
import { compressImage } from '@/lib/image-compressor';

interface SelfieCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  cameraType?: 'user' | 'environment';
}

export const SelfieCapture: React.FC<SelfieCaptureProps> = ({ onCapture, cameraType = 'user' }) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<'idle' | 'streaming' | 'captured' | 'uploading' | 'confirmed'>('idle');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleActivateCamera = () => {
    startCamera();
  };

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

      setCapturedImage(compressedDataUrl);
      setMode('captured');
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Erro ao processar imagem' });
      setMode('streaming'); // Go back to streaming on error
    }
  }, [mode, toast, stopCamera]);


  const handleRetake = () => {
    setCapturedImage(null);
    onCapture('');
    setMode('idle');
  };

  const handleConfirm = async () => {
    if (!capturedImage) return;

    setMode('uploading');
    toast({ title: 'Enviando imagem...', description: 'Aguarde, estamos salvando sua foto.' });
    
    try {
      const filename = `img-${Date.now()}`;
      const path = `uploads/${filename}`;
      const downloadURL = await uploadImageAndGetURLClient(capturedImage, path, filename);
      onCapture(downloadURL);
      setMode('confirmed');
       toast({ title: 'Sucesso!', description: 'Imagem enviada e confirmada.' });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ variant: 'destructive', title: 'Erro de Upload', description: 'Não foi possível enviar a imagem.' });
      setMode('captured');
    }
  };
  
  const isBusy = mode === 'uploading';

  const renderButtons = () => {
    switch(mode) {
        case 'idle':
            return (
                <Button type="button" onClick={handleActivateCamera} disabled={isBusy}>
                    <Camera className="mr-2 h-4 w-4" />
                    Ativar Câmera
                </Button>
            );
        case 'streaming':
            return (
                <Button type="button" onClick={handleTakePhoto} disabled={isBusy}>
                    <Camera className="mr-2 h-4 w-4" />
                    {isBusy ? 'Aguarde...' : 'Capturar Foto'}
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
        case 'uploading':
            return (
                <Button type="button" disabled>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                </Button>
            );
        case 'confirmed':
            return (
                <Button type="button" className="bg-green-600 hover:bg-green-700" disabled>
                    <Check className="mr-2 h-4 w-4" />
                    Confirmada
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

        {(mode === 'captured' || mode === 'confirmed' || mode === 'uploading') && capturedImage && (
          <Image src={capturedImage} alt="Foto capturada" layout="fill" className="object-cover" />
        )}
        
        {mode === 'uploading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
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
