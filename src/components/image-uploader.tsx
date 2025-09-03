
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Camera, RefreshCw, Loader2, VideoOff, UploadCloud, Trash2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { uploadImageAndGetURLClient } from '@/lib/storage';
import { compressImage } from '@/lib/image-compressor';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

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
    setMode('streaming');
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
    return () => {
      stopCamera();
    };
  }, [stopCamera]);
  
  const handleTakePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    if (!context) return;
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    stopCamera();
    
    const rawDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    const blob = await fetch(rawDataUrl).then(res => res.blob());
    const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
    
    const compressedDataUrl = await compressImage(file);
    setImageSrc(compressedDataUrl);
    setMode('captured');
  }, [stopCamera]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files[0]) {
          const file = event.target.files[0];
          const compressedDataUrl = await compressImage(file);
          setImageSrc(compressedDataUrl);
          setMode('captured');
      }
  };

  const handleConfirm = async () => {
    if (!imageSrc) return;
    
    setMode('uploading');
    toast({ title: 'Enviando imagem...', description: 'Aguarde, estamos salvando sua foto.' });
    
    try {
      const filename = `img-${Date.now()}`;
      const path = `uploads/${filename}`;
      const downloadURL = await uploadImageAndGetURLClient(imageSrc, path, filename);
      
      onCapture(downloadURL);
      setMode('confirmed');
      toast({ title: 'Sucesso!', description: 'Imagem enviada e confirmada.' });

    } catch (err) {
        console.error(err);
        toast({ variant: 'destructive', title: 'Erro ao Enviar Imagem' });
        setMode('captured');
    }
  };
  
  const handleRetake = () => {
    setImageSrc(null);
    onCapture('');
    setError(null);
    setMode('idle');
  };
  
  const isBusy = mode === 'uploading';

  const renderContent = () => {
    switch (mode) {
      case 'streaming':
        return <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />;
      case 'captured':
      case 'uploading':
      case 'confirmed':
        return imageSrc ? <Image src={imageSrc} alt="Foto" layout="fill" className="object-cover" /> : null;
      default:
        return (
          <div className="text-center p-2">
            <Camera className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="text-sm text-muted-foreground mt-2">Ative a câmera ou escolha da galeria.</p>
          </div>
        );
    }
  }

  const renderButtons = () => {
    switch(mode) {
        case 'idle':
            return (
                <>
                    <Button type="button" onClick={startCamera} disabled={isBusy}>
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
                <Button type="button" variant="destructive" onClick={handleRetake}>
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
        {renderContent()}
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
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            </div>
        )}
      </div>

      <div className="flex gap-2 justify-center flex-wrap">
        {renderButtons()}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
