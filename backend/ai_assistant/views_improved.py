"""
Views melhoradas para AI Assistant functionality com tratamento robusto de erros.
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
    """View for AI assistant sessions with improved error handling."""
    serializer_class = AIAssistantSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get sessions for the current user."""
        try:
            return AIAssistantSession.objects.filter(user=self.request.user)
        except Exception as e:
            logger.error(f"Error getting AI sessions: {e}")
            raise RodoCheckException("Erro ao buscar sessões de IA")
    
    @handle_api_exception
    def perform_create(self, serializer):
        """Create a new AI session."""
        session_id = str(uuid.uuid4())
        serializer.save(user=self.request.user, session_id=session_id)


class AIAssistantMessageView(generics.ListCreateAPIView):
    """View for AI assistant messages with improved error handling."""
    serializer_class = AIAssistantMessageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get messages for the current user's sessions."""
        try:
            session_id = self.request.query_params.get('session_id')
            if session_id:
                return AIAssistantMessage.objects.filter(
                    session__session_id=session_id,
                    session__user=self.request.user
                )
            return AIAssistantMessage.objects.filter(
                session__user=self.request.user
            )
        except Exception as e:
            logger.error(f"Error getting AI messages: {e}")
            raise RodoCheckException("Erro ao buscar mensagens de IA")
    
    @handle_api_exception
    def perform_create(self, serializer):
        """Create a new AI message."""
        session_id = self.request.data.get('session_id')
        if not session_id:
            raise RodoCheckValidationError("session_id é obrigatório")
        
        try:
            session = AIAssistantSession.objects.get(
                session_id=session_id,
                user=self.request.user
            )
        except AIAssistantSession.DoesNotExist:
            raise NotFoundError("Sessão não encontrada")
        
        serializer.save(session=session)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@handle_api_exception
