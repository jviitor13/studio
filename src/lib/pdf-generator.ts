import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompletedChecklist } from '@/lib/types';
import { format } from 'date-fns';

export async function generateChecklistPdf(checklist: CompletedChecklist) {
  const doc = new jsPDF();
  const formattedDate = checklist.createdAt ? format(new Date(checklist.createdAt), "dd/MM/yyyy HH:mm") : 'N/A';

  // Header
  doc.setFontSize(20);
  doc.text('RodoCheck - Relatório de Checklist', 14, 22);
  doc.setFontSize(12);
  doc.text(`Checklist ID: ${checklist.id}`, 14, 30);
  
  autoTable(doc, {
    startY: 35,
    head: [['Data', 'Veículo', 'Responsável', 'Tipo', 'Status']],
    body: [[formattedDate, checklist.vehicle, checklist.driver, checklist.type, checklist.status]],
    theme: 'striped'
  });

  let currentY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(14);
  doc.text('Itens de Verificação', 14, currentY);
  currentY += 6;

  for (const item of checklist.questions) {
    // Add a check to ensure we don't go off the page
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }
    
    doc.setFontSize(11);
    doc.setTextColor(40);
    doc.text(`${item.text}`, 14, currentY);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    const statusText = `Avaliação: ${item.status}`;
    const obsText = `Observação: ${item.observation || 'N/A'}`;
    doc.text(statusText, 16, currentY + 5);
    doc.text(obsText, 16, currentY + 10);
    
    currentY += 15;

    if (item.photo) {
        try {
            // Check if there is enough space for the image
            if (currentY + 50 > 280) {
                doc.addPage();
                currentY = 20;
            }
            doc.addImage(item.photo, 'JPEG', 16, currentY, 60, 45); // Adjust size as needed
            currentY += 55;
        } catch (e) {
            console.error("Error adding image to PDF:", e);
            doc.text("Erro ao carregar imagem.", 16, currentY);
            currentY += 10;
        }
    }
    
    doc.line(14, currentY - 5, 196, currentY - 5); // separator line
  }

  // Save the PDF
  const safeDate = formattedDate.replace(/[^0-9]/g, '_');
  doc.save(`checklist_${checklist.vehicle}_${safeDate}.pdf`);
}
