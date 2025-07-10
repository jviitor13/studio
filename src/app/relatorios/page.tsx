"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";

const reports = [
    { title: "Relatório Mensal de Custos - Julho 2024", category: "Financeiro", date: "2024-08-01" },
    { title: "Relatório de Performance da Frota - Q2 2024", category: "Operacional", date: "2024-07-15" },
    { title: "Consumo de Combustível por Veículo - Julho 2024", category: "Operacional", date: "2024-08-02" },
    { title: "Relatório de Ocorrências - Julho 2024", category: "Segurança", date: "2024-08-01" },
]

export default function RelatoriosPage() {
  return (
    <div className="flex flex-col gap-6">
       <PageHeader
        title="Relatórios"
        description="Gere e baixe relatórios operacionais e financeiros."
      />
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Disponíveis</CardTitle>
          <CardDescription>
            Aqui estão os relatórios gerados recentemente.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <ul className="space-y-3">
            {reports.map((report, index) => (
                <li key={index} className="flex items-center justify-between p-4 rounded-md border bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                        <FileText className="h-6 w-6 text-primary" />
                        <div>
                            <p className="font-semibold">{report.title}</p>
                            <p className="text-sm text-muted-foreground">{report.category} - Gerado em {report.date}</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Baixar
                    </Button>
                </li>
            ))}
           </ul>
        </CardContent>
      </Card>
    </div>
  );
}
