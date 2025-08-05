import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { Report } from './types';


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
        const headers = Object.keys(report.data[0]).map(key => key.charAt(0).toUpperCase() + key.slice(1));
        const body = report.data.map(row => Object.values(row).map(value => {
             // Format numbers as currency for the PDF
            if (typeof value === 'number') {
                return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            }
            return value;
        }));

        autoTable(doc, {
            startY: currentY,
            head: [headers],
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
        
        let finalY = (doc as any).lastAutoTable.finalY;

        if (report.summary) {
            finalY += 10;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Resumo do Relatório', 15, finalY);
            finalY += 7;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Custo Total: ${report.summary.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 15, finalY);
        }

    } else {
        doc.text("Nenhum dado encontrado para este relatório.", 15, currentY);
    }

    addFooter(doc, report.id);

    const safeFilename = `${report.title.toLowerCase().replace(/ /g, '_')}_${report.date.replace(/\//g, '-')}.pdf`;
    doc.save(safeFilename);
}


export function exportToExcel(report: Report) {
    const dataToExport = [...report.data];
    if (report.summary) {
        dataToExport.push({}); // Add empty line
        dataToExport.push({ Item: 'Custo Total', Valor: report.summary.totalCost });
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    
    // Auto-fit columns
    const objectMaxLength = Object.keys(report.data[0] || {}).map(key => {
        const maxLength = Math.max(...(report.data.map(item => String(item[key]).length)));
        return { wch: Math.max(key.length, maxLength) + 2 };
    });
    worksheet["!cols"] = objectMaxLength;
    
    const workbook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
    
    const safeFilename = `${report.title.toLowerCase().replace(/ /g, '_')}_${report.date.replace(/\//g, '-')}.xlsx`;
    saveAs(blob, safeFilename);
}