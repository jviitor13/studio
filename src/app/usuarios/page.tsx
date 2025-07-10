"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function UsuariosPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-headline font-semibold">Usuários</h1>
            <p className="text-muted-foreground">Gerencie os usuários do sistema.</p>
        </div>
        <Button>
            <PlusCircle className="mr-2" />
            Adicionar Usuário
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Esta é uma página de exemplo para a gestão de usuários. O conteúdo será adicionado aqui.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>Em breve: Tabela com todos os usuários, papéis (gestor, motorista, mecânico) e status.</p>
        </CardContent>
      </Card>
    </div>
  );
}
