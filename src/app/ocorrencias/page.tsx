"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";

export default function OcorrenciasPage() {
  return (
    <div className="flex flex-col gap-6">
       <PageHeader
        title="Ocorrências"
        description="Registre e acompanhe incidentes e avarias."
      >
        <Button>
          <PlusCircle className="mr-2" />
          Registrar Ocorrência
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Minhas Ocorrências</CardTitle>
          <CardDescription>
            Aqui você pode visualizar as ocorrências que registrou.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10">
            <p className="text-muted-foreground">Nenhuma ocorrência registrada ainda.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
