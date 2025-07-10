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
import { TrendingUp, Wrench, AlertCircle, Clock, DollarSign } from 'lucide-react';
import { ChartConfig } from '@/components/ui/chart';

const fleetChartData = [
  { status: 'Em Viagem', value: 12, fill: 'var(--color-emViagem)' },
  { status: 'Disponível', value: 8, fill: 'var(--color-disponivel)' },
  { status: 'Em Manutenção', value: 3, fill: 'var(--color-manutencao)' },
];

const fleetChartConfig = {
  value: {
    label: 'Veículos',
  },
  emViagem: {
    label: 'Em Viagem',
    color: 'hsl(var(--chart-1))',
  },
  disponivel: {
    label: 'Disponível',
    color: 'hsl(var(--chart-2))',
  },
  manutencao: {
    label: 'Em Manutenção',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig;

const checklistProblemsData = [
    { problem: 'Pneus', count: 15, fill: 'var(--color-pneus)' },
    { problem: 'Freios', count: 8, fill: 'var(--color-freios)' },
    { problem: 'Motor', count: 5, fill: 'var(--color-motor)' },
    { problem: 'Elétrica', count: 12, fill: 'var(--color-eletrica)' },
    { problem: 'Outros', count: 3, fill: 'var(--color-outros)' },
];

const checklistProblemsConfig = {
    count: { label: 'Ocorrências' },
    pneus: { label: 'Pneus', color: 'hsl(var(--chart-1))' },
    freios: { label: 'Freios', color: 'hsl(var(--chart-2))' },
    motor: { label: 'Motor', color: 'hsl(var(--chart-3))' },
    eletrica: { label: 'Elétrica', color: 'hsl(var(--chart-4))' },
    outros: { label: 'Outros', color: 'hsl(var(--chart-5))' },
} satisfies ChartConfig;

const maintenanceData = [
    { vehicle: 'RDO1A12', model: 'Scania R450', service: 'Troca de óleo', downSince: '2024-07-26', eta: '2024-07-29', days: 3 },
    { vehicle: 'RDO3B45', model: 'Volvo FH 540', service: 'Reparo no freio', downSince: '2024-07-28', eta: '2024-07-30', days: 1 },
];


export function ManagerDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-headline font-semibold">Painel do Gestor</h1>
          <p className="text-muted-foreground">Visão geral da frota e operações.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Veículos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">+2.1% desde o último mês</p>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Perdido (Mês)</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98 horas</div>
            <p className="text-xs text-muted-foreground">Total de veículos em manutenção</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Médio/Dia (Parado)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 350,00</div>
            <p className="text-xs text-muted-foreground">Média por veículo em manutenção</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">Requerem atenção imediata</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-headline">Status da Frota</CardTitle>
            <CardDescription>Distribuição dos veículos por status atual.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ChartContainer config={fleetChartConfig} className="mx-auto aspect-square h-[250px]">
                <PieChart>
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                        data={fleetChartData}
                        dataKey="value"
                        nameKey="status"
                        innerRadius={60}
                        strokeWidth={5}
                    >
                    {fleetChartData.map((entry) => (
                        <Cell key={`cell-${entry.status}`} fill={entry.fill} className="focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" />
                    ))}
                    </Pie>
                    <ChartLegend content={<ChartLegendContent nameKey="status" />} />
                </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Principais Problemas (Checklists)</CardTitle>
            <CardDescription>Ocorrências mais comuns nos últimos 30 dias.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={checklistProblemsConfig} className="h-[250px] w-full">
                <BarChart data={checklistProblemsData} layout="vertical" margin={{ left: 10, right: 10 }}>
                    <CartesianGrid horizontal={false} />
                    <YAxis dataKey="problem" type="category" tickLine={false} axisLine={false} tickMargin={10} width={60}/>
                    <XAxis type="number" dataKey="count" hide />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                    <Bar dataKey="count" radius={5}>
                         {checklistProblemsData.map((entry) => (
                            <Cell key={`cell-${entry.problem}`} fill={entry.fill} />
                        ))}
                    </Bar>
                </BarChart>
             </ChartContainer>
          </CardContent>
        </Card>
      </div>

       <Card>
        <CardHeader>
          <CardTitle className="font-headline">Veículos em Manutenção</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Veículo</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Serviço</TableHead>
                <TableHead>Parado Desde</TableHead>
                <TableHead>Dias Parado</TableHead>
                <TableHead>Previsão de Retorno</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenanceData.map((item) => (
                <TableRow key={item.vehicle}>
                  <TableCell className="font-medium">{item.vehicle}</TableCell>
                  <TableCell>{item.model}</TableCell>
                  <TableCell>{item.service}</TableCell>
                  <TableCell>{item.downSince}</TableCell>
                  <TableCell>
                    <Badge variant="destructive">{item.days} dias</Badge>
                  </TableCell>
                   <TableCell>{item.eta}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
