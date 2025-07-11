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
import { CalendarIcon, Download, Search, FileText } from "lucide-react"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ChecklistDetailsDialog } from "@/components/checklist-details-dialog"
import type { ChecklistTemplate } from "@/lib/checklist-templates-data"
import { useToast } from "@/hooks/use-toast"
import { generateChecklistPdf } from "@/lib/pdf-generator"
import { CompletedChecklist } from "@/lib/types"

const mockChecklists: CompletedChecklist[] = [
    { 
        id: 'CHK-005',
        date: '2024-07-30',
        vehicle: 'RDO4D56', 
        driver: 'Ana Costa', 
        type: 'manutencao', 
        status: 'Pendente', 
        name: 'Checklist Técnico Cavalo Mecânico', 
        category: 'cavalo_mecanico', 
        questions: [
            { id: 'ext-1', text: 'Pintura e lataria (avarias)', photoRequirement: 'if_not_ok', status: 'Não OK', photo: 'https://placehold.co/600x400.png', observation: 'Arranhão profundo na porta do passageiro.'},
            { id: 'ext-5', text: 'Faróis, setas e lanternas', photoRequirement: 'if_not_ok', status: 'OK' },
            { id: 'ext-6', text: 'Pneus (calibragem e desgaste)', photoRequirement: 'always', status: 'Não OK', photo: 'https://placehold.co/400x600.png', observation: 'Pneu dianteiro direito com baixo relevo, precisa de troca.' },
            { id: 'ext-7', text: 'Placas de identificação', photoRequirement: 'always', status: 'OK', photo: 'https://placehold.co/600x300.png' },
            { id: 'equip-4', text: 'Extintor de incêndio (validade e carga)', photoRequirement: 'always', status: 'OK', photo: 'https://placehold.co/300x400.png' },
            { id: 'sec-1', text: 'Freios (de serviço e estacionário)', photoRequirement: 'if_not_ok', status: 'OK' },
            { id: 'sit-3', text: 'Tacógrafo (disco e aferição)', photoRequirement: 'always', status: 'Não OK', photo: 'https://placehold.co/500x500.png', observation: 'Disco do tacógrafo vencido.' },
        ] 
    },
    { id: 'CHK-001', date: '2024-07-29', vehicle: 'RDO1A12', driver: 'João Silva', type: 'viagem', status: 'OK', name: 'Vistoria de Saída', category: 'cavalo_mecanico', questions: [{id: 'q1', text: 'Pneus', photoRequirement: 'always', status: 'OK', photo: 'https://placehold.co/600x400.png'}] },
    { id: 'CHK-002', date: '2024-07-29', vehicle: 'RDO2C24', driver: 'Maria Oliveira', type: 'manutencao', status: 'Pendente', name: 'Checklist Técnico Cavalo Mecânico', category: 'cavalo_mecanico', questions: [{id: 'q2', text: 'Freios', photoRequirement: 'if_not_ok', status: 'Não OK', photo: 'https://placehold.co/600x400.png', observation: 'Pastilha gasta.'}] },
    { id: 'CHK-003', date: '2024-07-28', vehicle: 'RDO3B45', driver: 'Carlos Pereira', type: 'retorno', status: 'OK', name: 'Vistoria de Retorno', category: 'carreta', questions: [] },
    { id: 'CHK-004', date: '2024-07-27', vehicle: 'RDO1A12', driver: 'João Silva', type: 'viagem', status: 'Pendente', name: 'Vistoria de Saída', category: 'cavalo_mecanico', questions: [] },
];

const statusVariant : {[key:string]: "default" | "destructive" | "secondary"} = {
    'OK': 'default',
    'Pendente': 'destructive',
}

const statusBadgeColor : {[key:string]: string} = {
    'OK': 'bg-green-500 hover:bg-green-600',
    'Pendente': ''
}


export default function ConsultasPage() {
    const [date, setDate] = React.useState<DateRange | undefined>()
    const [selectedChecklist, setSelectedChecklist] = React.useState<CompletedChecklist | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
    const { toast } = useToast()

    const handleViewDetails = (checklist: CompletedChecklist) => {
        setSelectedChecklist(checklist)
        setIsDetailsOpen(true)
    }

    const handleExport = (checklist: CompletedChecklist) => {
        toast({
            title: "Exportação Iniciada",
            description: `O checklist ${checklist.id} está sendo preparado.`,
        });
        generateChecklistPdf(checklist);
    }

    return (
        <>
            <ChecklistDetailsDialog 
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                checklist={selectedChecklist}
            />
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
                                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(item)}><FileText className="mr-2 h-4 w-4"/>Ver Detalhes</Button>
                                            <Button variant="secondary" size="sm" onClick={() => handleExport(item)}><Download className="mr-2 h-4 w-4"/>Exportar</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}
