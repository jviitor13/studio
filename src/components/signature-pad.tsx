
"use client";

import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Check } from 'lucide-react';

interface SignaturePadProps {
  onEnd: (signature: string) => void;
  width?: number;
  height?: number;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onEnd, width = 400, height = 200 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isSigned, setIsSigned] = useState(false);

  const getCanvasContext = () => canvasRef.current?.getContext('2d');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = getCanvasContext();
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, []);

  const startDrawing = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const ctx = getCanvasContext();
    if (!ctx) return;

    const pos = getMousePos(event);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    setIsDrawing(true);
    setIsSigned(false);
  };

  const draw = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = getCanvasContext();
    if (!ctx) return;

    const pos = getMousePos(event);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    const ctx = getCanvasContext();
    if (!ctx) return;
    ctx.closePath();
    setIsDrawing(false);
  };
  
  const getMousePos = (event: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    if ('touches' in event) {
        return {
            x: event.touches[0].clientX - rect.left,
            y: event.touches[0].clientY - rect.top,
        };
    }
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
    };
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = getCanvasContext();
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      onEnd('');
      setIsSigned(false);
    }
  };

  const confirmSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      if (isCanvasBlank(canvas)) {
        onEnd('');
        return;
      }
      // Export as JPEG with quality 0.9 for smaller size
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      onEnd(dataUrl);
      setIsSigned(true);
    }
  };

  const isCanvasBlank = (canvas: HTMLCanvasElement) => {
    const context = canvas.getContext('2d');
    if (!context) return true;
    const pixelBuffer = new Uint32Array(context.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
    return !pixelBuffer.some(pixel => pixel !== 0);
  };
  

  return (
    <div className="flex flex-col gap-2">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-dashed rounded-md bg-muted/50 cursor-crosshair touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        style={{ width: '100%', height: 'auto', aspectRatio: `${width}/${height}` }}
      />
      <div className="flex justify-between gap-2">
        <Button type="button" variant="outline" size="sm" onClick={clearSignature} className="w-full">
          <RefreshCw className="mr-2 h-4 w-4" />
          Limpar
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={confirmSignature} className="w-full" disabled={isSigned}>
          <Check className="mr-2 h-4 w-4" />
          {isSigned ? 'Confirmado' : 'Confirmar'}
        </Button>
      </div>
    </div>
  );
};
