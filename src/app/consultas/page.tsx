
"use client"

import * as React from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DateRange } from "react-day-picker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Download, Search, Send, FileText } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const mockChecklists = [
    { id: 'CHK-001', date: '2024-07-29', vehicle: 'RDO1A12', driver: 'João Silva', type: 'Viagem', status: 'OK' },
    { id: 'CHK-002', date: '2024-07-29', vehicle: 'RDO2C24', driver: 'Maria Oliveira', type: 'Manutenção', status: 'Pendente' },
    { id: 'CHK-003', date: '2024-07-28', vehicle: 'RDO3B45', driver: 'Carlos Pereira', type: 'Retorno', status: 'OK' },
    { id: 'CHK-004', date: '2024-07-27', vehicle: 'RDO1A12', driver: 'João Silva', type: 'Viagem', status: 'Pendente' },
];

const statusVariant : {[key:string]: "default" | "destructive"} = {
    'OK': 'default',
    'Pendente': 'destructive'
}

const statusBadgeColor : {[key:string]: string} = {
    'OK': 'bg-green-500 hover:bg-green-600',
    'Pendente': ''
}


export default function ConsultasPage() {
    const [date, setDate] = React.useState<DateRange | undefined>()

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Consultar Checklists"
                description="Filtre e visualize os checklists realizados."
            />
            <Card>
                <CardHeader>
                    <CardTitle>Filtros de Busca</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="date-range">Período</Label>
                             <Popover>
                                <PopoverTrigger asChild>
                                <Button
                                    id="date-range"
                                    variant={"outline"}
                                    className={cn(
                                    "justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                    date.to ? (
                                        <>
                                        {format(date.from, "LLL dd, y")} -{" "}
                                        {format(date.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(date.from, "LLL dd, y")
                                    )
                                    ) : (
                                    <span>Selecione o período</span>
                                    )}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
                                />
                                </PopoverContent>
                            </Popover>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="type">Tipo de Checklist</Label>
                            <Select>
                                <SelectTrigger id="type">
                                    <SelectValue placeholder="Todos os tipos" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="viagem">Viagem</SelectItem>
                                    <SelectItem value="retorno">Retorno</SelectItem>
                                    <SelectItem value="manutencao">Manutenção</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="plate">Placa do Veículo</Label>
                            <Input id="plate" placeholder="Ex: RDO1A12" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                             <Select>
                                <SelectTrigger id="status">
                                    <SelectValue placeholder="Todos os status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ok">OK</SelectItem>
                                    <SelectItem value="nok">Com Pendências</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <Button>
                            <Search className="mr-2 h-4 w-4"/>
                            Buscar
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Resultados</CardTitle>
                    <CardDescription>
                        Foram encontrados {mockChecklists.length} checklists.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Veículo</TableHead>
                                <TableHead>Responsável</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {mockChecklists.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell>{item.date}</TableCell>
                                    <TableCell className="font-medium">{item.vehicle}</TableCell>
                                    <TableCell>{item.driver}</TableCell>
                                    <TableCell>{item.type}</TableCell>
                                    <TableCell>
                                        <Badge variant={statusVariant[item.status]} className={cn(statusBadgeColor[item.status])}>
                                            {item.status === 'OK' ? 'Concluído' : 'Com Pendências'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="outline" size="sm"><FileText className="mr-2 h-4 w-4"/>Ver Detalhes</Button>
                                        <Button variant="secondary" size="sm"><Download className="mr-2 h-4 w-4"/>Exportar</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
