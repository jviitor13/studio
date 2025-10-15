"""
Exceções customizadas para o RodoCheck Backend.
Este módulo define exceções específicas para melhor tratamento de erros.
"""

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler
from django.core.exceptions import ValidationError, PermissionDenied
from django.http import Http404
import logging

logger = logging.getLogger('rodocheck')


class RodoCheckException(Exception):
    """Exceção base para erros específicos do RodoCheck."""
    
    def __init__(self, message, error_code=None, status_code=status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        super().__init__(message)


class AuthenticationError(RodoCheckException):
    """Erro de autenticação."""
    
    def __init__(self, message="Erro de autenticação", error_code="AUTH_ERROR"):
        super().__init__(message, error_code, status.HTTP_401_UNAUTHORIZED)


class AuthorizationError(RodoCheckException):
    """Erro de autorização."""
    
    def __init__(self, message="Acesso negado", error_code="AUTHZ_ERROR"):
        super().__init__(message, error_code, status.HTTP_403_FORBIDDEN)


class ValidationError(RodoCheckException):
    """Erro de validação de dados."""
    
    def __init__(self, message="Dados inválidos", error_code="VALIDATION_ERROR"):
        super().__init__(message, error_code, status.HTTP_400_BAD_REQUEST)


class NotFoundError(RodoCheckException):
    """Recurso não encontrado."""
    
    def __init__(self, message="Recurso não encontrado", error_code="NOT_FOUND"):
        super().__init__(message, error_code, status.HTTP_404_NOT_FOUND)


class AIServiceError(RodoCheckException):
    """Erro no serviço de IA."""
    
    def __init__(self, message="Erro no serviço de IA", error_code="AI_SERVICE_ERROR"):
        super().__init__(message, error_code, status.HTTP_503_SERVICE_UNAVAILABLE)


class ExternalServiceError(RodoCheckException):
    """Erro em serviço externo."""
    
    def __init__(self, message="Erro em serviço externo", error_code="EXTERNAL_SERVICE_ERROR"):
        super().__init__(message, error_code, status.HTTP_502_BAD_GATEWAY)


def custom_exception_handler(exc, context):
    """
    Handler customizado para exceções do Django REST Framework.
    Fornece tratamento consistente de erros em toda a aplicação.
    """
    
    # Log do erro para monitoramento
    logger.error(f"Exception in {context.get('view', 'Unknown view')}: {str(exc)}")
    
    # Se for uma exceção customizada do RodoCheck
    if isinstance(exc, RodoCheckException):
        return Response({
            'error': exc.message,
            'error_code': exc.error_code,
            'success': False
        }, status=exc.status_code)
    
    # Tratamento de exceções Django específicas
    if isinstance(exc, ValidationError):
        return Response({
            'error': 'Dados inválidos',
            'error_code': 'VALIDATION_ERROR',
            'details': exc.message_dict if hasattr(exc, 'message_dict') else str(exc),
            'success': False
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if isinstance(exc, PermissionDenied):
        return Response({
            'error': 'Acesso negado',
            'error_code': 'PERMISSION_DENIED',
            'success': False
        }, status=status.HTTP_403_FORBIDDEN)
    
    if isinstance(exc, Http404):
        return Response({
            'error': 'Recurso não encontrado',
            'error_code': 'NOT_FOUND',
            'success': False
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Usar o handler padrão do DRF para outras exceções
    response = exception_handler(exc, context)
    
    if response is not None:
        # Padronizar formato de resposta
        custom_response_data = {
            'error': response.data.get('detail', 'Erro interno do servidor'),
            'error_code': 'INTERNAL_ERROR',
            'success': False
        }
        
        # Adicionar detalhes se disponíveis
        if isinstance(response.data, dict) and len(response.data) > 1:
            custom_response_data['details'] = response.data
        
        response.data = custom_response_data
    
    return response


def handle_api_exception(func):
    """
    Decorator para tratamento de exceções em views da API.
    Fornece tratamento consistente de erros com logging adequado.
    """
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except RodoCheckException as e:
            # Exceções customizadas já têm tratamento adequado
            raise e
        except ValidationError as e:
            logger.warning(f"Validation error in {func.__name__}: {str(e)}")
            raise ValidationError(f"Dados inválidos: {str(e)}")
        except PermissionDenied as e:
            logger.warning(f"Permission denied in {func.__name__}: {str(e)}")
            raise AuthorizationError("Acesso negado")
        except Http404 as e:
            logger.warning(f"Resource not found in {func.__name__}: {str(e)}")
            raise NotFoundError("Recurso não encontrado")
        except Exception as e:
            # Log do erro inesperado
            logger.error(f"Unexpected error in {func.__name__}: {str(e)}", exc_info=True)
            raise RodoCheckException(
                "Erro interno do servidor",
                "INTERNAL_ERROR",
                status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    return wrapper