def ai_assistant_chat(request):
    """
    Handle AI assistant chat requests with robust error handling.
    
    Args:
        request: HTTP request with chat data
        
    Returns:
        Response with AI assistant response or error
        
    Raises:
        RodoCheckValidationError: If input data is invalid
        AIServiceError: If AI service fails
        ExternalServiceError: If external service fails
    """
    # Validar dados de entrada
    serializer = AIAssistantRequestSerializer(data=request.data)
    if not serializer.is_valid():
        raise RodoCheckValidationError(f"Dados inválidos: {serializer.errors}")
    
    # Obter ou criar sessão
    session_id = serializer.validated_data.get('session_id')
    if not session_id:
        session_id = str(uuid.uuid4())
        try:
            session = AIAssistantSession.objects.create(
                user=request.user,
                session_id=session_id
            )
        except Exception as e:
            logger.error(f"Error creating AI session: {e}")
            raise RodoCheckException("Erro ao criar sessão de IA")
    else:
        try:
            session = AIAssistantSession.objects.get(
                session_id=session_id,
                user=request.user
            )
        except AIAssistantSession.DoesNotExist:
            raise NotFoundError("Sessão não encontrada")
    
    # Salvar mensagem do usuário
    try:
        user_message = AIAssistantMessage.objects.create(
            session=session,
            message_type='user',
            content=serializer.validated_data['query'],
            metadata=serializer.validated_data.get('context', {})
        )
    except Exception as e:
        logger.error(f"Error saving user message: {e}")
        raise RodoCheckException("Erro ao salvar mensagem do usuário")
    
    # Processar com IA
    try:
        ai_service = AIAssistantService()
        result = ai_service.process_assistant_query(
            query=serializer.validated_data['query'],
            user=request.user,
            context=serializer.validated_data.get('context', {})
        )
    except Exception as e:
        logger.error(f"AI Service error: {e}")
        raise AIServiceError(f"Erro no serviço de IA: {str(e)}")
    
    if result['success']:
        # Salvar resposta da IA
        try:
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
        except Exception as e:
            logger.error(f"Error saving AI response: {e}")
            # Continuar mesmo com erro ao salvar resposta
        
        return Response({
            'success': True,
            'session_id': session.session_id,
            'response': result['data']['response'],
            'action': result['data'].get('action', 'none'),
            'payload': result['data'].get('payload', ''),
            'processing_time': result.get('processing_time', 0)
        }, status=status.HTTP_200_OK)
    else:
        # Salvar mensagem de erro
        try:
            AIAssistantMessage.objects.create(
                session=session,
                message_type='system',
                content=f"Erro: {result['error']}",
                metadata={'error': True}
            )
        except Exception as e:
            logger.error(f"Error saving error message: {e}")
        
        raise AIServiceError(f"Erro no processamento da IA: {result['error']}")


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@handle_api_exception
def assess_vehicle_damage(request):
    """
    Assess vehicle damage using AI with robust error handling.
    
    Args:
        request: HTTP request with damage assessment data
        
    Returns:
        Response with damage assessment results
        
    Raises:
        RodoCheckValidationError: If input data is invalid
        NotFoundError: If checklist not found
        AIServiceError: If AI service fails
    """
    # Validar dados de entrada
    serializer = VehicleDamageRequestSerializer(data=request.data)
    if not serializer.is_valid():
        raise RodoCheckValidationError(f"Dados inválidos: {serializer.errors}")
    
    # Buscar checklist
    try:
        checklist = CompletedChecklist.objects.get(
            id=serializer.validated_data['checklist_id'],
            created_by=request.user
        )
    except CompletedChecklist.DoesNotExist:
        raise NotFoundError("Checklist não encontrado")
    
    # Criar avaliação de danos
    try:
        assessment = VehicleDamageAssessment.objects.create(
            checklist=checklist,
            vehicle=checklist.vehicle,
            images=serializer.validated_data.get('images', []),
            user=request.user
        )
    except Exception as e:
        logger.error(f"Error creating damage assessment: {e}")
        raise RodoCheckException("Erro ao criar avaliação de danos")
    
    # Processar com IA
    try:
        ai_service = AIAssistantService()
        result = ai_service.assess_vehicle_damage(
            images=serializer.validated_data.get('images', []),
            vehicle_info={
                'plate': checklist.vehicle.plate,
                'model': checklist.vehicle.model,
                'brand': checklist.vehicle.brand
            },
            user=request.user
        )
    except Exception as e:
        logger.error(f"AI Service error in damage assessment: {e}")
        assessment.status = 'failed'
        assessment.save()
        raise AIServiceError(f"Erro no serviço de IA: {str(e)}")
    
    if result['success']:
        # Atualizar avaliação
        try:
            assessment.damage_detected = result['data'].get('damageDetected', False)
            assessment.damage_description = result['data'].get('damageDescription', '')
            assessment.status = 'completed'
            assessment.processing_time = result.get('processing_time', 0)
            assessment.save()
        except Exception as e:
            logger.error(f"Error updating assessment: {e}")
            raise RodoCheckException("Erro ao atualizar avaliação")
        
        return Response({
            'success': True,
            'assessment_id': assessment.id,
            'damage_detected': assessment.damage_detected,
            'damage_description': assessment.damage_description,
            'processing_time': assessment.processing_time
        }, status=status.HTTP_200_OK)
    else:
        # Atualizar avaliação com erro
        try:
            assessment.status = 'failed'
            assessment.save()
        except Exception as e:
            logger.error(f"Error updating failed assessment: {e}")
        
        raise AIServiceError(f"Erro no processamento da IA: {result['error']}")


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@handle_api_exception
def analyze_tire_condition(request):
    """
    Analyze tire condition using AI with robust error handling.
    
    Args:
        request: HTTP request with tire analysis data
        
    Returns:
        Response with tire analysis results
        
    Raises:
        RodoCheckValidationError: If input data is invalid
        NotFoundError: If tire not found
        AIServiceError: If AI service fails
    """
    # Validar dados de entrada
    serializer = TireAnalysisRequestSerializer(data=request.data)
    if not serializer.is_valid():
        raise RodoCheckValidationError(f"Dados inválidos: {serializer.errors}")
    
    # Buscar pneu
    try:
        tire = get_object_or_404(
            Tire,
            id=serializer.validated_data['tire_id']
        )
    except Exception as e:
        logger.error(f"Error finding tire: {e}")
        raise NotFoundError("Pneu não encontrado")
    
    # Criar análise de pneu
    try:
        analysis = TireAnalysis.objects.create(
            tire=tire,
            images=serializer.validated_data.get('images', []),
            user=request.user
        )
    except Exception as e:
        logger.error(f"Error creating tire analysis: {e}")
        raise RodoCheckException("Erro ao criar análise de pneu")
    
    # Processar com IA
    try:
        ai_service = AIAssistantService()
        result = ai_service.analyze_tire_condition(
            images=serializer.validated_data.get('images', []),
            tire_info={
                'serial_number': tire.serial_number,
                'brand': tire.brand,
                'model': tire.model
            },
            user=request.user
        )
    except Exception as e:
        logger.error(f"AI Service error in tire analysis: {e}")
        analysis.status = 'failed'
        analysis.save()
        raise AIServiceError(f"Erro no serviço de IA: {str(e)}")
    
    if result['success']:
        # Atualizar análise
        try:
            analysis.condition_score = result['data'].get('conditionScore', 0)
            analysis.wear_level = result['data'].get('wearLevel', 'unknown')
            analysis.recommendations = result['data'].get('recommendations', [])
            analysis.status = 'completed'
            analysis.processing_time = result.get('processing_time', 0)
            analysis.save()
        except Exception as e:
            logger.error(f"Error updating tire analysis: {e}")
            raise RodoCheckException("Erro ao atualizar análise de pneu")
        
        return Response({
            'success': True,
            'analysis_id': analysis.id,
            'condition_score': analysis.condition_score,
            'wear_level': analysis.wear_level,
            'recommendations': analysis.recommendations,
            'processing_time': analysis.processing_time
        }, status=status.HTTP_200_OK)
    else:
        # Atualizar análise com erro
        try:
            analysis.status = 'failed'
            analysis.save()
        except Exception as e:
            logger.error(f"Error updating failed analysis: {e}")
        
        raise AIServiceError(f"Erro no processamento da IA: {result['error']}")


