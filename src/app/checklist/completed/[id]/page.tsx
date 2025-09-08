

"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { CompletedChecklist } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, isValid } from 'date-fns';
import { CheckCircle, Download, Home, Printer, Share2, Loader2, Database, Server, AlertTriangle } from 'lucide-react';
import { generateChecklistPdf } from '@/lib/pdf-generator';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { UploadErrorDialog } from '@/components/upload-error-dialog';


const UploadStatusBadge = ({ status, onClick }: { status?: 'success' | 'error' | 'pending', onClick?: () => void }) => {
    let icon;
    let text;
    let variant: "default" | "destructive" | "secondary" = "secondary";
    let className = "";
    let isClickable = false;

    switch (status) {
        case 'success':
            icon = <CheckCircle className="h-3 w-3" />;
            text = "Sucesso";
            variant = "default";
            className = "bg-green-500 hover:bg-green-600";
            break;
        case 'error':
            icon = <AlertTriangle className="h-3 w-3" />;
            text = "Falha";
            variant = "destructive";
            isClickable = true;
            className = "cursor-pointer hover:bg-destructive/80";
            break;
        case 'pending':
        default:
            icon = <Loader2 className="h-3 w-3 animate-spin" />;
            text = "Pendente";
            variant = "secondary";
            break;
    }

    return (
        <Badge variant={variant} className={cn("flex items-center gap-1 w-fit text-xs", className)} onClick={isClickable ? onClick : undefined}>
            {icon}
            <span>{text}</span>
        </Badge>
    );
};


