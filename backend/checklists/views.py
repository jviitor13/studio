from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import ChecklistTemplate, CompletedChecklist
from .serializers import (
    ChecklistTemplateSerializer, 
    CompletedChecklistSerializer, 
    ChecklistCreateSerializer
)
from .pdf_generator import generate_checklist_pdf_response
import logging

logger = logging.getLogger('rodocheck')


class ChecklistTemplateListCreateView(generics.ListCreateAPIView):
    """List and create checklist templates."""
    queryset = ChecklistTemplate.objects.filter(is_active=True)
    serializer_class = ChecklistTemplateSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ChecklistTemplateDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete checklist template."""
    queryset = ChecklistTemplate.objects.all()
    serializer_class = ChecklistTemplateSerializer
    permission_classes = [IsAuthenticated]


class CompletedChecklistListCreateView(generics.ListCreateAPIView):
    """List and create completed checklists."""
    serializer_class = CompletedChecklistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CompletedChecklist.objects.filter(created_by=self.request.user)

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ChecklistCreateSerializer
        return CompletedChecklistSerializer

    def perform_create(self, serializer):
        checklist = serializer.save()
        # Generate PDF automatically
        try:
            from .pdf_generator import ChecklistPDFGenerator
            generator = ChecklistPDFGenerator()
            pdf_content = generator.generate_pdf(checklist)
            
            # Save PDF to file
            import os
            from django.core.files.base import ContentFile
            
            pdf_filename = f"checklist_{checklist.id}.pdf"
            checklist.pdf_file.save(pdf_filename, ContentFile(pdf_content))
            checklist.is_pdf_generated = True
            checklist.save()
            
        except Exception as e:
            logger.error(f"Error generating PDF for checklist {checklist.id}: {e}")
            # Continue without PDF generation


class CompletedChecklistDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Retrieve, update or delete completed checklist."""
    serializer_class = CompletedChecklistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CompletedChecklist.objects.filter(created_by=self.request.user)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_checklist_pdf(request, checklist_id):
    """Download checklist PDF."""
    checklist = get_object_or_404(CompletedChecklist, id=checklist_id, created_by=request.user)
    
    # Increment download count
    checklist.download_count += 1
    checklist.save()
    
    # Generate PDF if not exists
    if not checklist.is_pdf_generated or not checklist.pdf_file:
        try:
            from .pdf_generator import ChecklistPDFGenerator
            generator = ChecklistPDFGenerator()
            pdf_content = generator.generate_pdf(checklist)
            
            from django.core.files.base import ContentFile
            pdf_filename = f"checklist_{checklist.id}.pdf"
            checklist.pdf_file.save(pdf_filename, ContentFile(pdf_content))
            checklist.is_pdf_generated = True
            checklist.save()
            
        except Exception as e:
            logger.error(f"Error generating PDF for checklist {checklist.id}: {e}")
            return Response({
                'error': 'Erro ao gerar PDF do checklist.'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Return PDF file
    if checklist.pdf_file:
        response = HttpResponse(checklist.pdf_file.read(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="checklist_{checklist.id}.pdf"'
        return response
    else:
        return Response({
            'error': 'PDF não disponível para download.'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def checklist_download_info(request, checklist_id):
    """Get checklist download information."""
    checklist = get_object_or_404(CompletedChecklist, id=checklist_id, created_by=request.user)
    
    return Response({
        'id': checklist.id,
        'is_pdf_generated': checklist.is_pdf_generated,
        'download_count': checklist.download_count,
        'pdf_url': checklist.pdf_file.url if checklist.pdf_file else None,
        'created_at': checklist.created_at,
    })
