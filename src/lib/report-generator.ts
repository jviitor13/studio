
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

type Report = {
    id: string;
    title: string;
    category: string;
    date: string;
    period?: { from: Date; to: Date };
    data: any[];
};

const addHeader = (doc: jsPDF, title: string) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    // Logo (placeholder)
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor('#123A5E');
    doc.text('RodoCheck', 15, 20);

    // Report Title
    doc.setFontSize(16);
    doc.setTextColor(34, 34, 34);
    doc.text(title, pageWidth - 15, 20, { align: 'right' });

    doc.setDrawColor(221, 221, 221);
    doc.line(15, 28, pageWidth - 15, 28);
};

const addFooter = (doc: jsPDF, reportId: string) => {
    const pageCount = (doc.internal as any).pages.length;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(153, 153, 153);
        const footerText = `Gerado por RodoCheck em ${format(new Date(), 'dd/MM/yyyy HH:mm')} | ID: ${reportId}`;
        doc.text(footerText, 15, pageHeight - 10);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
    }
};

export function generateReportPdf(report: Report) {
    const doc = new jsPDF();
    
    addHeader(doc, report.title);

    let currentY = 38;
    doc.setFontSize(10);
    doc.setTextColor(85, 85, 85);
    doc.text(`Categoria: ${report.category}`, 15, currentY);
    doc.text(`Data de Geração: ${report.date}`, doc.internal.pageSize.getWidth() - 15, currentY, { align: 'right' });
    currentY += 5;

    if (report.period) {
        const periodStr = `Período: ${format(report.period.from, 'dd/MM/yyyy')} a ${format(report.period.to, 'dd/MM/yyyy')}`;
        doc.text(periodStr, 15, currentY);
    }
    
    currentY += 10;
    
    if (report.data.length > 0) {
        const head = [Object.keys(report.data[0]).map(key => key.charAt(0).toUpperCase() + key.slice(1))];
        const body = report.data.map(row => Object.values(row));

        autoTable(doc, {
            startY: currentY,
            head: head,
            body: body,
            theme: 'striped',
            headStyles: {
                fillColor: '#123A5E',
                textColor: '#FFFFFF',
                fontStyle: 'bold',
            },
            styles: {
                font: 'helvetica',
                fontSize: 9,
            },
            margin: { left: 15, right: 15 },
        });
    } else {
        doc.text("Nenhum dado encontrado para este relatório.", 15, currentY);
    }

    addFooter(doc, report.id);

    const safeFilename = `${report.title.toLowerCase().replace(/ /g, '_')}_${report.date.replace(/\//g, '-')}.pdf`;
    doc.save(safeFilename);
}


export function exportToExcel(data: any[], fileName: string) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
    saveAs(blob, `${fileName}.xlsx`);
}
