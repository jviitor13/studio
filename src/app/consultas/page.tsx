
"use client"

import * as React from "react"
import { Button, buttonVariants } from "@/components/ui/button"
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
import { CalendarIcon, Download, Search, FileText, MoreHorizontal, Trash2, Loader2, AlertTriangle, CheckCircle, UploadCloud, Server, Database, RefreshCw } from "lucide-react"
import { format, startOfDay, endOfDay, isValid } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ChecklistDetailsDialog } from "@/components/checklist-details-dialog"
import { useToast } from "@/hooks/use-toast"
import { generateChecklistPdf } from "@/lib/pdf-generator"
import { CompletedChecklist } from "@/lib/types"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, query, where, Timestamp, deleteDoc, doc, orderBy, getDocs, writeBatch } from "firebase/firestore"
import { Skeleton } from "@/components/ui/skeleton"
import { PageHeader } from "@/components/page-header"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { UploadErrorDialog } from "@/components/upload-error-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { retryChecklistUpload } from "@/lib/actions"

const UploadStatusBadge = ({ status, onClick }: { status?: 'success' | 'error' | 'pending', onClick?: () => void }) => {
    let icon;
    let text;
    let variant: "default" | "destructive" | "secondary" = "secondary";
    let className = "";
    let isClickable = false;

    switch (status) {
        case 'success':
            icon = <CheckCircle className="h-3 w-3" />;
            text = "Sucesso";
            variant = "default";
            className = "bg-green-500 hover:bg-green-600";
            break;
        case 'error':
            icon = <AlertTriangle className="h-3 w-3" />;
            text = "Falha";
            variant = "destructive";
            isClickable = true;
            className = "cursor-pointer hover:bg-destructive/80";
            break;
        case 'pending':
            icon = <Loader2 className="h-3 w-3 animate-spin" />;
            text = "Pendente";
            variant = "secondary";
            break;
        default:
            icon = <Loader2 className="h-3 w-3 animate-spin" />;
            text = "Enviando...";
            variant = "secondary";
            className = "animate-pulse";
            break;
    }

    return (
        <Badge variant={variant} className={cn("flex items-center gap-1 w-fit text-xs", className)} onClick={isClickable ? onClick : undefined}>
            {icon}
            <span>{text}</span>
        </Badge>
    );
};

const processChecklistDoc = (doc: any): CompletedChecklist => {
    const data = doc.data();
    let createdAtDate: Date | null = null;
    const rawDate = data.createdAt;

    if (rawDate instanceof Timestamp) {
        createdAtDate = rawDate.toDate();
    } else if (typeof rawDate === 'string' || typeof rawDate === 'number') {
        const parsedDate = new Date(rawDate);
        if (isValid(parsedDate)) {
            createdAtDate = parsedDate;
        }
    } else if (rawDate && typeof rawDate.seconds === 'number') {
        const parsedDate = new Date(rawDate.seconds * 1000);
            if (isValid(parsedDate)) {
            createdAtDate = parsedDate;
        }
    }

    return {
        ...data,
        id: doc.id,
        createdAt: createdAtDate,
    } as CompletedChecklist;
};


