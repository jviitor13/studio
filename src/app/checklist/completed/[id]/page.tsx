
"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { CompletedChecklist } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { CheckCircle, Download, Home, Printer, Share2, Loader2 } from 'lucide-react';
import { generateChecklistPdf } from '@/lib/pdf-generator';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';


const statusVariant : {[key:string]: "default" | "destructive" | "secondary"} = {
    'OK': 'default',
    'Pendente': 'destructive',
    'Enviando': 'secondary',
}

const statusBadgeColor : {[key:string]: string} = {
    'OK': 'bg-green-500 hover:bg-green-600',
    'Pendente': '',
    'Enviando': 'animate-pulse'
}

export default function ChecklistCompletedPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const checklistId = params.id as string;
    
    const [checklist, setChecklist] = useState<CompletedChecklist | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!checklistId) return;
        setIsLoading(true);
        const docRef = doc(db, 'completed-checklists', checklistId);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setChecklist({
                    ...data,
                    id: docSnap.id,
                    createdAt: data.createdAt.toDate().toISOString(),
                } as CompletedChecklist);
            } else {
                console.error("No such document!");
                toast({ variant: "destructive", title: "Erro", description: "Checklist não encontrado." });
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [checklistId, toast]);

    const handleExport = async () => {
        if (!checklist) return;
        toast({
            title: "Exportação Iniciada",
            description: "Seu PDF está sendo preparado...",
        });
        try {
            await generateChecklistPdf(checklist);
        } catch (error) {
            console.error("PDF generation error:", error);
            toast({
                variant: "destructive",
                title: "Erro ao Gerar PDF",
                description: "Não foi possível gerar o arquivo. Tente novamente."
            })
        }
    }
    
    const handlePrint = () => {
        toast({ title: "Preparando impressão...", description: "A janela de impressão será aberta." });
        window.print();
    }
    
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `RodoCheck - Checklist ${checklist?.id}`,
                    text: `Confira o checklist para o veículo ${checklist?.vehicle}.`,
                    url: window.location.href,
                });
                toast({ title: "Checklist compartilhado com sucesso!" });
            } catch (error: any) {
                // Ignore AbortError which is thrown when the user cancels the share action
                if (error.name !== 'AbortError') {
                    console.error('Error sharing:', error);
                    toast({ 
                        variant: "destructive",
                        title: "Falha ao compartilhar", 
                        description: "Não foi possível compartilhar o checklist. Verifique as permissões do seu navegador." 
                    });
                }
            }
        } else {
            // Fallback for browsers that do not support navigator.share
            navigator.clipboard.writeText(window.location.href);
            toast({ title: "Link Copiado!", description: "O link para o checklist foi copiado para a área de transferência." });
        }
    };


    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-16 w-full md:w-1/2" />
                <Card>
                    <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!checklist) {
        return <p>Checklist não encontrado.</p>;
    }
    
    const getStatusLabel = (status: CompletedChecklist['status']) => {
        switch (status) {
            case 'OK': return 'Concluído';
            case 'Pendente': return 'Com Pendências';
            case 'Enviando': return 'Enviando Imagens...';
            default: return status;
        }
    }

    const formattedDate = checklist.createdAt ? format(new Date(checklist.createdAt), "dd/MM/yyyy 'às' HH:mm") : 'Data não disponível';

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Checklist Finalizado!"
                description="O seu checklist foi enviado e está salvo no sistema."
            />
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {checklist.status !== 'Enviando' ? 
                            <CheckCircle className="h-7 w-7 text-green-600" /> : 
                            <Loader2 className="h-7 w-7 text-secondary animate-spin" />
                        }
                        Resumo do Envio
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex flex-col gap-1">
                        <span className="font-semibold">ID do Checklist:</span>
                        <span className="text-muted-foreground break-all">{checklist.id}</span>
                    </div>
                     <div className="flex flex-col gap-1">
                        <span className="font-semibold">Veículo:</span>
                        <span className="text-muted-foreground">{checklist.vehicle}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="font-semibold">Responsável:</span>
                        <span className="text-muted-foreground">{checklist.driver}</span>
                    </div>
                     <div className="flex flex-col gap-1">
                        <span className="font-semibold">Data/Hora:</span>
                        <span className="text-muted-foreground">{formattedDate}</span>
                    </div>
                     <div className="flex flex-col gap-1">
                        <span className="font-semibold">Tipo:</span>
                        <span className="text-muted-foreground capitalize">{checklist.type}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="font-semibold">Status:</span>
                        <Badge variant={statusVariant[checklist.status]} className={`w-fit ${statusBadgeColor[checklist.status]}`}>
                            {getStatusLabel(checklist.status)}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Detalhes Completos</CardTitle>
                    <CardDescription>Visualização completa do checklist submetido.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg p-4">
                         <div className="space-y-4">
                            {checklist.questions.map((item) => (
                            <div key={item.id} className="p-3 border rounded-lg bg-muted/30">
                                <p className="font-medium">{item.text}</p>
                                <p className="text-sm text-muted-foreground">Status: {item.status}</p>
                                {item.observation && <p className="text-sm text-muted-foreground">Observação: {item.observation}</p>}
                                {item.photo && (
                                  <div className="mt-2">
                                    {item.photo.startsWith('http') ?
                                        <img src={item.photo} alt="foto" className="rounded-md w-full max-w-xs"/> :
                                        <p className="text-xs text-muted-foreground italic">Imagem sendo processada...</p>
                                    }
                                  </div>
                                )}
                            </div>
                            ))}
                            {(checklist.signatures?.assinaturaResponsavel || checklist.signatures?.assinaturaMotorista) && (
                                <div className="p-3 border rounded-lg bg-muted/30">
                                    <p className="font-medium">Validação e Assinaturas</p>
                                     <div className="flex flex-col md:flex-row gap-8 mt-2">
                                        {checklist.signatures?.selfieResponsavel && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">Selfie Responsável: {checklist.responsibleName}</p>
                                                <Image src={checklist.signatures.selfieResponsavel} alt="selfie" width={160} height={120} className="rounded-md border bg-white object-cover" />
                                            </div>
                                        )}
                                        {checklist.signatures?.assinaturaResponsavel && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">Assinatura Responsável</p>
                                                <img src={checklist.signatures.assinaturaResponsavel} alt="assinatura" className="rounded-md border bg-white h-24" />
                                            </div>
                                        )}
                                     </div>
                                      <div className="flex flex-col md:flex-row gap-8 mt-4">
                                        {checklist.signatures?.selfieMotorista && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">Selfie Motorista: {checklist.driver}</p>
                                                <Image src={checklist.signatures.selfieMotorista} alt="selfie" width={160} height={120} className="rounded-md border bg-white object-cover" />
                                            </div>
                                        )}
                                        {checklist.signatures?.assinaturaMotorista && (
                                            <div>
                                                <p className="text-sm text-muted-foreground">Assinatura Motorista</p>
                                                <img src={checklist.signatures.assinaturaMotorista} alt="assinatura" className="rounded-md border bg-white h-24" />
                                            </div>
                                        )}
                                     </div>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle>Ações</CardTitle>
                    <CardDescription>O que você gostaria de fazer com este checklist?</CardDescription>
                </CardHeader>
                 <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Button onClick={handleExport} size="lg" className="h-auto py-4" disabled={checklist.status === 'Enviando'}>
                        <Download className="mr-3 h-5 w-5" />
                        Gerar PDF
                    </Button>
                     <Button onClick={handlePrint} variant="outline" size="lg" className="h-auto py-4" disabled={checklist.status === 'Enviando'}>
                        <Printer className="mr-3 h-5 w-5" />
                        Imprimir
                    </Button>
                     <Button onClick={handleShare} variant="outline" size="lg" className="h-auto py-4">
                        <Share2 className="mr-3 h-5 w-5" />
                        Compartilhar
                    </Button>
                </CardContent>
            </Card>

             <Button variant="link" onClick={() => router.push('/dashboard')} className="self-center">
                <Home className="mr-2 h-4 w-4" /> Ir para o Início
            </Button>

        </div>
    );
}


    