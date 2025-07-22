
"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Grip, Repeat, Trash2, PlusCircle, Thermometer, Gauge } from 'lucide-react';

// Mock data
const vehicleTireData: Record<string, Record<string, any>> = {
  "RDO1A12": {
    "DDE": { id: "PNEU-001", brand: "Michelin", model: "X Multi Z", pressure: "120 psi", depth: "10mm" },
    "DDD": { id: "PNEU-002", brand: "Pirelli", model: "FR:01", pressure: "121 psi", depth: "11mm" },
    "T1EI": { id: "PNEU-011", brand: "Goodyear", model: "KMax D", pressure: "110 psi", depth: "8mm" },
    "T1EE": { id: "PNEU-012", brand: "Goodyear", model: "KMax D", pressure: "110 psi", depth: "8mm" },
    "T1DI": { id: "PNEU-013", brand: "Goodyear", model: "KMax D", pressure: "110 psi", depth: "9mm" },
    "T1DE": { id: "PNEU-014", brand: "Goodyear", model: "KMax D", pressure: "110 psi", depth: "9mm" },
    "T2EI": { id: "PNEU-021", brand: "Bridgestone", model: "R268", pressure: "109 psi", depth: "7mm" },
    "T2EE": { id: "PNEU-022", brand: "Bridgestone", model: "R268", pressure: "109 psi", depth: "7mm" },
    "T2DI": { id: "PNEU-023", brand: "Bridgestone", model: "R268", pressure: "111 psi", depth: "8mm" },
    "T2DE": { id: "PNEU-024", brand: "Bridgestone", model: "R268", pressure: "111 psi", depth: "8mm" },
  },
  "RDO2C24": {
    "DDE": { id: "PNEU-004", brand: "Michelin", model: "X Multi Z", pressure: "122 psi", depth: "12mm" },
    "DDD": { id: "PNEU-008", brand: "Pirelli", model: "FR:01", pressure: "122 psi", depth: "12mm" },
    "T1EI": { id: "PNEU-031", brand: "Goodyear", model: "KMax D", pressure: "115 psi", depth: "10mm" },
    "T1EE": { id: "PNEU-032", brand: "Goodyear", model: "KMax D", pressure: "115 psi", depth: "10mm" },
    "T1DI": { id: "PNEU-033", brand: "Goodyear", model: "KMax D", pressure: "114 psi", depth: "10mm" },
    "T1DE": { id: "PNEU-034", brand: "Goodyear", model: "KMax D", pressure: "114 psi", depth: "10mm" },
  }
};

const TirePosition = ({ position, tireData }: { position: string, tireData?: any }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant={tireData ? "outline" : "secondary"} className="w-20 h-28 flex flex-col items-center justify-center border-2 border-dashed hover:border-primary transition-colors">
          <Grip className="h-6 w-6" />
          <span className="text-xs mt-1">{position}</span>
           {tireData && <span className="text-[10px] mt-1 font-bold text-primary truncate">{tireData.id}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        {tireData ? (
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Pneu: {tireData.id}</h4>
              <p className="text-sm text-muted-foreground">{tireData.brand} {tireData.model}</p>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <p className="font-semibold">{tireData.pressure}</p>
                        <p className="text-xs text-muted-foreground">Pressão</p>
                    </div>
                </div>
                 <div className="flex items-center gap-2">
                    <Thermometer className="h-4 w-4 text-muted-foreground" />
                    <div>
                        <p className="font-semibold">{tireData.depth}</p>
                        <p className="text-xs text-muted-foreground">Sulco</p>
                    </div>
                </div>
            </div>
            <Separator />
             <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline">Inspecionar</Button>
                <Button size="sm" variant="outline"><Repeat className="mr-2 h-4 w-4" />Trocar Pneu</Button>
                <Button size="sm" variant="destructive"><Trash2 className="mr-2 h-4 w-4" />Retirar Pneu</Button>
             </div>
          </div>
        ) : (
             <div className="space-y-2 text-center">
                <p className="font-medium">Posição Vazia</p>
                <p className="text-sm text-muted-foreground">{position}</p>
                <Button size="sm" className="mt-2"><PlusCircle className="mr-2 h-4 w-4" />Instalar Pneu</Button>
             </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default function PneusVisualizacaoPage() {
  const [selectedVehicle, setSelectedVehicle] = useState("RDO1A12");
  const currentTires = vehicleTireData[selectedVehicle] || {};

  return (
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
            <Select onValueChange={setSelectedVehicle} defaultValue={selectedVehicle}>
                <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Selecione a placa" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="RDO1A12">RDO1A12 - Scania R450</SelectItem>
                <SelectItem value="RDO2C24">RDO2C24 - MB Actros</SelectItem>
                <SelectItem value="RDO3B45">RDO3B45 - Volvo FH 540</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/30 p-4 rounded-lg border-2 border-dashed flex flex-col items-center gap-8">
            {/* Eixo Dianteiro */}
            <div className="flex justify-between w-full max-w-sm">
              <TirePosition position="DDE" tireData={currentTires["DDE"]} />
              <TirePosition position="DDD" tireData={currentTires["DDD"]} />
            </div>

            {/* Traseira do Cavalo */}
            <div className="w-full border-t-2 border-dashed pt-8">
                <p className="text-center text-sm font-semibold text-muted-foreground mb-4">Eixos Traseiros (Cavalo)</p>
                {/* Primeiro Eixo Traseiro */}
                <div className="flex justify-between w-full max-w-lg mx-auto">
                    <TirePosition position="T1EI" tireData={currentTires["T1EI"]} />
                    <TirePosition position="T1EE" tireData={currentTires["T1EE"]} />
                    <div className="w-24" /> {/* Espaço central */}
                    <TirePosition position="T1DI" tireData={currentTires["T1DI"]} />
                    <TirePosition position="T1DE" tireData={currentTires["T1DE"]} />
                </div>
                 {/* Segundo Eixo Traseiro */}
                <div className="flex justify-between w-full max-w-lg mx-auto mt-4">
                    <TirePosition position="T2EI" tireData={currentTires["T2EI"]} />
                    <TirePosition position="T2EE" tireData={currentTires["T2EE"]} />
                     <div className="w-24" /> {/* Espaço central */}
                    <TirePosition position="T2DI" tireData={currentTires["T2DI"]} />
                    <TirePosition position="T2DE" tireData={currentTires["T2DE"]} />
                </div>
            </div>
             <div className="w-full text-center text-xs text-muted-foreground pt-4">
                <p>DDE: Dianteiro Direito Externo | DDD: Dianteiro Direito Direito</p>
                <p>T1/T2: Eixo Traseiro 1/2 | E/D: Esquerdo/Direito | I/E: Interno/Externo</p>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
