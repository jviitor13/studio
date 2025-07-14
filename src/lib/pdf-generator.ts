import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompletedChecklist } from '@/lib/types';
import { format } from 'date-fns';

export async function generateChecklistPdf(checklist: CompletedChecklist) {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // --- Funções Auxiliares de Desenho ---

  const addHeader = () => {
    // Título Principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(34, 34, 34); // Quase preto
    doc.text('Relatório de Checklist', pageWidth / 2, 20, { align: 'center' });
    
    // Subtítulo com ID
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(102, 102, 102); // Cinza escuro
    doc.text(`Checklist ID: ${checklist.id}`, pageWidth / 2, 26, { align: 'center' });

    // Linha de separação
    doc.setDrawColor(221, 221, 221); // Cinza claro
    doc.line(margin, 32, pageWidth - margin, 32);
  };

  const addFooter = (pageNumber: number, pageCount: number) => {
    const generationDate = format(new Date(), "dd/MM/yyyy 'às' HH:mm");
    const footerText = `Gerado por RodoCheck | ID: ${checklist.id} | Página ${pageNumber} de ${pageCount}`;
    
    doc.setFontSize(8);
    doc.setTextColor(153, 153, 153); // Cinza médio
    doc.text(footerText, pageWidth / 2, pageHeight - 10, { align: 'center' });
  };

  // --- Início do Documento ---
  addHeader();

  // Tabela de Informações Principais
  const formattedDate = checklist.createdAt ? format(new Date(checklist.createdAt), "dd/MM/yyyy HH:mm") : 'N/A';
  autoTable(doc, {
    startY: 38,
    head: [['Data', 'Veículo', 'Responsável', 'Tipo', 'Status']],
    body: [[formattedDate, checklist.vehicle, checklist.driver, checklist.type, checklist.status]],
    theme: 'grid',
    headStyles: {
      fillColor: '#1A237E', // Azul escuro
      textColor: '#ffffff',
      fontStyle: 'bold',
    },
    styles: {
      font: 'helvetica',
      fontSize: 10,
    },
    margin: { left: margin, right: margin }
  });

  // Seção de Itens
  let currentY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(34, 34, 34);
  doc.text('Itens Verificados', margin, currentY);
  currentY += 8;

  for (const item of checklist.questions) {
    const itemCardHeight = calculateItemHeight(doc, item);
    if (currentY + itemCardHeight > pageHeight - 20) {
      addFooter(doc.internal.pages.length, doc.internal.pages.length);
      doc.addPage();
      addHeader();
      currentY = 45; // Posição inicial em nova página
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
        doc.setDrawColor(204, 204, 204); // Borda da imagem
        doc.rect(margin, currentY, imgWidth, imgHeight);
        doc.addImage(item.photo, 'JPEG', margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 5;
      } catch (e) {
        console.error("Error adding image to PDF:", e);
        doc.text("Erro ao carregar imagem.", margin, currentY);
        currentY += 5;
      }
    }
    
    // Separador entre itens
    doc.setDrawColor(238, 238, 238);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 8;
  }

  // Adicionar rodapé em todas as páginas
  const pageCount = (doc.internal as any).pages.length;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(i, pageCount);
  }

  // Salvar o PDF
  const safeDate = formattedDate.replace(/[^0-9]/g, '_');
  doc.save(`checklist_${checklist.vehicle}_${safeDate}.pdf`);
}

function calculateItemHeight(doc: jsPDF, item: any): number {
    let height = 20; // Espaço inicial (título, status)
    
    // Altura da observação
    const obsText = `Observação: ${item.observation || 'Nenhuma'}`;
    const splitObs = doc.splitTextToSize(obsText, doc.internal.pageSize.getWidth() - 30);
    height += splitObs.length * 4;

    // Altura da imagem
    if (item.photo) {
        height += 50; // Altura da imagem + margem
    }

    return height + 10; // Margem final
}
