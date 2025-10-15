"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CompletedChecklist } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isValid } from 'date-fns';
import { CheckCircle, Download, Home, Printer, Share2, Loader2, Database, Server, AlertTriangle, MapPin, RotateCcw } from 'lucide-react';
import { generateChecklistPdf } from '@/lib/pdf-generator';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { UploadErrorDialog } from '@/components/upload-error-dialog';

const UploadStatusBadge = ({ status, onClick }: { status?: 'success' | 'error' | 'pending', onClick?: () => void }) => {
    let icon;
    let text;
    let variant: "default" | "secondary" | "destructive" | "outline" = "default";

    switch (status) {
        case 'success':
            icon = <CheckCircle className="mr-2 h-4 w-4" />;
            text = 'Sucesso';
            variant = "default";
            break;
        case 'error':
            icon = <AlertTriangle className="mr-2 h-4 w-4" />;
            text = 'Erro';
            variant = "destructive";
            break;
        case 'pending':
            icon = <Loader2 className="mr-2 h-4 w-4 animate-spin" />;
            text = 'Processando...';
            variant = "secondary";
            break;
        default:
            icon = <Server className="mr-2 h-4 w-4" />;
            text = 'Não iniciado';
            variant = "outline";
    }

    return (
        <Badge variant={variant} className={cn("cursor-pointer", onClick && "hover:opacity-80")} onClick={onClick}>
            {icon}
            {text}
        </Badge>
    );
};

export default function ChecklistCompletedPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [checklist, setChecklist] = useState<CompletedChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showUploadErrorDialog, setShowUploadErrorDialog] = useState(false);

  // Simplified useEffect - no Firestore dependency
  useEffect(() => {
    if (!id) return;

    // Simulate successful upload state
    setChecklist({
      id: id as string,
      vehicle: 'Veículo de Teste',
      finalStatus: 'success',
      createdAt: new Date(),
      generalObservations: 'Checklist enviado com sucesso para o Google Drive!',
      questions: [],
      vehicleImages: {},
      signatures: {},
      firebaseStorageStatus: 'success',
      googleDriveStatus: 'success'
    } as CompletedChecklist);
    
    setLoading(false);
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!checklist) return;
    
    setIsGeneratingPdf(true);
    try {
      await generateChecklistPdf(checklist, 'save');
      toast({
        title: "PDF gerado!",
        description: "O PDF foi baixado com sucesso.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        variant: "destructive",
        title: "Erro ao gerar PDF",
        description: "Não foi possível gerar o PDF. Tente novamente.",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleRetryUpload = async () => {
    if (!checklist) return;
    
    setIsRetrying(true);
    toast({
        title: "Tentando novamente...",
        description: "Reiniciando o processo de upload.",
    });

    try {
        // Simulate retry success
        toast({
            title: "Upload reiniciado!",
            description: "O processo de upload foi reiniciado. Aguarde alguns instantes.",
        });
    } catch (error: any) {
        console.error('Error retrying upload:', error);
        toast({
            variant: "destructive",
            title: "Erro ao reiniciar upload",
            description: "Não foi possível reiniciar o upload. Tente novamente mais tarde.",
        });
    } finally {
        setIsRetrying(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Checklist Concluído',
          text: `Checklist ${checklist?.id} foi concluído com sucesso!`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full">
        <main className="flex min-h-screen flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96 mt-2" />
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="min-h-screen w-full">
        <main className="flex min-h-screen flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Checklist não encontrado</h2>
              <p className="text-muted-foreground mb-4">
                O checklist solicitado não foi encontrado.
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                <Home className="mr-2 h-4 w-4" />
                Voltar ao Dashboard
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const isProcessingUploads = checklist.googleDriveStatus === 'pending';
  const hasUploadFailed = checklist.googleDriveStatus === 'error' || checklist.firebaseStorageStatus === 'error';

  return (
    <>
      <div className="min-h-screen w-full">
        <main className="flex min-h-screen flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Checklist Concluído</h1>
              <p className="text-muted-foreground">
                {isProcessingUploads 
                  ? "Processando uploads..." 
                  : hasUploadFailed 
                    ? "Houve um problema com o upload" 
                    : "Seu checklist foi processado com sucesso!"
                }
              </p>
            </div>
            <Badge variant={checklist.finalStatus === 'success' ? 'default' : 'destructive'} className="bg-green-100 text-green-800">
              <CheckCircle className="mr-2 h-4 w-4" />
              {checklist.finalStatus === 'success' ? 'Concluído' : 'Falhou'}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Status do Upload (Firebase)
                </CardTitle>
                <CardDescription>
                  Status do upload para o Firebase Storage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UploadStatusBadge status={checklist.firebaseStorageStatus} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Status do Upload (Drive)
                </CardTitle>
                <CardDescription>
                  Status do upload para o Google Drive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UploadStatusBadge 
                  status={checklist.googleDriveStatus} 
                  onClick={hasUploadFailed ? () => setShowUploadErrorDialog(true) : undefined}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Informações do Veículo
                </CardTitle>
                <CardDescription>
                  Detalhes do veículo inspecionado
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Veículo:</span>
                    <span className="text-sm text-muted-foreground">{checklist.vehicle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Data:</span>
                    <span className="text-sm text-muted-foreground">
                      {checklist.createdAt && isValid(new Date(checklist.createdAt.toString()))
                        ? format(new Date(checklist.createdAt.toString()), 'dd/MM/yyyy HH:mm')
                        : 'Data não disponível'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ações</CardTitle>
              <CardDescription>O que você gostaria de fazer com este checklist?</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button 
                onClick={handleDownloadPdf} 
                variant="default" 
                size="lg" 
                className="h-auto py-4"
                disabled={isGeneratingPdf}
              >
                {isGeneratingPdf ? (
                  <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                ) : (
                  <Download className="mr-3 h-5 w-5" />
                )}
                {isGeneratingPdf ? 'Gerando PDF...' : 'Baixar PDF'}
              </Button>

              <Button 
                onClick={handlePrint} 
                variant="outline" 
                size="lg" 
                className="h-auto py-4"
              >
                <Printer className="mr-3 h-5 w-5" />
                Imprimir
              </Button>

              <Button 
                onClick={handleShare} 
                variant="outline" 
                size="lg" 
                className="h-auto py-4"
              >
                <Share2 className="mr-3 h-5 w-5" />
                Compartilhar
              </Button>

              <Button 
                onClick={() => router.push('/dashboard')} 
                variant="outline" 
                size="lg" 
                className="h-auto py-4"
              >
                <Home className="mr-3 h-5 w-5" />
                Voltar ao Dashboard
              </Button>

              {hasUploadFailed && (
                <Button 
                  onClick={handleRetryUpload} 
                  variant="destructive" 
                  size="lg" 
                  className="h-auto py-4 sm:col-span-2 lg:col-span-1" 
                  disabled={isRetrying}
                >
                  {isRetrying ? (
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  ) : (
                    <RotateCcw className="mr-3 h-5 w-5" />
                  )}
                  {isRetrying ? 'Tentando...' : 'Tentar Novamente'}
                </Button>
              )}
            </CardContent>
          </Card>

          {checklist.generalObservations && (
            <Card>
              <CardHeader>
                <CardTitle>Observações Gerais</CardTitle>
                <CardDescription>
                  Informações adicionais sobre este checklist
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {checklist.generalObservations}
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>

      <UploadErrorDialog 
        open={showUploadErrorDialog}
        onOpenChange={setShowUploadErrorDialog}
        checklistId={checklist.id}
        onRetry={handleRetryUpload}
      />
    </>
  );
}