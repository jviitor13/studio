
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Camera, Check, RefreshCw, Loader2, VideoOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/image-compressor';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface SelfieCaptureProps {
  onCapture: (imageDataUrl: string) => void;
  cameraType?: 'user' | 'environment';
}

export const SelfieCapture: React.FC<SelfieCaptureProps> = ({ onCapture, cameraType = 'user' }) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isActive, setIsActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
  }, []);
  
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const startCamera = async () => {
    setError(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraType } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsActive(true);
      } catch (err) {
        console.error("Camera access error:", err);
        setError("Não foi possível acessar a câmera. Verifique as permissões do navegador.");
        toast({
          variant: "destructive",
          title: "Acesso à Câmera Negado",
          description: "Por favor, habilite a permissão da câmera nas configurações do seu navegador e tente novamente.",
        });
        setIsActive(false);
      }
    } else {
      setError("Seu navegador não suporta acesso à câmera.");
      setIsActive(false);
    }
  };

  const handleCaptureClick = () => {
    if (capturedImage) return;
    
    if (isActive && videoRef.current && canvasRef.current) {
      setIsProcessing(true);
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        
        const rawDataUrl = canvas.toDataURL('image/png');
        fetch(rawDataUrl)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], 'capture.png', { type: 'image/png' });
            return compressImage(file, 0.8, 800);
          })
          .then(compressedDataUrl => {
            setCapturedImage(compressedDataUrl);
            stopCamera();
          })
          .catch(err => {
            console.error(err);
            toast({ variant: 'destructive', title: 'Erro ao processar imagem' });
            stopCamera();
          })
          .finally(() => setIsProcessing(false));
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    onCapture('');
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  if (!isActive && !capturedImage) {
    return (
        <div className="w-full space-y-2">
            <div className="w-full aspect-video rounded-md overflow-hidden bg-muted border flex flex-col items-center justify-center">
                 {error ? (
                    <>
                        <VideoOff className="h-10 w-10 text-destructive mb-2" />
                        <p className="text-sm font-semibold text-destructive">{error}</p>
                    </>
                ) : (
                    <>
                        <Camera className="h-10 w-10 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground mt-2">Câmera pronta</p>
                    </>
                )}
            </div>
            <div className="flex gap-2 justify-center">
                <Button type="button" onClick={startCamera} disabled={isProcessing}>
                    <Camera className="mr-2 h-4 w-4" />
                    Ativar Câmera
                </Button>
            </div>
        </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted border">
        <video
          ref={videoRef}
          className={cn("w-full h-full object-cover", capturedImage || !isActive ? "hidden" : "block")}
          autoPlay
          playsInline
          muted
        />
        {capturedImage && (
            <Image src={capturedImage} alt="Foto capturada" layout="fill" className="object-cover" />
        )}
        {isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        {!capturedImage ? (
          <Button type="button" onClick={handleCaptureClick} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
            {isProcessing ? 'Processando...' : 'Capturar Foto'}
          </Button>
        ) : (
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
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
