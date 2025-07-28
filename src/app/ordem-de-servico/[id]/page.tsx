
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { Home, Printer, Share2 } from 'lucide-react';

interface ServiceOrder {
    id: string;
    checklistId: string;
    vehicleId: string;
    technicianName: string;
    status: 'Aberta' | 'Em Andamento' | 'Concluída';
    createdAt: string;
    description: string;
}

export default function ServiceOrderDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const serviceOrderId = params.id as string;

    const [order, setOrder] = useState<ServiceOrder | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!serviceOrderId) return;
        
        const fetchOrder = async () => {
            setIsLoading(true);
            const docRef = doc(db, 'ordens_de_servico', serviceOrderId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                setOrder({
                    id: docSnap.id,
                    ...data,
                    createdAt: (data.createdAt as any).toDate().toISOString(),
                } as ServiceOrder);
            } else {
                console.error("No such service order!");
            }
            setIsLoading(false);
        };

        fetchOrder();
    }, [serviceOrderId]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-16 w-1/2" />
                <Card>
                    <CardHeader><Skeleton className="h-8 w-1/3" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!order) {
        return <p>Ordem de Serviço não encontrada.</p>;
    }

     const formattedDate = order.createdAt ? format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm") : 'Data não disponível';

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title={`Ordem de Serviço #${order.id.substring(0, 7).toUpperCase()}`}
                description="Detalhes da ordem de serviço gerada."
            />
            
            <Card>
                <CardHeader>
                    <CardTitle>Resumo da Ordem de Serviço</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex flex-col gap-1">
                        <span className="font-semibold">Veículo:</span>
                        <span className="text-muted-foreground">{order.vehicleId}</span>
                    </div>
                     <div className="flex flex-col gap-1">
                        <span className="font-semibold">Técnico Responsável:</span>
                        <span className="text-muted-foreground">{order.technicianName}</span>
                    </div>
                     <div className="flex flex-col gap-1">
                        <span className="font-semibold">Data de Abertura:</span>
                        <span className="text-muted-foreground">{formattedDate}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="font-semibold">Status:</span>
                        <Badge>{order.status}</Badge>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="font-semibold">Checklist de Origem:</span>
                        <span className="text-muted-foreground break-all">{order.checklistId}</span>
                    </div>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <CardTitle>Ações</CardTitle>
                 </CardHeader>
                 <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                     <Button size="lg" className="h-auto py-4">
                        <Printer className="mr-3 h-5 w-5" />
                        Imprimir O.S.
                    </Button>
                     <Button variant="outline" size="lg" className="h-auto py-4">
                        <Share2 className="mr-3 h-5 w-5" />
                        Compartilhar
                    </Button>
                     <Button variant="link" onClick={() => router.push('/dashboard')} className="self-center mt-4 sm:col-span-2 lg:col-span-1 lg:mt-0">
                        <Home className="mr-2 h-4 w-4" /> Ir para o Início
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

