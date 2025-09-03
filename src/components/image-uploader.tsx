
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Camera, Check, RefreshCw, Loader2, VideoOff, UploadCloud, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadImageAndGetURLClient } from '@/lib/storage';
import { compressImage } from '@/lib/image-compressor';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onCapture: (imageDataUrl: string) => void;
  cameraType?: 'user' | 'environment';
  initialImage?: string | null;
  allowGallery?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onCapture, cameraType = 'user', initialImage = null, allowGallery = false }) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'idle' | 'streaming' | 'captured' | 'uploading' | 'confirmed'>('idle');
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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: cameraType },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => {
            console.error("Video play error:", e);
            setError("Não foi possível iniciar o vídeo da câmera.");
        });
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
    if (mode === 'streaming') {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [mode, startCamera, stopCamera]);

  const handleActivateCamera = () => setMode('streaming');

  const processAndSetImage = useCallback(async (file: File) => {
    setMode('uploading'); // Visual feedback for processing/uploading
    try {
        const compressedDataUrl = await compressImage(file);
        setImageSrc(compressedDataUrl);

        toast({ title: 'Enviando imagem...', description: 'Aguarde, estamos salvando sua foto.' });
        const filename = `img-${Date.now()}`;
        const path = `uploads/${filename}`;
        const downloadURL = await uploadImageAndGetURLClient(compressedDataUrl, path, filename);
        
        onCapture(downloadURL);
        setMode('confirmed');
        toast({ title: 'Sucesso!', description: 'Imagem enviada e confirmada.' });

    } catch (err) {
        console.error(err);
        toast({ variant: 'destructive', title: 'Erro ao Processar Imagem' });
        setMode('idle');
    }
  }, [onCapture, toast]);

  const handleTakePhoto = useCallback(async () => {
    if (mode !== 'streaming' || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    
    const rawDataUrl = canvas.toDataURL('image/png');
    const blob = await fetch(rawDataUrl).then(res => res.blob());
    const file = new File([blob], 'capture.png', { type: 'image/png' });
    
    await processAndSetImage(file);
    stopCamera();

  }, [mode, processAndSetImage, stopCamera]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
          const file = event.target.files[0];
          await processAndSetImage(file);
      }
  };

  const handleReset = () => {
    setImageSrc(null);
    onCapture('');
    setMode('idle');
  };
  
  const isBusy = mode === 'uploading' || (mode === 'streaming' && !videoRef.current?.srcObject);

  return (
    <div className="w-full space-y-2">
      <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted border flex items-center justify-center">
        {mode === 'idle' && (
           <div className="text-center p-2">
              <Camera className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Ative a câmera ou escolha da galeria.</p>
           </div>
        )}

        {mode === 'streaming' && <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />}

        {(mode === 'confirmed' || mode === 'uploading') && imageSrc && (
          <Image src={imageSrc} alt="Foto" layout="fill" className="object-cover" />
        )}
        
        {isBusy && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
            <p className="text-white ml-2">Processando...</p>
          </div>
        )}
        
        {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-background p-4">
                <Alert variant="destructive">
                    <VideoOff className="h-4 w-4" />
                    <AlertTitle>Erro de Câmera</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )}
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        {mode === 'idle' && (
          <>
            <Button type="button" onClick={handleActivateCamera} disabled={isBusy}>
              <Camera className="mr-2 h-4 w-4" />
              Ativar Câmera
            </Button>
            {allowGallery && (
                <>
                    <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                    <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isBusy}>
                        <UploadCloud className="mr-2 h-4 w-4" />
                        Escolher da Galeria
                    </Button>
                </>
            )}
          </>
        )}
        {mode === 'streaming' && (
          <Button type="button" onClick={handleTakePhoto} disabled={isBusy}>
            <Camera className="mr-2 h-4 w-4" />
            {isBusy ? 'Aguarde...' : 'Capturar Foto'}
          </Button>
        )}
         {(mode === 'uploading' || mode === 'confirmed') && (
            <Button type="button" variant="destructive" onClick={handleReset}>
              <Trash2 className="mr-2 h-4 w-4" />
              Remover Foto
            </Button>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
