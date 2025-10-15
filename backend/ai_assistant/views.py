"""
Views for AI Assistant functionality
"""

from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.exceptions import ValidationError, PermissionDenied
import uuid
import logging

from .models import (
    AIAssistantSession, AIAssistantMessage, 
    VehicleDamageAssessment, TireAnalysis, AIConfiguration, AIUsageLog
)
from .serializers import (
    AIAssistantSessionSerializer, AIAssistantMessageSerializer,
    VehicleDamageAssessmentSerializer, TireAnalysisSerializer,
    AIConfigurationSerializer, AIUsageLogSerializer,
    AIAssistantRequestSerializer, VehicleDamageRequestSerializer, TireAnalysisRequestSerializer
)
from .services import AIAssistantService
from authentication.models import User
from vehicles.models import Vehicle
from checklists.models import CompletedChecklist
from rodocheck_backend.exceptions import (
    RodoCheckException, AuthenticationError, AuthorizationError, 
    ValidationError as RodoCheckValidationError, NotFoundError, 
    AIServiceError, ExternalServiceError, handle_api_exception
)

logger = logging.getLogger('rodocheck')


class AIAssistantSessionView(generics.ListCreateAPIView):
    """View for AI assistant sessions."""
    serializer_class = AIAssistantSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return AIAssistantSession.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        session_id = str(uuid.uuid4())
        serializer.save(user=self.request.user, session_id=session_id)


