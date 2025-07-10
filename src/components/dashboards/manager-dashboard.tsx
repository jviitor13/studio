"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Clock, AlertTriangle, UserX, PlusCircle } from "lucide-react";

const barChartData = [
  { month: "Janeiro", emUso: 186, manutencao: 80 },
  { month: "Fevereiro", emUso: 305, manutencao: 200 },
  { month: "Março", emUso: 237, manutencao: 120 },
  { month: "Abril", emUso: 273, manutencao: 190 },
  { month: "Maio", emUso: 209, manutencao: 130 },
  { month: "Junho", emUso: 214, manutencao: 140 },
];

const barChartConfig = {
  emUso: {
    label: "Em Uso",
    color: "hsl(var(--primary))",
  },
  manutencao: {
    label: "Manutenção",
    color: "hsl(var(--destructive))",
  },
} satisfies ChartConfig;

const pieChartData = [
  { name: 'Em Operação', value: 45, fill: 'var(--color-emOperacao)' },
  { name: 'Em Manutenção', value: 3, fill: 'var(--color-emManutencao)' },
  { name: 'Disponíveis', value: 2, fill: 'var(--color-disponiveis)' },
];

const pieChartConfig = {
  value: {
    label: 'Veículos',
  },
  emOperacao: {
    label: 'Em Operação',
    color: 'hsl(var(--primary))',
  },
  emManutencao: {
    label: 'Em Manutenção',
    color: 'hsl(var(--destructive))',
  },
  disponiveis: {
    label: 'Disponíveis',
    color: 'hsl(var(--secondary))',
  },
} satisfies ChartConfig;


export function ManagerDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Frota Ativa</CardTitle>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-4 w-4 text-muted-foreground"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" /><path d="M15 18H9" /><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" /><circle cx="17" cy="18" r="2" /><circle cx="7" cy="18" r="2" /></svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45 / 50</div>
            <p className="text-xs text-muted-foreground">Veículos em operação</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Manutenção Vencida</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">3</div>
            <p className="text-xs text-muted-foreground">Veículos necessitam atenção</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Motoristas sem Checklist</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Nas últimas 24 horas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocorrências Recentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Na última semana</p>
          </CardContent>
        </Card>
      </div>
      <div className="flex items-center gap-4">
        <h2 className="text-xl font-headline font-semibold">Ações Rápidas</h2>
        <div className="flex-1 border-t"></div>
      </div>
      <div className="flex flex-wrap gap-4">
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Veículo
        </Button>
        <Button variant="secondary">
          <PlusCircle className="mr-2 h-4 w-4" /> Criar Escala
        </Button>
        <Button variant="secondary">
          <PlusCircle className="mr-2 h-4 w-4" /> Cadastrar Manutenção
        </Button>
        <Button variant="secondary">
            <PlusCircle className="mr-2 h-4 w-4" /> Cadastrar Usuário
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
         <Card>
            <CardHeader>
            <CardTitle className="font-headline">Uso da Frota nos Últimos 6 Meses</CardTitle>
            </CardHeader>
            <CardContent>
            <ChartContainer config={barChartConfig} className="h-[300px] w-full">
                <BarChart accessibilityLayer data={barChartData} margin={{ top: 20 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="month"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                />
                <YAxis />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
                <Bar dataKey="emUso" fill="var(--color-emUso)" radius={4} />
                <Bar dataKey="manutencao" fill="var(--color-manutencao)" radius={4} />
                </BarChart>
            </ChartContainer>
            </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Status Atual da Frota</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ChartContainer config={pieChartConfig} className="h-[300px] w-full">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={pieChartData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2} labelLine={false} label={({
                      payload,
                      ...props
                    }) => {
                      return (
                        <text
                          cx={props.cx}
                          cy={props.cy}
                          x={props.x}
                          y={props.y}
                          textAnchor={props.textAnchor}
                          dominantBaseline={props.dominantBaseline}
                          fill="hsl(var(--foreground))"
                          className="text-sm"
                        >
                          {payload.value}
                        </text>
                      )
                    }}>
                   {pieChartData.map((entry) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                    ))}
                </Pie>
                <ChartLegend
                  content={<ChartLegendContent nameKey="name" />}
                  verticalAlign="bottom"
                  align="center"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
