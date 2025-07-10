"use client";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadCloud, FileText } from "lucide-react";

export default function DocumentosPage() {
  return (
    <div className="flex flex-col gap-6">
       <PageHeader
        title="Documentos"
        description="Acesse seus documentos e os do veículo."
      >
        <Button variant="outline">
          <UploadCloud className="mr-2" />
          Enviar Documento
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Meus Documentos</CardTitle>
          <CardDescription>
            Documentos importantes para a sua jornada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-center justify-between p-3 rounded-md border">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary"/>
                <span className="font-medium">CNH_Joao_Silva.pdf</span>
              </div>
              <Button variant="ghost" size="sm">Baixar</Button>
            </li>
             <li className="flex items-center justify-between p-3 rounded-md border">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-primary"/>
                <span className="font-medium">CRLV_RDO1A12.pdf</span>
              </div>
              <Button variant="ghost" size="sm">Baixar</Button>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
