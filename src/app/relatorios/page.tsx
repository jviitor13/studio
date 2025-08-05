
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, PlusCircle, Calendar as CalendarIcon, MoreHorizontal, Sheet as SheetIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format, startOfDay, endOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportToExcel, generateReportPdf } from "@/lib/report-generator";
import { Report } from "@/lib/types";
import { collection, getDocs, query, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";


export default function RelatoriosPage() {
    const { toast } = useToast();
    const [reports, setReports] = React.useState<Report[]>([]);
    const [open, setOpen] = React.useState(false);
    const [isGenerating, setIsGenerating] = React.useState(false);

    const [date, setDate] = React.useState<DateRange | undefined>();
    const [reportType, setReportType] = React.useState('');

    const fetchCostReportData = async (from: Date, to: Date) => {
        const maintenancesRef = collection(db, 'manutencoes');
        const q = query(
            maintenancesRef,
            where('status', '==', 'Concluída'),
            where('completedAt', '>=', Timestamp.fromDate(startOfDay(from))),
            where('completedAt', '<=', Timestamp.fromDate(endOfDay(to)))
        );

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => {
            const docData = doc.data();
            return {
                Veículo: docData.vehicleId,
                Serviço: docData.serviceType,
                'Data Conclusão': format(docData.completedAt.toDate(), 'dd/MM/yyyy'),
                Custo: docData.cost || 0,
            };
        });
        
        const totalCost = data.reduce((acc, item) => acc + item.Custo, 0);

        return { data, summary: { totalCost } };
    };

    const fetchIncidentsReportData = async (from: Date, to: Date) => {
        const checklistsRef = collection(db, 'completed-checklists');
        const q = query(
            checklistsRef,
            where('status', '==', 'Pendente'),
            where('createdAt', '>=', Timestamp.fromDate(startOfDay(from))),
            where('createdAt', '<=', Timestamp.fromDate(endOfDay(to)))
        );

        const querySnapshot = await getDocs(q);
        const incidents = querySnapshot.docs.flatMap(doc => {
            const checklistData = doc.data();
            return checklistData.questions
                .filter((q: any) => q.status === 'Não OK')
                .map((q: any) => ({
                    Veículo: checklistData.vehicle,
                    Motorista: checklistData.driver,
                    Data: format(checklistData.createdAt.toDate(), 'dd/MM/yyyy'),
                    'Item com Problema': q.text,
                    Observação: q.observation || 'N/A',
                }));
        });
        return { data: incidents };
    };

    const handleGenerateReport = async () => {
        if (!reportType) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Por favor, selecione um tipo de relatório.' });
            return;
        }
        if (!date || !date.from || !date.to) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Por favor, selecione um período completo.' });
            return;
        }

        setIsGenerating(true);
        toast({ title: "Gerando relatório...", description: "Buscando e processando os dados." });
        
        try {
            let reportData;
            let reportSummary;

            if (reportType === 'Custos') {
                const { data, summary } = await fetchCostReportData(date.from, date.to);
                reportData = data;
                reportSummary = summary;
            } else if (reportType === 'Ocorrências') {
                const { data } = await fetchIncidentsReportData(date.from, date.to);
                reportData = data;
            }
             else {
                // Placeholder for other reports
                reportData = [];
                toast({ variant: 'destructive', title: 'Tipo de relatório não implementado', description: 'A busca de dados para este relatório ainda não foi implementada.' });
                setIsGenerating(false);
                return;
            }

            const newReport: Report = {
                id: `REP-${Date.now()}`,
                title: `Relatório de ${reportType}`,
                category: reportType,
                date: format(new Date(), 'dd/MM/yyyy'),
                period: { from: date.from, to: date.to },
                data: reportData,
                summary: reportSummary as any,
            };

            setReports(prevReports => [newReport, ...prevReports]);
            setOpen(false);
            setReportType('');
            setDate(undefined);

            toast({ title: "Relatório Gerado!", description: "Seu relatório está pronto e disponível para download." });

        } catch (error) {
            console.error("Error generating report:", error);
            toast({ variant: 'destructive', title: 'Erro ao gerar relatório', description: 'Não foi possível buscar os dados. Tente novamente.' });
        } finally {
            setIsGenerating(false);
        }
    }
    
    const handleDownloadPdf = (report: Report) => {
        toast({ title: "Gerando PDF...", description: "Seu download começará em breve." });
        generateReportPdf(report);
    };

    const handleDownloadExcel = (report: Report) => {
        toast({ title: "Gerando Excel...", description: "Seu download começará em breve." });
        exportToExcel(report);
    };

  return (
    <div className="flex flex-col gap-6">
       <PageHeader
        title="Gerar Relatórios"
        description="Crie e baixe relatórios operacionais e financeiros."
      >
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
             <Button>
                <PlusCircle className="mr-2" />
                Gerar Relatório
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Gerar Novo Relatório</DialogTitle>
              <DialogDescription>
                Selecione os filtros para gerar um relatório personalizado.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid items-center gap-2">
                <Label htmlFor="report-type">Tipo de Relatório</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger id="report-type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Custos">Relatório de Custos</SelectItem>
                    <SelectItem value="Ocorrências">Relatório de Ocorrências</SelectItem>
                    <SelectItem value="Performance da Frota" disabled>Performance da Frota</SelectItem>
                    <SelectItem value="Consumo de Combustível" disabled>Consumo de Combustível</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid items-center gap-2">
                <Label htmlFor="date-range">Período</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date-range"
                        variant={"outline"}
                        className={cn(
                        "justify-start text-left font-normal w-full",
                        !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                        date.to ? (
                            <>
                            {format(date.from, "dd/MM/y")} -{" "}
                            {format(date.to, "dd/MM/y")}
                            </>
                        ) : (
                            format(date.from, "dd/MM/y")
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
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={handleGenerateReport} type="submit" disabled={isGenerating}>
                  {isGenerating ? "Gerando..." : "Gerar"}
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Relatórios Disponíveis</CardTitle>
          <CardDescription>
            Aqui estão os relatórios gerados recentemente.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {reports.length > 0 ? (
            <ul className="space-y-3">
                {reports.map((report) => (
                    <li key={report.id} className="flex items-center justify-between p-4 rounded-md border bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <FileText className="h-6 w-6 text-primary" />
                            <div>
                                <p className="font-semibold">{report.title}</p>
                                <p className="text-sm text-muted-foreground">{report.category} - Gerado em {report.date}</p>
                            </div>
                        </div>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Abrir menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleDownloadPdf(report)}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Baixar PDF
                                </DropdownMenuItem>
                                 <DropdownMenuItem onClick={() => handleDownloadExcel(report)}>
                                    <SheetIcon className="mr-2 h-4 w-4" />
                                    Baixar Excel
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </li>
                ))}
            </ul>
           ) : (
            <div className="text-center py-10 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12" />
                <p className="mt-4">Nenhum relatório gerado ainda.</p>
                <p className="text-sm">Use o botão "Gerar Relatório" para começar.</p>
            </div>
           )}
        </CardContent>
      </Card>
    </div>
  );
}
