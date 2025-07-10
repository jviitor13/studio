"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import * as React from "react";

export default function EscalasPage() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <div className="flex flex-col gap-6">
       <PageHeader
        title="Escalas de Trabalho"
        description="Visualize e gerencie as escalas dos motoristas."
      >
        <Button>
          <PlusCircle className="mr-2" />
          Criar Nova Escala
        </Button>
      </PageHeader>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
           <Card>
                <CardHeader>
                <CardTitle>Calendário de Escalas</CardTitle>
                <CardDescription>
                    Selecione um dia para ver os motoristas escalados.
                </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md border"
                    />
                </CardContent>
            </Card>
        </div>
        <div>
            <Card>
                <CardHeader>
                    <CardTitle>Motoristas Escalados</CardTitle>
                    <CardDescription>
                       {date ? date.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Selecione uma data"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        <li className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span>João Silva - Turno 1 (06:00 - 14:00)</span>
                        </li>
                         <li className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                            <span>Maria Oliveira - Turno 2 (14:00 - 22:00)</span>
                        </li>
                         <li className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            <span>Ana Costa - Folga</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
