
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { Fuel, Gauge, Wrench, Calendar, Truck } from "lucide-react";
import Vehicle3DViewer from "@/components/vehicle-3d-viewer";


// Mock data types - in a real app, these would come from your types file
interface Vehicle {
    plate: string;
    model: string;
    status: "Operacional" | "Em Manutenção" | "Indisponível";
    fuelLevel: number; // percentage
    mileage: number;
    lastRevision: string; // date string
}

interface MaintenancePoint {
    id: string;
    part: string;
    description: string;
    fixDate: string;
    position: { top: string; left: string; };
}

const statusVariant: { [key: string]: "default" | "secondary" | "destructive" } = {
  "Operacional": "default",
  "Em Manutenção": "destructive",
  "Indisponível": "secondary",
};


export default function Vehicle3DViewPage() {
    const params = useParams();
    const router = useRouter();
    const vehicleId = params.id as string;

    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [maintenancePoints, setMaintenancePoints] = useState<MaintenancePoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!vehicleId) return;

        // Mock fetching data - replace with actual Firestore listeners
        setIsLoading(true);
        // Simulating a Firestore listener for vehicle data
        const mockVehicleData: Vehicle = {
            plate: vehicleId,
            model: "Scania R450",
            status: "Em Manutenção",
            fuelLevel: 65,
            mileage: 184532,
            lastRevision: "2024-06-15"
        };
        // Simulating a listener for maintenance points related to the vehicle
        const mockMaintenancePoints: MaintenancePoint[] = [
            { id: "pneu1", part: "Pneu Dianteiro Direito", description: "Desgaste irregular detectado, precisa de rodízio.", fixDate: "2024-08-10", position: { top: "70%", left: "78%" } },
            { id: "motor1", part: "Motor", description: "Vazamento de óleo na junta do cabeçote.", fixDate: "2024-08-12", position: { top: "45%", left: "65%" } },
             { id: "freio1", part: "Sistema de Freios", description: "Pastilhas do eixo traseiro com 80% de desgaste.", fixDate: "2024-08-09", position: { top: "72%", left: "38%" } },
        ];
        
        // This timeout simulates the async nature of fetching data
        setTimeout(() => {
            setVehicle(mockVehicleData);
            setMaintenancePoints(mockMaintenancePoints);
            setIsLoading(false);
        }, 1000);

        // In a real app, you would use onSnapshot here:
        /*
        const unsubVehicle = onSnapshot(doc(db, "vehicles", vehicleId), (docSnap) => {
            if(docSnap.exists()) setVehicle(docSnap.data() as Vehicle);
            else console.error("Vehicle not found");
        });
        const unsubMaint = onSnapshot(query(collection(db, "maintenances"), where("vehicleId", "==", vehicleId), where("status", "!=", "Concluída")), (snapshot) => {
            const points = snapshot.docs.map(d => mapMaintenanceToPoint(d.data()));
            setMaintenancePoints(points);
        });
        setIsLoading(false);
        return () => { unsubVehicle(); unsubMaint(); };
        */

    }, [vehicleId]);

    if (isLoading) {
        return (
            <div className="p-4 md:p-6 space-y-4">
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-6 w-1/4" />
                <div className="relative aspect-[16/9] w-full">
                    <Skeleton className="w-full h-full" />
                </div>
                 <Skeleton className="h-24 w-full" />
            </div>
        )
    }

    if (!vehicle) {
        return (
            <div className="p-4 text-center">
                <h1 className="text-xl">Veículo não encontrado</h1>
                <Button onClick={() => router.push('/veiculos')} className="mt-4">Voltar para a lista</Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <header className="p-4 md:p-6">
                <h1 className="text-2xl font-headline font-semibold">{vehicle.model}</h1>
                <div className="flex items-center gap-4 text-muted-foreground">
                    <span>Placa: {vehicle.plate}</span>
                    <Badge variant={statusVariant[vehicle.status]}>{vehicle.status}</Badge>
                </div>
            </header>

            {/* 3D View Area */}
            <main className="flex-1 flex items-center justify-center p-4">
                <div className="relative w-full h-full max-w-5xl mx-auto">
                    <Vehicle3DViewer />
                    {maintenancePoints.map(point => (
                        <Popover key={point.id}>
                            <PopoverTrigger asChild>
                                <button 
                                    className="absolute w-4 h-4 bg-red-500 rounded-full animate-pulse transform -translate-x-1/2 -translate-y-1/2 border-2 border-white shadow-lg"
                                    style={{ top: point.position.top, left: point.position.left }}
                                    aria-label={`Ver detalhes de ${point.part}`}
                                />
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <h4 className="font-medium leading-none">{point.part}</h4>
                                        <p className="text-sm text-muted-foreground">
                                            {point.description}
                                        </p>
                                    </div>
                                    <div className="grid gap-2">
                                        <div className="grid grid-cols-2 items-center">
                                            <span className="text-sm font-medium">Previsão:</span>
                                            <span className="text-sm">{point.fixDate}</span>
                                        </div>
                                         <Button size="sm" onClick={() => router.push('/manutencoes')}>Agendar Serviço</Button>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    ))}
                </div>
            </main>

            {/* Footer */}
            <footer className="p-4 md:p-6 border-t bg-card">
                 <Card>
                    <CardHeader>
                        <CardTitle>Status Resumido</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                            <Fuel className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-semibold">{vehicle.fuelLevel}%</p>
                                <p className="text-muted-foreground">Combustível</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-2">
                            <Gauge className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-semibold">{vehicle.mileage.toLocaleString('pt-BR')} km</p>
                                <p className="text-muted-foreground">Quilometragem</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-semibold">{vehicle.lastRevision}</p>
                                <p className="text-muted-foreground">Última Revisão</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-2">
                            <Wrench className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-semibold">{maintenancePoints.length}</p>
                                <p className="text-muted-foreground">Pontos em Manutenção</p>
                            </div>
                        </div>
                    </CardContent>
                 </Card>
            </footer>
        </div>
    );
}