class AIAssistantMessageView(generics.ListCreateAPIView):
    """View for AI assistant messages."""
    serializer_class = AIAssistantMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        session_id = self.kwargs.get('session_id')
        return AIAssistantMessage.objects.filter(
            session__user=self.request.user,
            session__session_id=session_id
        )
    
    def perform_create(self, serializer):
        session_id = self.kwargs.get('session_id')
        session = get_object_or_404(
            AIAssistantSession, 
            session_id=session_id, 
            user=self.request.user
        )
        serializer.save(session=session)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def ai_assistant_chat(request):
    """Handle AI assistant chat requests."""
    serializer = AIAssistantRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Get or create session
        session_id = serializer.validated_data.get('session_id')
        if not session_id:
            session_id = str(uuid.uuid4())
            session = AIAssistantSession.objects.create(
                user=request.user,
                session_id=session_id
            )
        else:
            session = get_object_or_404(
                AIAssistantSession,
                session_id=session_id,
                user=request.user
            )
        
        # Save user message
        user_message = AIAssistantMessage.objects.create(
            session=session,
            message_type='user',
            content=serializer.validated_data['query'],
            metadata=serializer.validated_data.get('context', {})
        )
        
        # Process with AI
        ai_service = AIAssistantService()
        result = ai_service.process_assistant_query(
            query=serializer.validated_data['query'],
            user=request.user,
            context=serializer.validated_data.get('context', {})
        )
        
        if result['success']:
            # Save AI response
            ai_message = AIAssistantMessage.objects.create(
                session=session,
                message_type='assistant',
                content=result['data']['response'],
                metadata={
                    'action': result['data'].get('action', 'none'),
                    'payload': result['data'].get('payload', ''),
                    'processing_time': result.get('processing_time', 0)
                }
            )
            
            return Response({
                'success': True,
                'session_id': session.session_id,
                'response': result['data']['response'],
                'action': result['data'].get('action', 'none'),
                'payload': result['data'].get('payload', ''),
                'processing_time': result.get('processing_time', 0)
            }, status=status.HTTP_200_OK)
        else:
            # Save error message
            AIAssistantMessage.objects.create(
                session=session,
                message_type='system',
                content=f"Erro: {result['error']}",
                metadata={'error': True}
            )
            
            return Response({
                'success': False,
                'error': result['error']
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"AI Assistant error: {e}")
        return Response({
            'success': False,
            'error': 'Erro interno do servidor'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def assess_vehicle_damage(request):
    """Assess vehicle damage using AI."""
    serializer = VehicleDamageRequestSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Get objects
        checklist = get_object_or_404(
            CompletedChecklist,
            id=serializer.validated_data['checklist_id']
        )
        vehicle = get_object_or_404(
            Vehicle,
            id=serializer.validated_data['vehicle_id']
        )
        
        # Create assessment record
        assessment = VehicleDamageAssessment.objects.create(
            checklist=checklist,
            vehicle=vehicle,
            image_url=serializer.validated_data['image_url'],
            image_base64=serializer.validated_data.get('image_base64', ''),
            status='processing'
        )
        
        # Process with AI
        ai_service = AIAssistantService()
        result = ai_service.assess_vehicle_damage(
            image_base64=serializer.validated_data.get('image_base64', ''),
            checklist_id=serializer.validated_data['checklist_id'],
            vehicle_id=serializer.validated_data['vehicle_id'],
            user=request.user
        )
        
        if result['success']:
            # Update assessment
            assessment.damage_detected = result['data'].get('damageDetected', False)
            assessment.damage_description = result['data'].get('damageDescription', '')
            assessment.status = 'completed'
            assessment.processing_time = result.get('processing_time', 0)
            assessment.save()
            
            return Response({
                'success': True,
                'assessment_id': assessment.id,
                'damage_detected': assessment.damage_detected,
                'damage_description': assessment.damage_description,
                'processing_time': assessment.processing_time
            }, status=status.HTTP_200_OK)
        else:
            # Update assessment with error
            assessment.status = 'failed'
            assessment.save()
            
            return Response({
                'success': False,
                'error': result['error']
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        logger.error(f"Vehicle damage assessment error: {e}")
        return Response({
            'success': False,
            'error': 'Erro interno do servidor'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VehicleDamageAssessmentView(generics.ListAPIView):
    """View for vehicle damage assessments."""
    serializer_class = VehicleDamageAssessmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return VehicleDamageAssessment.objects.filter(
            checklist__created_by=self.request.user
        ).order_by('-created_at')


class TireAnalysisView(generics.ListCreateAPIView):
    """View for tire analysis."""
    serializer_class = TireAnalysisSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TireAnalysis.objects.filter(
            tire__created_by=self.request.user
        ).order_by('-created_at')


class AIUsageLogView(generics.ListAPIView):
    """View for AI usage logs."""
    serializer_class = AIUsageLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return AIUsageLog.objects.filter(user=self.request.user).order_by('-created_at')


class AIConfigurationView(generics.ListAPIView):
    """View for AI configuration (admin only)."""
    serializer_class = AIConfigurationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Only show to admin users
        if self.request.user.role == 'admin':
            return AIConfiguration.objects.all()
        return AIConfiguration.objects.none()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ai_service_status(request):
    """Check AI service status."""
    try:
        ai_service = AIAssistantService()
        service = ai_service.get_ai_service()
        
        return Response({
            'success': True,
            'service_name': service.service_name,
            'is_configured': True
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': 'Nenhum serviço de IA configurado',
            'details': str(e)
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ai_usage_stats(request):
    """Get AI usage statistics for user."""
    try:
        user_logs = AIUsageLog.objects.filter(user=request.user)
        
        total_requests = user_logs.count()
        successful_requests = user_logs.filter(success=True).count()
        total_cost = sum(log.cost for log in user_logs)
        total_processing_time = sum(log.processing_time for log in user_logs)
        
        return Response({
            'success': True,
            'stats': {
                'total_requests': total_requests,
                'successful_requests': successful_requests,
                'success_rate': (successful_requests / total_requests * 100) if total_requests > 0 else 0,
                'total_cost': float(total_cost),
                'total_processing_time': total_processing_time,
                'average_processing_time': (total_processing_time / total_requests) if total_requests > 0 else 0
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"AI usage stats error: {e}")
        return Response({
            'success': False,
            'error': 'Erro ao obter estatísticas'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)