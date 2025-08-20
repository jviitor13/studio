
"use client";

import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Camera, Check, RefreshCw, AlertTriangle, VideoOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/image-compressor';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
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

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          variant: 'destructive',
          title: 'Câmera não suportada',
          description: 'Seu navegador não suporta acesso à câmera.',
        });
        setHasCameraPermission(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraType } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Acesso à câmera negado',
          description: 'Por favor, habilite a permissão da câmera nas configurações do seu navegador.',
        });
      }
    };

    getCameraPermission();

    return () => {
        // Stop camera stream when component unmounts
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast, cameraType]);

  const handleCapture = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      
      const rawDataUrl = canvas.toDataURL('image/png');
      const blob = await (await fetch(rawDataUrl)).blob()
      const file = new File([blob], 'selfie.png', { type: 'image/png' });
      
      try {
        const compressedDataUrl = await compressImage(file, 0.8, 480);
        setCapturedImage(compressedDataUrl);
      } catch(error) {
         toast({ variant: 'destructive', title: 'Erro ao processar imagem' });
         console.error(error);
      }
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    onCapture('');
  };

  return (
    <div className="w-full space-y-2">
      <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted border">
        {hasCameraPermission === false && (
             <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <VideoOff className="h-10 w-10 text-destructive mb-2" />
                <p className="font-semibold text-destructive">Câmera indisponível</p>
                <p className="text-xs text-muted-foreground">Verifique as permissões do navegador e recarregue a página.</p>
            </div>
        )}
        <video
          ref={videoRef}
          className={cn("w-full h-full object-cover", capturedImage || !hasCameraPermission ? "hidden" : "block")}
          autoPlay
          playsInline
          muted
          onCanPlay={() => setIsStreaming(true)}
        />
        {capturedImage && (
            <Image src={capturedImage} alt="Selfie capturada" layout="fill" className="object-cover" />
        )}
        {hasCameraPermission === null && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <p className="text-white">Aguardando permissão da câmera...</p>
            </div>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        {!capturedImage ? (
          <Button type="button" onClick={handleCapture} disabled={!isStreaming}>
            <Camera className="mr-2 h-4 w-4" />
            Capturar Foto
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