export default function ChecklistCompletedPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const checklistId = params.id as string;
    
    const [checklist, setChecklist] = useState<CompletedChecklist | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isErrorDialogOpen, setIsErrorDialogOpen] = useState(false);

    useEffect(() => {
        if (!checklistId) return;
        setIsLoading(true);
        const docRef = doc(db, 'completed-checklists', checklistId);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // Robust date handling
                let createdAtDate: Date | null = null;
                const rawDate = data.createdAt;

                if (rawDate instanceof Timestamp) {
                    createdAtDate = rawDate.toDate();
                } else if (rawDate && typeof rawDate.seconds === 'number' && typeof rawDate.nanoseconds === 'number') {
                    // Handle Firestore-like timestamp objects that aren't instances of Timestamp
                    createdAtDate = new Timestamp(rawDate.seconds, rawDate.nanoseconds).toDate();
                }
                else if (typeof rawDate === 'string' || typeof rawDate === 'number') {
                    const parsedDate = new Date(rawDate);
                    if (isValid(parsedDate)) {
                        createdAtDate = parsedDate;
                    }
                }

                setChecklist({
                    ...data,
                    id: docSnap.id,
                    createdAt: createdAtDate, // Store as Date object or null
                } as CompletedChecklist);
                 setIsLoading(false);
            } else {
                console.warn(`Checklist with ID ${checklistId} not found yet. It might be processing.`);
                // Keep loading true to wait for the document to be created
            }
        }, (error) => {
            console.error("Error fetching checklist:", error);
            toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar o checklist." });
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
            toast({ title: "Link Copiado!", description: "O link para o checklist foi copiado para la área de transferência." });
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
    
    const getStatusBadge = (status: CompletedChecklist['status']) => {
        switch (status) {
            case 'Sem Pendências': return <Badge className="bg-green-500 hover:bg-green-600">Sem Pendências</Badge>;
            case 'Com Pendências': return <Badge variant="destructive">Com Pendências</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    }

    const isProcessingUploads = checklist.firebaseStorageStatus === 'pending' || checklist.googleDriveStatus === 'pending';

    const formattedDate = checklist.createdAt && isValid(checklist.createdAt) 
        ? format(checklist.createdAt, "dd/MM/yyyy 'às' HH:mm") 
        : 'Data não disponível';

    return (
        <>
            <UploadErrorDialog
                isOpen={isErrorDialogOpen}
                onClose={() => setIsErrorDialogOpen(false)}
                errorMessage={checklist.generalObservations}
            />
            <div className="flex flex-col gap-6">
                <PageHeader
                    title={checklist.status}
                    description={isProcessingUploads ? "O checklist foi salvo. Os anexos estão sendo enviados em segundo plano." : "O seu checklist foi enviado e está salvo no sistema."}
                />
                
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CheckCircle className="h-7 w-7 text-green-600" />
                            Resumo do Checklist
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-2 text-sm">
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
                            <span className="font-semibold">Status dos Itens:</span>
                            {getStatusBadge(checklist.status)}
                        </div>
                         <div className="flex flex-col gap-1 sm:col-span-2 md:col-span-3">
                            <span className="font-semibold">Status do Upload dos Anexos:</span>
                            <div className="flex items-center gap-6 mt-1">
                                 <div className="flex items-center gap-2">
                                    <Database className="h-4 w-4 text-muted-foreground" title="Google Drive" />
                                    <UploadStatusBadge status={checklist.googleDriveStatus} onClick={() => setIsErrorDialogOpen(true)} />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Server className="h-4 w-4 text-muted-foreground" title="Firebase Storage" />
                                    <UploadStatusBadge status={checklist.firebaseStorageStatus} onClick={() => setIsErrorDialogOpen(true)} />
                                </div>
                            </div>
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
                                            <Image src={item.photo} alt="foto" width={200} height={150} className="rounded-md object-cover"/> :
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                                                <Loader2 className="h-3 w-3 animate-spin"/> Imagem sendo processada...
                                            </div>
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
                                                    {checklist.signatures.selfieResponsavel.startsWith('http') ?
                                                         <Image src={checklist.signatures.selfieResponsavel} alt="selfie" width={160} height={120} className="rounded-md border bg-white object-cover" />
                                                         : <div className="flex items-center gap-2 text-xs text-muted-foreground italic h-[120px]"><Loader2 className="h-3 w-3 animate-spin"/> Processando...</div>
                                                    }
                                                </div>
                                            )}
                                            {checklist.signatures?.assinaturaResponsavel && (
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Assinatura Responsável</p>
                                                     {checklist.signatures.assinaturaResponsavel.startsWith('http') ?
                                                        <img src={checklist.signatures.assinaturaResponsavel} alt="assinatura" className="rounded-md border bg-white h-24" />
                                                        : <div className="flex items-center gap-2 text-xs text-muted-foreground italic h-[96px]"><Loader2 className="h-3 w-3 animate-spin"/> Processando...</div>
                                                    }
                                                </div>
                                            )}
                                         </div>
                                          <div className="flex flex-col md:flex-row gap-8 mt-4">
                                            {checklist.signatures?.selfieMotorista && (
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Selfie Motorista: {checklist.driver}</p>
                                                    {checklist.signatures.selfieMotorista.startsWith('http') ?
                                                        <Image src={checklist.signatures.selfieMotorista} alt="selfie" width={160} height={120} className="rounded-md border bg-white object-cover" />
                                                        : <div className="flex items-center gap-2 text-xs text-muted-foreground italic h-[120px]"><Loader2 className="h-3 w-3 animate-spin"/> Processando...</div>
                                                    }
                                                </div>
                                            )}
                                            {checklist.signatures?.assinaturaMotorista && (
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Assinatura Motorista</p>
                                                    {checklist.signatures.assinaturaMotorista.startsWith('http') ?
                                                        <img src={checklist.signatures.assinaturaMotorista} alt="assinatura" className="rounded-md border bg-white h-24" />
                                                         : <div className="flex items-center gap-2 text-xs text-muted-foreground italic h-[96px]"><Loader2 className="h-3 w-3 animate-spin"/> Processando...</div>
                                                    }
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
                        <Button onClick={handleExport} size="lg" className="h-auto py-4" disabled={isProcessingUploads}>
                            <Download className="mr-3 h-5 w-5" />
                            Gerar PDF
                        </Button>
                         <Button onClick={handlePrint} variant="outline" size="lg" className="h-auto py-4" disabled={isProcessingUploads}>
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
        </>
    );
}