class VehicleDamageAssessmentView(generics.ListAPIView):
    """View for vehicle damage assessments with improved error handling."""
    serializer_class = VehicleDamageAssessmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get damage assessments for the current user."""
        try:
            return VehicleDamageAssessment.objects.filter(user=self.request.user)
        except Exception as e:
            logger.error(f"Error getting damage assessments: {e}")
            raise RodoCheckException("Erro ao buscar avaliações de danos")


class TireAnalysisView(generics.ListAPIView):
    """View for tire analyses with improved error handling."""
    serializer_class = TireAnalysisSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get tire analyses for the current user."""
        try:
            return TireAnalysis.objects.filter(user=self.request.user)
        except Exception as e:
            logger.error(f"Error getting tire analyses: {e}")
            raise RodoCheckException("Erro ao buscar análises de pneus")


class AIConfigurationView(generics.ListCreateAPIView):
    """View for AI configuration with improved error handling."""
    serializer_class = AIConfigurationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get AI configurations."""
        try:
            return AIConfiguration.objects.filter(is_active=True)
        except Exception as e:
            logger.error(f"Error getting AI configurations: {e}")
            raise RodoCheckException("Erro ao buscar configurações de IA")
    
    @handle_api_exception
    def perform_create(self, serializer):
        """Create a new AI configuration."""
        serializer.save()


class AIUsageLogView(generics.ListAPIView):
    """View for AI usage logs with improved error handling."""
    serializer_class = AIUsageLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get AI usage logs for the current user."""
        try:
            return AIUsageLog.objects.filter(user=self.request.user)
        except Exception as e:
            logger.error(f"Error getting AI usage logs: {e}")
            raise RodoCheckException("Erro ao buscar logs de uso de IA")

