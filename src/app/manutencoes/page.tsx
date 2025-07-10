"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function ManutencoesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-headline font-semibold">Manutenções</h1>
            <p className="text-muted-foreground">Acompanhe as manutenções da frota.</p>
        </div>
        <Button>
            <PlusCircle className="mr-2" />
            Agendar Manutenção
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Agenda de Manutenções</CardTitle>
          <CardDescription>
            Esta é uma página de exemplo para o agendamento de manutenções. O conteúdo será adicionado aqui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Em breve: Calendário de manutenções, lista de serviços pendentes e histórico por veículo.</p>
        </CardContent>
      </Card>
    </div>
  );
}
