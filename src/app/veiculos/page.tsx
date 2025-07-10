"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function VeiculosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-headline font-semibold">Frota de Veículos</h1>
            <p className="text-muted-foreground">Gerencie os veículos da sua frota.</p>
        </div>
        <Button>
            <PlusCircle className="mr-2" />
            Adicionar Veículo
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Veículos</CardTitle>
          <CardDescription>
            Esta é uma página de exemplo para a gestão de veículos. O conteúdo será adicionado aqui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Em breve: Tabela com todos os veículos, status, motorista atual e próxima manutenção.</p>
        </CardContent>
      </Card>
    </div>
  );
}
