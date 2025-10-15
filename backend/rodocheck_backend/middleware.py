"""
Middleware para RodoCheck Backend.
Este arquivo mantém compatibilidade com o middleware existente.
"""

import logging
import time
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger('rodocheck')


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware para logging de requisições (versão simplificada).
    Para funcionalidades avançadas, use security_middleware.py
    """
    
    def process_request(self, request):
        """Log incoming request."""
        request.start_time = time.time()
        logger.info(f"Request: {request.method} {request.path} - User: {getattr(request, 'user', 'Anonymous')}")
    
    def process_response(self, request, response):
        """Log response."""
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            logger.info(f"Response: {request.method} {request.path} - Status: {response.status_code} - Duration: {duration:.2f}s")
        return response
