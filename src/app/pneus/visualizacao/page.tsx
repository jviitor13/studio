
"use client";

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Grip, Repeat, Trash2, PlusCircle, Thermometer, Gauge, Search } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { collection, doc, onSnapshot, query, updateDoc, where, getDocs, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface Tire {
    id: string;
    fireId: string;
    brand: string;
    model: string;
    pressure?: string;
    depth?: string;
    vehicleId?: string;
    position?: string;
}

interface Vehicle {
    id: string; // This is the plate
    plate: string;
    model: string;
}

const tirePositionsMap = [
    { value: "DDE", label: "Dianteiro Direito Externo" },
    { value: "DDD", label: "Dianteiro Esquerdo Externo" },
    { value: "T1EI", label: "1º Eixo Traseiro - Esquerdo Interno" },
    { value: "T1EE", label: "1º Eixo Traseiro - Esquerdo Externo" },
    { value: "T1DI", label: "1º Eixo Traseiro - Direito Interno" },
    { value: "T1DE", label: "1º Eixo Traseiro - Direito Externo" },
    { value: "T2EI", label: "2º Eixo Traseiro - Esquerdo Interno" },
    { value: "T2EE", label: "2º Eixo Traseiro - Esquerdo Externo" },
    { value: "T2DI", label: "2º Eixo Traseiro - Direito Interno" },
    { value: "T2DE", label: "2º Eixo Traseiro - Direito Externo" },
];

const TireSwapDialog = ({ onSwap, currentTireId, position, vehicleId }: { onSwap: (newTire: Tire) => void, currentTireId: string, position: string, vehicleId: string }) => {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [stockTires, setStockTires] = useState<Tire[]>([]);
    const [selectedTire, setSelectedTire] = useState('');

    useEffect(() => {
        if (open) {
            const q = query(collection(db, "pneus"), where("status", "in", ["Em Estoque", "Novo"]));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const tiresData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tire));
                setStockTires(tiresData);
            });
            return () => unsubscribe();
        }
    }, [open]);

    const handleSwap = async () => {
        if (!selectedTire) {
            toast({ variant: 'destructive', title: "Erro", description: "Selecione um pneu para instalar." });
            return;
        }

        try {
            // Update new tire
            const newTireRef = doc(db, 'pneus', selectedTire);
            await updateDoc(newTireRef, { status: 'Em Uso', vehicleId, position });
            
            // Update old tire
            const oldTireRef = doc(db, 'pneus', currentTireId);
            await updateDoc(oldTireRef, { status: 'Em Estoque', vehicleId: '', position: '' });
            
            const newTireData = stockTires.find(t => t.id === selectedTire);
            if(newTireData) onSwap(newTireData);

            toast({ title: "Sucesso!", description: `Pneu trocado na posição ${position}.` });
            setOpen(false);
        } catch (error) {
            console.error("Error swapping tire:", error);
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível realizar a troca." });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setOpen(true); }}><Repeat className="mr-2 h-4 w-4" />Trocar Pneu</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Trocar Pneu - Posição {position}</DialogTitle>
                    <DialogDescription>Selecione um pneu do estoque para instalar no lugar do pneu atual ({currentTireId}).</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="tire-select">Pneu do Estoque</Label>
                    <Select value={selectedTire} onValueChange={setSelectedTire}>
                        <SelectTrigger id="tire-select"><SelectValue placeholder="Selecione um pneu..." /></SelectTrigger>
                        <SelectContent>
                            {stockTires.map(t => <SelectItem key={t.id} value={t.id}>{t.fireId} - {t.brand} {t.model}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSwap}>Confirmar Troca</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

const TireInspectionDialog = ({ tire, onInspect }: { tire: Tire, onInspect: (updates: Partial<Tire>) => void }) => {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [pressure, setPressure] = useState(tire.pressure || '');
    const [depth, setDepth] = useState(tire.depth || '');

    const handleSaveInspection = async () => {
        try {
            const tireRef = doc(db, 'pneus', tire.id);
            const updates = { pressure, depth };
            await updateDoc(tireRef, updates);
            onInspect(updates);
            toast({ title: "Inspeção Salva", description: "Os dados do pneu foram atualizados." });
            setOpen(false);
        } catch (error) {
            console.error("Error saving inspection:", error);
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível salvar a inspeção." });
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setOpen(true); }}><Search className="mr-2 h-4 w-4" />Inspecionar</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Inspecionar Pneu: {tire.fireId}</DialogTitle>
                    <DialogDescription>{tire.brand} {tire.model}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className='grid gap-2'>
                        <Label htmlFor='pressure'>Pressão (PSI)</Label>
                        <Input id='pressure' value={pressure} onChange={e => setPressure(e.target.value)} placeholder="Ex: 120"/>
                    </div>
                    <div className='grid gap-2'>
                        <Label htmlFor='depth'>Profundidade do Sulco (mm)</Label>
                        <Input id='depth' value={depth} onChange={e => setDepth(e.target.value)} placeholder="Ex: 10"/>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSaveInspection}>Salvar Inspeção</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const TirePosition = ({ position, tireData, vehicleId, onAction, onInspect, onSwap }: { position: string, tireData?: Tire, vehicleId: string, onAction: (action: string, position: string, tireId?: string) => void, onInspect: (position: string, updates: Partial<Tire>) => void, onSwap: (position: string, newTire: Tire) => void }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={tireData ? "outline" : "secondary"} className="w-20 h-28 flex flex-col items-center justify-center border-2 border-dashed hover:border-primary transition-colors">
          <Grip className="h-6 w-6" />
          <span className="text-xs mt-1">{position}</span>
           {tireData && <span className="text-[10px] mt-1 font-bold text-primary truncate">{tireData.fireId}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" onClick={(e) => e.stopPropagation()}>
        {tireData ? (
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Pneu: {tireData.fireId}</h4>
              <p className="text-sm text-muted-foreground">{tireData.brand} {tireData.model}</p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <p className="font-semibold">{tireData.pressure || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">Pressão</p>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <p className="font-semibold">{tireData.depth || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">Sulco</p>
                    </div>
                </div>
            </div>
            <Separator />
             <div className="flex flex-col gap-2">
                <TireInspectionDialog tire={tireData} onInspect={(updates) => onInspect(position, updates)} />
                <TireSwapDialog currentTireId={tireData.id} position={position} vehicleId={vehicleId} onSwap={(newTire) => onSwap(position, newTire)} />
                <Button size="sm" variant="destructive" onClick={() => onAction('retirar', position, tireData.id)}><Trash2 className="mr-2 h-4 w-4" />Retirar Pneu</Button>
             </div>
          </div>
        ) : (
             <div className="space-y-2 text-center">
                <p className="font-medium">Posição Vazia</p>
                <p className="text-sm text-muted-foreground">{position}</p>
                <Button size="sm" className="mt-2" onClick={() => onAction('instalar', position)}><PlusCircle className="mr-2 h-4 w-4" />Instalar Pneu</Button>
             </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

const InstallTireDialog = ({ open, onOpenChange, onInstall, position, vehicleId }: { open: boolean, onOpenChange: (open: boolean) => void, onInstall: (tire: Tire) => void, position: string, vehicleId: string }) => {
    const { toast } = useToast();
    const [stockTires, setStockTires] = useState<Tire[]>([]);
    const [selectedTire, setSelectedTire] = useState('');

    useEffect(() => {
        if (open) {
            const q = query(collection(db, "pneus"), where("status", "in", ["Em Estoque", "Novo"]));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const tiresData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tire));
                setStockTires(tiresData);
            });
            return () => unsubscribe();
        }
    }, [open]);

    const handleInstall = async () => {
        if (!selectedTire) {
            toast({ variant: 'destructive', title: "Erro", description: "Selecione um pneu para instalar." });
            return;
        }
        
        const tireToInstall = stockTires.find(t => t.id === selectedTire);
        if (tireToInstall) {
             try {
                // Check if position is occupied on the DB one last time
                const q = query(collection(db, 'pneus'), where('vehicleId', '==', vehicleId), where('position', '==', position));
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    toast({ variant: 'destructive', title: "Posição Ocupada", description: `A posição ${position} foi ocupada enquanto você selecionava. Tente outra.` });
                    return;
                }

                const tireRef = doc(db, 'pneus', tireToInstall.id);
                await updateDoc(tireRef, {
                    status: 'Em Uso',
                    vehicleId: vehicleId,
                    position: position,
                });
                
                await setDoc(doc(db, 'vehicles', vehicleId), { status: 'Disponível' }, { merge: true });

                onInstall(tireToInstall);
                toast({ title: "Pneu Instalado!", description: `O pneu ${tireToInstall.fireId} foi instalado na posição ${position}.` });
                onOpenChange(false);
            } catch (error) {
                console.error("Error installing tire:", error)
                toast({ variant: 'destructive', title: "Erro", description: "Não foi possível instalar o pneu." });
            }
        }
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Instalar Pneu na Posição {position}</DialogTitle>
                    <DialogDescription>Selecione um pneu do estoque para instalar nesta posição.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="install-tire-select">Pneu do Estoque</Label>
                    <Select value={selectedTire} onValueChange={setSelectedTire}>
                        <SelectTrigger id="install-tire-select"><SelectValue placeholder="Selecione um pneu..." /></SelectTrigger>
                        <SelectContent>
                            {stockTires.map(t => <SelectItem key={t.id} value={t.id}>{t.fireId} - {t.brand} {t.model}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleInstall}>Confirmar Instalação</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function PneusVisualizacaoPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState("");
  const [currentTires, setCurrentTires] = useState<Record<string, Tire>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isInstallDialogOpen, setIsInstallDialogOpen] = useState(false);
  const [installPosition, setInstallPosition] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "vehicles"), (snapshot) => {
        const vehiclesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
        setVehicles(vehiclesData);
        if (vehiclesData.length > 0 && !selectedVehicle) {
            setSelectedVehicle(vehiclesData[0].id);
        } else if (vehiclesData.length === 0) {
            setIsLoading(false);
        }
    });
    return () => unsubscribe();
  }, [selectedVehicle]);

  useEffect(() => {
    if (!selectedVehicle) {
        setCurrentTires({});
        return;
    };

    setIsLoading(true);
    const q = query(collection(db, "pneus"), where("vehicleId", "==", selectedVehicle));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const tiresData: Record<string, Tire> = {};
        snapshot.forEach(doc => {
            const tire = { id: doc.id, ...doc.data() } as Tire;
            if (tire.position) {
                tiresData[tire.position] = tire;
            }
        });
        setCurrentTires(tiresData);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [selectedVehicle]);

  const handleTireAction = async (action: string, position: string, tireId?: string) => {
    if (action === 'retirar' && tireId) {
        try {
            const tireRef = doc(db, 'pneus', tireId);
            await updateDoc(tireRef, {
                status: 'Em Estoque',
                vehicleId: '',
                position: '',
            });
            const newTires = { ...currentTires };
            delete newTires[position];
            setCurrentTires(newTires);
            toast({ title: "Pneu Retirado!", description: `O pneu foi movido para o estoque.` });
        } catch (error) {
            toast({ variant: 'destructive', title: "Erro", description: "Não foi possível retirar o pneu." });
        }
    } else if (action === 'instalar') {
        setInstallPosition(position);
        setIsInstallDialogOpen(true);
    }
  };
  
  const handleInstallTire = (tire: Tire) => {
      setCurrentTires(prev => ({ ...prev, [installPosition]: { ...tire, vehicleId: selectedVehicle, position: installPosition, status: 'Em Uso' } as Tire }));
  }

  const handleInspectionUpdate = (position: string, updates: Partial<Tire>) => {
      setCurrentTires(prev => ({
          ...prev,
          [position]: { ...prev[position], ...updates } as Tire,
      }));
  }
  
  const handleTireSwap = (position: string, newTire: Tire) => {
      setCurrentTires(prev => ({
          ...prev,
          [position]: newTire,
      }));
  }

  const tirePositions = {
      dianteiro: ["DDE", "DDD"],
      traseiro1: ["T1EI", "T1EE", "T1DI", "T1DE"],
      traseiro2: ["T2EI", "T2EE", "T2DI", "T2DE"]
  }

  return (
    <>
      <InstallTireDialog 
        open={isInstallDialogOpen} 
        onOpenChange={setIsInstallDialogOpen} 
        onInstall={handleInstallTire} 
        position={installPosition}
        vehicleId={selectedVehicle} 
      />
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Visualização de Pneus por Veículo"
          description="Visualize e gerencie a disposição dos pneus em cada veículo da frota."
        />
        <Card>
          <CardHeader>
            <CardTitle>Selecione um Veículo</CardTitle>
            <CardDescription>Escolha o veículo para ver o layout dos pneus.</CardDescription>
            <div className="pt-2">
              <Select onValueChange={setSelectedVehicle} value={selectedVehicle}>
                  <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Selecione a placa" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map(v => <SelectItem key={v.id} value={v.id}>{v.plate} - {v.model}</SelectItem>)}
                  </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
                <Skeleton className="h-96 w-full" />
            ) : !selectedVehicle ? (
                <div className="h-96 w-full flex items-center justify-center text-muted-foreground">
                    <p>Selecione um veículo para começar.</p>
                </div>
            ) : (
            <div className="bg-muted/30 p-4 rounded-lg border-2 border-dashed flex flex-col items-center gap-8">
              {/* Eixo Dianteiro */}
              <div className="flex justify-between w-full max-w-sm">
                {tirePositions.dianteiro.map(pos => (
                    <TirePosition key={pos} position={pos} tireData={currentTires[pos]} vehicleId={selectedVehicle} onAction={handleTireAction} onInspect={handleInspectionUpdate} onSwap={handleTireSwap} />
                ))}
              </div>

              {/* Traseira do Cavalo */}
              <div className="w-full border-t-2 border-dashed pt-8">
                  <p className="text-center text-sm font-semibold text-muted-foreground mb-4">Eixos Traseiros (Cavalo)</p>
                  {/* Primeiro Eixo Traseiro */}
                  <div className="flex justify-between w-full max-w-lg mx-auto">
                      <TirePosition key={"T1EI"} position="T1EI" tireData={currentTires["T1EI"]} vehicleId={selectedVehicle} onAction={handleTireAction} onInspect={handleInspectionUpdate} onSwap={handleTireSwap} />
                      <TirePosition key={"T1EE"} position="T1EE" tireData={currentTires["T1EE"]} vehicleId={selectedVehicle} onAction={handleTireAction} onInspect={handleInspectionUpdate} onSwap={handleTireSwap} />
                      <div className="w-24" /> {/* Espaço central */}
                      <TirePosition key={"T1DI"} position="T1DI" tireData={currentTires["T1DI"]} vehicleId={selectedVehicle} onAction={handleTireAction} onInspect={handleInspectionUpdate} onSwap={handleTireSwap} />
                      <TirePosition key={"T1DE"} position="T1DE" tireData={currentTires["T1DE"]} vehicleId={selectedVehicle} onAction={handleTireAction} onInspect={handleInspectionUpdate} onSwap={handleTireSwap} />
                  </div>
                  {/* Segundo Eixo Traseiro */}
                  <div className="flex justify-between w-full max-w-lg mx-auto mt-4">
                      <TirePosition key={"T2EI"} position="T2EI" tireData={currentTires["T2EI"]} vehicleId={selectedVehicle} onAction={handleTireAction} onInspect={handleInspectionUpdate} onSwap={handleTireSwap} />
                      <TirePosition key={"T2EE"} position="T2EE" tireData={currentTires["T2EE"]} vehicleId={selectedVehicle} onAction={handleTireAction} onInspect={handleInspectionUpdate} onSwap={handleTireSwap} />
                      <div className="w-24" /> {/* Espaço central */}
                      <TirePosition key={"T2DI"} position="T2DI" tireData={currentTires["T2DI"]} vehicleId={selectedVehicle} onAction={handleTireAction} onInspect={handleInspectionUpdate} onSwap={handleTireSwap} />
                      <TirePosition key={"T2DE"} position="T2DE" tireData={currentTires["T2DE"]} vehicleId={selectedVehicle} onAction={handleTireAction} onInspect={handleInspectionUpdate} onSwap={handleTireSwap} />
                  </div>
              </div>
              <div className="w-full text-center text-xs text-muted-foreground pt-4">
                  <p>DDE: Dianteiro Direito Externo | DDD: Dianteiro Esquerdo Externo</p>
                  <p>T1/T2: Eixo Traseiro 1/2 | E/D: Esquerdo/Direito | I/E: Interno/Externo</p>
              </div>
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
