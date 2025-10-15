"""
PDF Generator for Checklists
"""

import os
import io
from datetime import datetime
from django.conf import settings
from django.http import HttpResponse
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader
import base64


class ChecklistPDFGenerator:
    """Generate PDF for completed checklists."""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_styles()
    
    def setup_styles(self):
        """Setup custom styles for the PDF."""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=18,
            spaceAfter=30,
            alignment=TA_CENTER,
            textColor=colors.darkblue
        ))
        
        # Header style
        self.styles.add(ParagraphStyle(
            name='CustomHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            textColor=colors.darkblue
        ))
        
        # Subheader style
        self.styles.add(ParagraphStyle(
            name='CustomSubheader',
            parent=self.styles['Heading3'],
            fontSize=12,
            spaceAfter=8,
            textColor=colors.darkgreen
        ))
        
        # Normal text style
        self.styles.add(ParagraphStyle(
            name='CustomNormal',
            parent=self.styles['Normal'],
            fontSize=10,
            spaceAfter=6
        ))
    
    def generate_pdf(self, checklist):
        """Generate PDF for a checklist."""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )
        
        # Build PDF content
        story = []
        
        # Title
        title = Paragraph("RELATÓRIO DE CHECKLIST", self.styles['CustomTitle'])
        story.append(title)
        story.append(Spacer(1, 20))
        
        # Checklist info
        story.extend(self._add_checklist_info(checklist))
        story.append(Spacer(1, 20))
        
        # Vehicle info
        story.extend(self._add_vehicle_info(checklist))
        story.append(Spacer(1, 20))
        
        # Questions and answers
        story.extend(self._add_questions_section(checklist))
        story.append(Spacer(1, 20))
        
        # Images
        story.extend(self._add_images_section(checklist))
        story.append(Spacer(1, 20))
        
        # Signatures
        story.extend(self._add_signatures_section(checklist))
        story.append(Spacer(1, 20))
        
        # General observations
        if checklist.general_observations:
            story.extend(self._add_observations_section(checklist))
        
        # Build PDF
        doc.build(story)
        
        # Get PDF content
        pdf_content = buffer.getvalue()
        buffer.close()
        
        return pdf_content
    
    def _add_checklist_info(self, checklist):
        """Add checklist basic information."""
        story = []
        
        # Header
        header = Paragraph("INFORMAÇÕES DO CHECKLIST", self.styles['CustomHeader'])
        story.append(header)
        
        # Info table
        info_data = [
            ['ID do Checklist:', checklist.id],
            ['Data de Criação:', checklist.created_at.strftime('%d/%m/%Y %H:%M')],
            ['Criado por:', f"{checklist.created_by.first_name} {checklist.created_by.last_name}"],
            ['Status:', checklist.get_final_status_display()],
        ]
        
        if checklist.template:
            info_data.append(['Template:', checklist.template.name])
        
        info_table = Table(info_data, colWidths=[2*inch, 4*inch])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (1, 0), (1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(info_table)
        return story
    
    def _add_vehicle_info(self, checklist):
        """Add vehicle information."""
        story = []
        
        header = Paragraph("INFORMAÇÕES DO VEÍCULO", self.styles['CustomHeader'])
        story.append(header)
        
        vehicle = checklist.vehicle
        vehicle_data = [
            ['Placa:', vehicle.plate],
            ['Modelo:', vehicle.model],
            ['Marca:', vehicle.brand],
            ['Ano:', str(vehicle.year)],
            ['Tipo:', vehicle.get_vehicle_type_display()],
            ['Cor:', vehicle.color or 'N/A'],
        ]
        
        vehicle_table = Table(vehicle_data, colWidths=[2*inch, 4*inch])
        vehicle_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('BACKGROUND', (1, 0), (1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(vehicle_table)
        return story
    
    def _add_questions_section(self, checklist):
        """Add questions and answers section."""
        story = []
        
        header = Paragraph("ITENS DE VERIFICAÇÃO", self.styles['CustomHeader'])
        story.append(header)
        
        if not checklist.questions:
            story.append(Paragraph("Nenhum item de verificação registrado.", self.styles['CustomNormal']))
            return story
        
        # Questions table
        questions_data = [['Item', 'Status', 'Observações']]
        
        for i, question in enumerate(checklist.questions, 1):
            status = question.get('status', 'Pendente')
            observations = question.get('observations', '')
            
            # Status color mapping
            status_display = {
                'approved': '✓ Aprovado',
                'rejected': '✗ Rejeitado',
                'pending': '⏳ Pendente'
            }.get(status, status)
            
            questions_data.append([
                f"{i}. {question.get('text', 'Item sem texto')}",
                status_display,
                observations or 'N/A'
            ])
        
        questions_table = Table(questions_data, colWidths=[3*inch, 1.5*inch, 1.5*inch])
        questions_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        
        story.append(questions_table)
        return story
    
    def _add_images_section(self, checklist):
        """Add images section."""
        story = []
        
        header = Paragraph("IMAGENS DO VEÍCULO", self.styles['CustomHeader'])
        story.append(header)
        
        if not checklist.vehicle_images:
            story.append(Paragraph("Nenhuma imagem registrada.", self.styles['CustomNormal']))
            return story
        
        for image_type, image_data in checklist.vehicle_images.items():
            if image_data and image_data.get('url'):
                try:
                    # Add image placeholder (in real implementation, you'd process the image)
                    story.append(Paragraph(f"<b>{image_type.title()}:</b> Imagem anexada", self.styles['CustomNormal']))
                except Exception as e:
                    story.append(Paragraph(f"<b>{image_type.title()}:</b> Erro ao processar imagem", self.styles['CustomNormal']))
        
        return story
    
    def _add_signatures_section(self, checklist):
        """Add signatures section."""
        story = []
        
        header = Paragraph("ASSINATURAS", self.styles['CustomHeader'])
        story.append(header)
        
        if not checklist.signatures:
            story.append(Paragraph("Nenhuma assinatura registrada.", self.styles['CustomNormal']))
            return story
        
        for signature_type, signature_data in checklist.signatures.items():
            if signature_data:
                story.append(Paragraph(f"<b>{signature_type.title()}:</b> Assinatura registrada", self.styles['CustomNormal']))
        
        return story
    
    def _add_observations_section(self, checklist):
        """Add general observations section."""
        story = []
        
        header = Paragraph("OBSERVAÇÕES GERAIS", self.styles['CustomHeader'])
        story.append(header)
        
        observations = Paragraph(checklist.general_observations, self.styles['CustomNormal'])
        story.append(observations)
        
        return story


def generate_checklist_pdf_response(checklist):
    """Generate PDF response for download."""
    generator = ChecklistPDFGenerator()
    pdf_content = generator.generate_pdf(checklist)
    
    response = HttpResponse(pdf_content, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="checklist_{checklist.id}.pdf"'
    
    return response


