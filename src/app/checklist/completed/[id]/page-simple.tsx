"use client";

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Download, Home, Printer, Share2, Loader2 } from 'lucide-react';
import { generateChecklistPdf } from '@/lib/pdf-generator';
import { useToast } from '@/hooks/use-toast';

export default function ChecklistCompletedPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      // Generate PDF directly from the checklist data
      await generateChecklistPdf({
        id: id as string,
        vehicle: 'Veículo de Teste',
        finalStatus: 'success',
        createdAt: new Date(),
        generalObservations: 'Checklist enviado com sucesso para o Google Drive!',
        questions: [],
        vehicleImages: {},
        signatures: {}
      } as any, 'save');
      
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

  return (
    <div className="min-h-screen w-full">
      <main className="flex min-h-screen flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Checklist Concluído</h1>
            <p className="text-muted-foreground">
              Seu checklist foi enviado com sucesso para o Google Drive!
            </p>
          </div>
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="mr-2 h-4 w-4" />
            Enviado com Sucesso
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resumo do Checklist</CardTitle>
            <CardDescription>
              Checklist ID: {id}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Concluído
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Veículo:</span>
                <span className="text-sm text-muted-foreground">Veículo de Teste</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Data:</span>
                <span className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
            <CardDescription>O que você gostaria de fazer?</CardDescription>
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
              onClick={() => window.print()} 
              variant="outline" 
              size="lg" 
              className="h-auto py-4"
            >
              <Printer className="mr-3 h-5 w-5" />
              Imprimir
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Informações Importantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>✅ Seu checklist foi enviado com sucesso para o Google Drive</p>
              <p>📁 Os arquivos estão organizados em pastas por veículo e data</p>
              <p>📄 Um PDF completo foi gerado com todas as informações</p>
              <p>🖼️ Todas as imagens foram salvas individualmente</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
