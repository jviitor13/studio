
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Camera, Check, RefreshCw, Loader2, VideoOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/image-compressor';
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

  const [mode, setMode] = useState<'idle' | 'streaming' | 'captured'>('idle');
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
  }, []);

  useEffect(() => {
    // Cleanup function to stop camera when component unmounts
    return () => {
      stopCamera();
    };
  }, [stopCamera]);
  
  const startCamera = async () => {
    if (mode !== 'idle') return;
    setError(null);

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: cameraType } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play(); // Ensure video plays
          setMode('streaming');
        }
      } catch (err) {
        console.error("Camera access error:", err);
        const errorMessage = "Não foi possível acessar a câmera. Verifique as permissões do navegador e tente novamente.";
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Acesso à Câmera Negado",
          description: errorMessage,
        });
        setMode('idle');
      }
    } else {
      setError("Seu navegador não suporta acesso à câmera.");
      setMode('idle');
    }
  };

  const takePhoto = () => {
    if (mode !== 'streaming' || !videoRef.current || !canvasRef.current) return;
    
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
        .then(blob => new File([blob], 'capture.png', { type: 'image/png' }))
        .then(compressImage)
        .then(compressedDataUrl => {
          setCapturedImage(compressedDataUrl);
          stopCamera();
          setMode('captured');
        })
        .catch(err => {
          console.error(err);
          toast({ variant: 'destructive', title: 'Erro ao processar imagem' });
          stopCamera();
          setMode('idle');
        })
        .finally(() => setIsProcessing(false));
    } else {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    onCapture('');
    setMode('idle');
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      // Optional: go back to idle state after confirm
      setMode('idle');
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted border flex items-center justify-center">
        {mode === 'streaming' && (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            playsInline
            muted
          />
        )}
        {mode === 'captured' && capturedImage && (
          <Image src={capturedImage} alt="Foto capturada" layout="fill" className="object-cover" />
        )}
        {mode === 'idle' && (
           <div className="text-center p-2">
            {error ? (
              <>
                <VideoOff className="h-10 w-10 text-destructive mx-auto mb-2" />
                <p className="text-sm font-semibold text-destructive">{error}</p>
              </>
            ) : (
              <>
                <Camera className="h-10 w-10 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Clique para ativar a câmera</p>
              </>
            )}
          </div>
        )}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        {mode === 'idle' && (
          <Button type="button" onClick={startCamera} disabled={isProcessing}>
            <Camera className="mr-2 h-4 w-4" />
            Ativar Câmera
          </Button>
        )}
        {mode === 'streaming' && (
          <Button type="button" onClick={takePhoto} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
            {isProcessing ? 'Processando...' : 'Capturar Foto'}
          </Button>
        )}
        {mode === 'captured' && (
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
