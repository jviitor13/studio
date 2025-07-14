import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompletedChecklist } from '@/lib/types';
import { format } from 'date-fns';

export function generateChecklistPdf(checklist: CompletedChecklist) {
  const doc = new jsPDF();
  const formattedDate = checklist.createdAt ? format(new Date(checklist.createdAt), "dd/MM/yyyy HH:mm") : 'N/A';

  // Cabeçalho
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

  // Itens do Checklist
  const tableBody = checklist.questions.map(q => [
    q.text,
    q.status,
    q.observation || 'N/A'
  ]);

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['Item', 'Avaliação', 'Observação']],
    body: tableBody,
    theme: 'grid',
    didDrawCell: (data) => {
        // Lógica para adicionar imagens pode ser inserida aqui
    }
  });

  // Salvar o PDF
  const safeDate = formattedDate.replace(/[^0-9]/g, '_');
  doc.save(`checklist_${checklist.vehicle}_${safeDate}.pdf`);
}
