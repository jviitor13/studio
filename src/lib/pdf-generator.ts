import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompletedChecklist } from '@/lib/types';
import { format } from 'date-fns';

export async function generateChecklistPdf(checklist: CompletedChecklist) {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  const addHeader = () => {
    // Título Principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(34, 34, 34);
    doc.text('Relatório de Checklist', pageWidth / 2, 20, { align: 'center' });
    
    // Subtítulo com ID
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(102, 102, 102);
    doc.text(`Checklist ID: ${checklist.id}`, pageWidth / 2, 26, { align: 'center' });

    doc.setDrawColor(221, 221, 221);
    doc.line(margin, 32, pageWidth - margin, 32);
  };

  const addFooter = (pageNumber: number, pageCount: number) => {
    const footerText = `Gerado por RodoCheck | ID: ${checklist.id} | Página ${pageNumber} de ${pageCount}`;
    
    doc.setFontSize(8);
    doc.setTextColor(153, 153, 153);
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
  };
  
  const addSignatures = (startY: number) => {
    let currentY = startY;
    if (currentY > pageHeight - 60) { // Check if space is enough for signatures
        doc.addPage();
        addHeader();
        currentY = 45;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(34, 34, 34);
    doc.text('Assinaturas', margin, currentY);
    currentY += 10;
    
    const signatureWidth = 70;
    const signatureHeight = 35;
    const signatureY = currentY;

    if (checklist.assinaturaResponsavel) {
        doc.addImage(checklist.assinaturaResponsavel, 'PNG', margin, signatureY, signatureWidth, signatureHeight);
        doc.setDrawColor(150, 150, 150);
        doc.line(margin, signatureY + signatureHeight + 2, margin + signatureWidth, signatureY + signatureHeight + 2);
        doc.setFontSize(10);
        doc.setTextColor(85, 85, 85);
        doc.text(checklist.responsibleName || 'Responsável Técnico', margin + signatureWidth / 2, signatureY + signatureHeight + 7, { align: 'center' });
    }

    if (checklist.assinaturaMotorista) {
        const motoristaX = pageWidth - margin - signatureWidth;
        doc.addImage(checklist.assinaturaMotorista, 'PNG', motoristaX, signatureY, signatureWidth, signatureHeight);
        doc.setDrawColor(150, 150, 150);
        doc.line(motoristaX, signatureY + signatureHeight + 2, motoristaX + signatureWidth, signatureY + signatureHeight + 2);
        doc.setFontSize(10);
        doc.setTextColor(85, 85, 85);
        doc.text(checklist.driver || 'Motorista', motoristaX + signatureWidth / 2, signatureY + signatureHeight + 7, { align: 'center' });
    }
    
    currentY += signatureHeight + 15;

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(120,120,120);
    doc.text("Checklist validado digitalmente no local da inspeção.", pageWidth / 2, currentY, { align: 'center' });

    return currentY;
  };


  addHeader();

  const formattedDate = checklist.createdAt ? format(new Date(checklist.createdAt), "dd/MM/yyyy HH:mm") : 'N/A';
  autoTable(doc, {
    startY: 38,
    head: [['Data', 'Veículo', 'Responsável', 'Tipo', 'Status']],
    body: [[formattedDate, checklist.vehicle, checklist.responsibleName || 'N/A', checklist.type, checklist.status]],
    theme: 'grid',
    headStyles: {
      fillColor: '#123A5E', 
      textColor: '#ffffff',
      fontStyle: 'bold',
    },
    styles: {
      font: 'helvetica',
      fontSize: 10,
    },
    margin: { left: margin, right: margin }
  });

  let currentY = (doc as any).lastAutoTable.finalY + 15;

  if (checklist.questions && checklist.questions.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(34, 34, 34);
    doc.text('Itens Verificados', margin, currentY);
    currentY += 8;
  
    for (const item of checklist.questions) {
      const itemCardHeight = calculateItemHeight(doc, item);
      if (currentY + itemCardHeight > pageHeight - 30) {
        addFooter(doc.internal.pages.length, doc.internal.pages.length);
        doc.addPage();
        addHeader();
        currentY = 45; 
      }
  
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 51, 51);
      doc.text(item.text, margin, currentY, { maxWidth: pageWidth - (margin * 2) });
      currentY += 6;
  
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(85, 85, 85);
      
      const statusText = `Avaliação: ${item.status}`;
      doc.text(statusText, margin, currentY);
      currentY += 5;
  
      const obsText = `Observação: ${item.observation || 'Nenhuma'}`;
      const splitObs = doc.splitTextToSize(obsText, pageWidth - (margin * 2));
      doc.text(splitObs, margin, currentY);
      currentY += (splitObs.length * 4) + 2;
  
      if (item.photo) {
        try {
          const imgWidth = 60;
          const imgHeight = 45;
          if (currentY + imgHeight > pageHeight - 25) {
              addFooter(doc.internal.pages.length, doc.internal.pages.length);
              doc.addPage();
              addHeader();
              currentY = 45;
          }
          doc.setDrawColor(204, 204, 204);
          doc.rect(margin, currentY, imgWidth, imgHeight);
          doc.addImage(item.photo, 'JPEG', margin + 1, currentY + 1, imgWidth - 2, imgHeight - 2);
          currentY += imgHeight + 5;
        } catch (e) {
          console.error("Error adding image to PDF:", e);
          doc.text("Erro ao carregar imagem.", margin, currentY);
          currentY += 5;
        }
      }
      
      doc.setDrawColor(238, 238, 238);
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 8;
    }
  }
  
  currentY = addSignatures(currentY);

  const pageCount = (doc.internal as any).pages.length;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(i, pageCount);
  }

  const safeDate = formattedDate.replace(/[^0-9]/g, '_');
  doc.save(`checklist_${checklist.vehicle}_${safeDate}.pdf`);
}

function calculateItemHeight(doc: jsPDF, item: any): number {
    let height = 20; 
    
    const obsText = `Observação: ${item.observation || 'Nenhuma'}`;
    const splitObs = doc.splitTextToSize(obsText, doc.internal.pageSize.getWidth() - 30);
    height += splitObs.length * 4;

    if (item.photo) {
        height += 50;
    }

    return height + 10;
}