export default function ConsultasPage() {
    const [checklists, setChecklists] = React.useState<CompletedChecklist[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSearching, setIsSearching] = React.useState(false);
    
    // Filter states
    const [date, setDate] = React.useState<DateRange | undefined>()
    const [type, setType] = React.useState<string>("");
    const [plate, setPlate] = React.useState<string>("");
    const [status, setStatus] = React.useState<string>("");

    const [selectedChecklist, setSelectedChecklist] = React.useState<CompletedChecklist | null>(null)
    const [isDetailsOpen, setIsDetailsOpen] = React.useState(false)
    const [isErrorDialogOpen, setIsErrorDialogOpen] = React.useState(false);
    
    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

    const { toast } = useToast()

    React.useEffect(() => {
        setIsLoading(true);
        const q = query(collection(db, "completed-checklists"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const checklistsData = querySnapshot.docs.map(processChecklistDoc);
          setChecklists(checklistsData);
          setIsLoading(false);
        });
    
        return () => unsubscribe();
      }, []);
      
    const handleSearch = async () => {
        setIsSearching(true);
        try {
            let q = query(collection(db, "completed-checklists"), orderBy("createdAt", "desc"));

            if (date?.from && date?.to) {
                q = query(q, where('createdAt', '>=', Timestamp.fromDate(startOfDay(date.from))));
                q = query(q, where('createdAt', '<=', Timestamp.fromDate(endOfDay(date.to))));
            }

            if (type) {
                q = query(q, where('type', '==', type));
            }

            if (plate) {
                // As Firestore doesn't support partial string search natively, 
                // we use a range query which works for "starts-with" behavior.
                q = query(q, where('vehicle', '>=', plate.toUpperCase()), where('vehicle', '<=', plate.toUpperCase() + '\uf8ff'));
            }
            
            if (status) {
                q = query(q, where('status', '==', status));
            }

            const querySnapshot = await getDocs(q);
            const results = querySnapshot.docs.map(processChecklistDoc);

            setChecklists(results);
            setSelectedIds([]); // Clear selection on new search
        } catch (error) {
            console.error("Error searching checklists: ", error);
            toast({
                variant: "destructive",
                title: "Erro na Busca",
                description: "Não foi possível realizar a busca. Tente novamente.",
            });
        } finally {
            setIsSearching(false);
        }
    };

    const handleErrorClick = (checklist: CompletedChecklist) => {
        setSelectedChecklist(checklist);
        setIsErrorDialogOpen(true);
    };

    const handleViewDetails = (checklist: CompletedChecklist) => {
        setSelectedChecklist(checklist)
        setIsDetailsOpen(true)
    }

    const handleExport = async (checklist: CompletedChecklist) => {
        toast({
            title: "Exportação Iniciada",
            description: `O checklist ${checklist.id} está sendo preparado.`,
        });
        try {
            await generateChecklistPdf(checklist);
        } catch (error) {
            console.error("PDF generation error:", error);
            toast({
                variant: "destructive",
                title: "Erro ao Gerar PDF",
                description: "Não foi possível gerar o arquivo. Tente novamente."
            })
        }
    }

    const handleDelete = async (checklistId: string) => {
        try {
            await deleteDoc(doc(db, "completed-checklists", checklistId));
            toast({
                title: "Sucesso!",
                description: "O checklist foi excluído permanentemente.",
            });
        } catch (error) {
            console.error("Delete error:", error);
            toast({
                variant: "destructive",
                title: "Erro ao Excluir",
                description: "Não foi possível excluir o checklist. Tente novamente.",
            });
        }
    };

    const handleDeleteSelected = async () => {
        const batch = writeBatch(db);
        selectedIds.forEach((id) => {
            const docRef = doc(db, "completed-checklists", id);
            batch.delete(docRef);
        });

        try {
            await batch.commit();
            toast({
                title: "Sucesso!",
                description: `${selectedIds.length} checklists foram excluídos.`,
            });
            setSelectedIds([]);
        } catch (error) {
             console.error("Batch delete error:", error);
            toast({
                variant: "destructive",
                title: "Erro ao Excluir",
                description: "Não foi possível excluir os checklists selecionados.",
            });
        }
    };
    
    const formatDate = (date: Date | Timestamp | string | null) => {
        if (!date || !isValid(new Date(date.toString()))) return 'N/A';
        const d = date instanceof Timestamp ? date.toDate() : new Date(date);
        return format(d, "dd/MM/yyyy HH:mm");
    };
    
    const getChecklistStatusLabel = (status: CompletedChecklist['status']) => {
        switch (status) {
            case 'OK': return 'Concluído';
            case 'Pendente': return 'Com Pendências';
            case 'Enviando': return 'Processando...';
            default: return status;
        }
    }
    
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(checklists.map(c => c.id));
        } else {
            setSelectedIds([]);
        }
    }

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        }
    }

    const handleRetryUpload = async (checklistId: string) => {
        toast({ title: 'Reenviando checklist...', description: 'O processo de upload foi reiniciado em segundo plano.' });
        const result = await retryChecklistUpload(checklistId);
        if (!result.success) {
            toast({ variant: 'destructive', title: 'Erro ao Reenviar', description: result.error });
        }
    };

    const hasUploadFailed = (item: CompletedChecklist) => {
        return item.googleDriveStatus === 'error' || item.firebaseStorageStatus === 'error';
    };


    return (
        <>
            <UploadErrorDialog
                isOpen={isErrorDialogOpen}
                onClose={() => setIsErrorDialogOpen(false)}
                errorMessage={selectedChecklist?.generalObservations}
            />
            <ChecklistDetailsDialog 
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                checklist={selectedChecklist}
                onExport={handleExport}
            />
            <div className="flex flex-col gap-6">
                <PageHeader
                    title="Consultar Checklists"
                    description="Filtre e localize checklists específicos para visualização ou exportação."
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
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger id="type">
                                        <SelectValue placeholder="Todos os tipos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="retorno">Retorno</SelectItem>
                                        <SelectItem value="Manutenção">Manutenção</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="plate">Placa do Veículo</Label>
                                <Input id="plate" placeholder="Ex: RDO1A12" value={plate} onChange={e => setPlate(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Todos os status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="OK">Concluído</SelectItem>
                                        <SelectItem value="Pendente">Com Pendências</SelectItem>
                                        <SelectItem value="Enviando">Processando</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end mt-4">
                            <Button onClick={handleSearch} disabled={isSearching}>
                                {isSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Search className="mr-2 h-4 w-4"/>}
                                {isSearching ? 'Buscando...' : 'Buscar'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                             <div>
                                <CardTitle>Resultados</CardTitle>
                                <CardDescription>
                                    Foram encontrados {checklists.length} checklists.
                                     {selectedIds.length > 0 && ` (${selectedIds.length} selecionados)`}
                                </CardDescription>
                            </div>
                            {selectedIds.length > 0 && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Excluir Selecionados
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Excluir {selectedIds.length} checklist(s)?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta ação não pode ser desfeita.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDeleteSelected} className={cn(buttonVariants({ variant: "destructive" }))}>
                                                Sim, Excluir
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">
                                        <Checkbox
                                            checked={selectedIds.length === checklists.length && checklists.length > 0}
                                            onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                            aria-label="Selecionar todos"
                                        />
                                    </TableHead>
                                    <TableHead>Data</TableHead>
                                    <TableHead>Veículo</TableHead>
                                    <TableHead>Responsável</TableHead>
                                    <TableHead>Status Checklist</TableHead>
                                    <TableHead>Uploads</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7}>
                                            <Skeleton className="h-24 w-full" />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    checklists.map((item) => (
                                        <TableRow key={item.id} data-state={selectedIds.includes(item.id) && "selected"}>
                                            <TableCell>
                                                <Checkbox
                                                     checked={selectedIds.includes(item.id)}
                                                    onCheckedChange={(checked) => handleSelectOne(item.id, checked as boolean)}
                                                    aria-label={`Selecionar checklist ${item.id}`}
                                                />
                                            </TableCell>
                                            <TableCell>{formatDate(item.createdAt)}</TableCell>
                                            <TableCell className="font-medium">{item.vehicle}</TableCell>
                                            <TableCell>{item.responsibleName || 'N/A'}</TableCell>
                                            <TableCell>
                                                <Badge variant={item.status === 'OK' ? 'default' : item.status === 'Pendente' ? 'destructive' : 'secondary'} className={cn(item.status === 'OK' && 'bg-green-500 hover:bg-green-600', item.status === 'Enviando' && 'animate-pulse')}>
                                                     {getChecklistStatusLabel(item.status)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-2">
                                                        <Database className="h-4 w-4 text-muted-foreground" title="Google Drive" />
                                                        <UploadStatusBadge status={item.googleDriveStatus} onClick={() => handleErrorClick(item)} />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Server className="h-4 w-4 text-muted-foreground" title="Firebase Storage" />
                                                        <UploadStatusBadge status={item.firebaseStorageStatus} onClick={() => handleErrorClick(item)} />
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <AlertDialog>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Abrir menu</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onSelect={() => handleViewDetails(item)}>
                                                                <FileText className="mr-2 h-4 w-4" /> Ver Detalhes
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onSelect={() => handleExport(item)}>
                                                                <Download className="mr-2 h-4 w-4" /> Exportar PDF
                                                            </DropdownMenuItem>
                                                            {hasUploadFailed(item) && (
                                                                <DropdownMenuItem onSelect={() => handleRetryUpload(item.id)}>
                                                                    <RefreshCw className="mr-2 h-4 w-4" /> Reenviar Upload
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            <AlertDialogTrigger asChild>
                                                                <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                                </DropdownMenuItem>
                                                            </AlertDialogTrigger>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Esta ação não pode ser desfeita. O checklist <span className="font-bold">{item.id}</span> será excluído permanentemente do banco de dados.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(item.id)} className={cn(buttonVariants({ variant: "destructive" }))}>
                                                                Sim, Excluir
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                                 {!isLoading && checklists.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24">
                                            Nenhum checklist encontrado com os filtros aplicados.
                                        </TableCell>
                                    </TableRow>
                                 )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </>
    )
}

    