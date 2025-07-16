
"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, PlusCircle, Calendar as CalendarIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";


type Report = {
    title: string;
    category: string;
    date: string;
};

export default function RelatoriosPage() {
    const { toast } = useToast();
    const [reports, setReports] = React.useState<Report[]>([]);
    const [open, setOpen] = React.useState(false);
    const [date, setDate] = React.useState<DateRange | undefined>();
    const [reportType, setReportType] = React.useState('');

    const handleGenerateReport = () => {
        if (!reportType) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Por favor, selecione um tipo de relatório.',
            });
            return;
        }

        const newReport: Report = {
            title: `Relatório de ${reportType} - ${format(new Date(), 'dd/MM/yyyy')}`,
            category: reportType,
            date: format(new Date(), 'dd/MM/yyyy'),
        };

        setReports(prevReports => [...prevReports, newReport]);
        setOpen(false);
        setReportType('');
        setDate(undefined);

        toast({
            title: "Relatório Gerado!",
            description: "Seu relatório está pronto e disponível para download.",
        });
    }

  return (
    <div className="flex flex-col gap-6">
       <PageHeader
        title="Relatórios"
        description="Gere e baixe relatórios operacionais e financeiros."
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
                    <SelectItem value="Performance da Frota">Performance da Frota</SelectItem>
                    <SelectItem value="Consumo de Combustível">Consumo de Combustível</SelectItem>
                    <SelectItem value="Ocorrências">Relatório de Ocorrências</SelectItem>
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
                        "justify-start text-left font-normal",
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
                <Button onClick={handleGenerateReport} type="submit">Gerar</Button>
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
