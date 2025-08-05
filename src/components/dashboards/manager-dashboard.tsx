
"use client";

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Pie, PieChart, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Truck, Clock, AlertCircle } from 'lucide-react';
import { ChartConfig } from '@/components/ui/chart';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, Timestamp } from 'firebase/firestore';
import { CompletedChecklist } from '@/lib/types';
import { differenceInHours } from 'date-fns';

// Mock data, in a real scenario this would come from Firestore.
interface Vehicle {
  id: string;
  model: string;
  driver: string;
  status: 'Em Viagem' | 'Disponível' | 'Em Manutenção';
  nextMaintenance: string;
}

interface Maintenance {
    id: string;
    status: "Agendada" | "Em Andamento" | "Concluída" | "Cancelada";
    cost?: number;
    startedAt?: Timestamp;
    completedAt?: Timestamp;
}


const fleetChartConfig = {
  value: {
    label: 'Veículos',
  },
  'Em Viagem': {
    label: 'Em Viagem',
    color: 'hsl(var(--chart-1))',
  },
  'Disponível': {
    label: 'Disponível',
    color: 'hsl(var(--chart-2))',
  },
  'Em Manutenção': {
    label: 'Em Manutenção',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig;

const checklistProblemsConfig = {
    count: { label: 'Ocorrências' },
    pneus: { label: 'Pneus', color: 'hsl(var(--chart-1))' },
    freios: { label: 'Freios', color: 'hsl(var(--chart-2))' },
    motor: { label: 'Motor', color: 'hsl(var(--chart-3))' },
    eletrica: { label: 'Elétrica', color: 'hsl(var(--chart-4))' },
    outros: { label: 'Outros', color: 'hsl(var(--chart-5))' },
} satisfies ChartConfig;


export function ManagerDashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [checklists, setChecklists] = useState<CompletedChecklist[]>([]);
  const [fleetStatus, setFleetStatus] = useState<{ status: string, value: number, fill: string }[]>([]);
  const [maintenanceVehicles, setMaintenanceVehicles] = useState<Vehicle[]>([]);
  const [problematicItems, setProblematicItems] = useState<{ problem: string, count: number, fill: string }[]>([]);
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [monthlyCost, setMonthlyCost] = useState(0);
  const [downtimeHours, setDowntimeHours] = useState(0);


  useEffect(() => {
    // Listener for 'vehicles' collection
    const unsubscribeVehicles = onSnapshot(collection(db, "vehicles"), (snapshot) => {
        const vehiclesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Vehicle));
        setVehicles(vehiclesData);

        const statusCounts = vehiclesData.reduce((acc, vehicle) => {
            acc[vehicle.status] = (acc[vehicle.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const chartData = Object.entries(statusCounts).map(([status, value]) => ({
            status,
            value,
            fill: fleetChartConfig[status as keyof typeof fleetChartConfig]?.color || 'hsl(var(--chart-3))'
        }));
        setFleetStatus(chartData);

        setMaintenanceVehicles(vehiclesData.filter(v => v.status === 'Em Manutenção'));
    });

    // Listener for 'completed-checklists' collection
    const unsubscribeChecklists = onSnapshot(collection(db, "completed-checklists"), (snapshot) => {
        const checklistsData = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              createdAt: data.createdAt.toDate().toISOString(),
            } as CompletedChecklist
        });
        setChecklists(checklistsData);
        setActiveAlerts(checklistsData.filter(c => c.status === 'Pendente').length);

        const problemCounts = checklistsData
            .filter(c => c.status === 'Pendente')
            .flatMap(c => c.questions)
            .filter(q => q.status === 'Não OK')
            .reduce((acc, q) => {
                // Normalize problem text to group similar items
                const problemKey = q.text.toLowerCase().trim();
                acc[problemKey] = (acc[problemKey] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
        
        const sortedProblems = Object.entries(problemCounts)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5) // Top 5 problems
            .map(([problem, count], index) => ({
                problem: problem.charAt(0).toUpperCase() + problem.slice(1), // Capitalize first letter
                count,
                fill: `hsl(var(--chart-${index + 1}))`
            }));
        setProblematicItems(sortedProblems);
    });
    
    // Listener for 'manutencoes' collection
    const unsubscribeMaintenances = onSnapshot(collection(db, 'manutencoes'), (snapshot) => {
        const maintenancesData = snapshot.docs.map(doc => doc.data() as Maintenance);
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const cost = maintenancesData.reduce((acc, m) => {
            if (m.status === 'Concluída' && m.cost && m.completedAt) {
                 const completedDate = m.completedAt.toDate();
                 if(completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear) {
                    return acc + m.cost;
                 }
            }
            return acc;
        }, 0);
        setMonthlyCost(cost);

        const downtime = maintenancesData.reduce((acc, m) => {
             if (m.status === 'Concluída' && m.startedAt && m.completedAt) {
                 const completedDate = m.completedAt.toDate();
                 if(completedDate.getMonth() === currentMonth && completedDate.getFullYear() === currentYear) {
                    const hours = differenceInHours(completedDate, m.startedAt.toDate());
                    return acc + hours;
                 }
            }
            return acc;
        }, 0);
        setDowntimeHours(downtime);
    });

    // Cleanup function to unsubscribe from listeners on component unmount
    return () => {
        unsubscribeVehicles();
        unsubscribeChecklists();
        unsubscribeMaintenances();
    };
  }, []);


  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-headline font-semibold">Painel do Gestor</h1>
        <p className="text-muted-foreground">Visão geral da frota e operações.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Veículos</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vehicles.length}</div>
            <p className="text-xs text-muted-foreground">{vehicles.length > 0 ? `${vehicles.length} veículos na frota` : 'Nenhum veículo cadastrado'}</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Perdido (Mês)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{downtimeHours} horas</div>
            <p className="text-xs text-muted-foreground">Total em manutenção</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Manutenção (Mês)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
            <p className="text-xs text-muted-foreground">Custos registrados no mês</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts}</div>
            <p className="text-xs text-muted-foreground">{activeAlerts > 0 ? 'Checklists com pendências' : 'Nenhum alerta no momento'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Status da Frota</CardTitle>
            <CardDescription>Distribuição dos veículos por status atual.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[250px]">
            {fleetStatus.length > 0 ? (
                <ChartContainer config={fleetChartConfig} className="mx-auto aspect-square h-full">
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={fleetStatus}
                            dataKey="value"
                            nameKey="status"
                            innerRadius={60}
                            strokeWidth={5}
                        >
                        {fleetStatus.map((entry) => (
                            <Cell key={`cell-${entry.status}`} fill={entry.fill} className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" />
                        ))}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent nameKey="status" />} />
                    </PieChart>
                </ChartContainer>
            ) : (
                <p className="text-muted-foreground">Nenhum dado de frota para exibir.</p>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Principais Problemas (Checklists)</CardTitle>
            <CardDescription>Ocorrências mais comuns nos últimos 30 dias.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center items-center h-[250px]">
             {problematicItems.length > 0 ? (
                <ChartContainer config={checklistProblemsConfig} className="h-full w-full">
                    <BarChart data={problematicItems} layout="vertical" margin={{ left: 10, right: 10, bottom: 5, top: 5 }}>
                        <CartesianGrid horizontal={false} />
                        <YAxis dataKey="problem" type="category" tickLine={false} axisLine={false} tickMargin={10} width={120} tick={{fontSize: 12}} />
                        <XAxis type="number" dataKey="count" hide />
                        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                        <Bar dataKey="count" radius={5}>
                            {problematicItems.map((entry) => (
                                <Cell key={`cell-${entry.problem}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
             ) : (
                <p className="text-muted-foreground">Nenhuma ocorrência registrada.</p>
             )}
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Veículos em Manutenção</CardTitle>
           <CardDescription>Veículos que estão atualmente parados para reparos.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Veículo</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Motorista</TableHead>
                <TableHead>Próxima Manutenção</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenanceVehicles.length > 0 ? (
                maintenanceVehicles.map((item) => (
                    <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell>{item.model}</TableCell>
                    <TableCell>{item.driver}</TableCell>
                    <TableCell>{item.nextMaintenance}</TableCell>
                    <TableCell>
                        <Badge variant="destructive">{item.status}</Badge>
                    </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        Nenhum veículo em manutenção.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
