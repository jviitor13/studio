
"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Camera, Check, RefreshCw, Loader2, VideoOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { compressImage } from '@/lib/image-compressor';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

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
  }, []);

  useEffect(() => {
    // This effect handles the camera stream when mode is 'streaming'
    if (mode === 'streaming') {
      const startStream = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: cameraType },
          });
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
        } catch (err) {
          console.error("Camera access error:", err);
          const errorMessage = "Não foi possível acessar a câmera. Verifique as permissões.";
          setError(errorMessage);
          toast({ variant: "destructive", title: "Acesso à Câmera Negado", description: errorMessage });
          setMode('idle'); // Go back to idle if permission is denied
        }
      };
      startStream();
    } else {
      stopCamera();
    }
    
    // Cleanup function to stop the camera when component unmounts or mode changes
    return () => {
      stopCamera();
    };
  }, [mode, cameraType, stopCamera, toast]);

  const handleActivateCamera = () => {
    setError(null);
    setMode('streaming');
  };

  const takePhoto = useCallback(async () => {
    if (mode !== 'streaming' || !videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if (!context) {
      setIsProcessing(false);
      return;
    }
    
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    
    try {
      const rawDataUrl = canvas.toDataURL('image/png');
      const blob = await fetch(rawDataUrl).then(res => res.blob());
      const file = new File([blob], 'capture.png', { type: 'image/png' });
      const compressedDataUrl = await compressImage(file);
      setCapturedImage(compressedDataUrl);
      setMode('captured');
    } catch (err) {
      console.error(err);
      toast({ variant: 'destructive', title: 'Erro ao processar imagem' });
      setMode('idle');
    } finally {
      setIsProcessing(false);
    }
  }, [mode, toast]);


  const handleRetake = () => {
    setCapturedImage(null);
    onCapture('');
    setMode('idle');
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
      setMode('idle');
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="relative w-full aspect-video rounded-md overflow-hidden bg-muted border flex items-center justify-center">
        {mode === 'idle' && !capturedImage && (
           <div className="text-center p-2">
              <Camera className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Clique para ativar a câmera</p>
           </div>
        )}

        {mode === 'streaming' && <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />}

        {(mode === 'captured' || (mode === 'idle' && capturedImage)) && (
          <Image src={capturedImage!} alt="Foto capturada" layout="fill" className="object-cover" />
        )}
        
        {isProcessing && (
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
        {mode === 'idle' && !capturedImage && (
          <Button type="button" onClick={handleActivateCamera} disabled={isProcessing}>
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
        {(mode === 'captured' || (mode === 'idle' && capturedImage)) && (
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
