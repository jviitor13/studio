"""
Middleware de segurança para RodoCheck Backend.
Este módulo implementa headers de segurança e proteções adicionais.
"""

import logging
from django.http import HttpResponse
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
import time

logger = logging.getLogger('rodocheck')


class SecurityHeadersMiddleware(MiddlewareMixin):
    """
    Middleware para adicionar headers de segurança HTTP.
    """
    
    def process_response(self, request, response):
        """
        Adiciona headers de segurança à resposta HTTP.
        
        Args:
            request: Objeto de requisição
            response: Objeto de resposta
            
        Returns:
            HttpResponse com headers de segurança
        """
        # Headers de segurança básicos
        security_headers = {
            # Prevenir clickjacking
            'X-Frame-Options': 'DENY',
            
            # Prevenir MIME type sniffing
            'X-Content-Type-Options': 'nosniff',
            
            # Política de referrer
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            
            # Proteção XSS (legacy, mas ainda útil)
            'X-XSS-Protection': '1; mode=block',
            
            # Content Security Policy básica
            'Content-Security-Policy': self._get_csp_header(),
            
            # Permissions Policy (substitui Feature-Policy)
            'Permissions-Policy': self._get_permissions_policy(),
            
            # Strict Transport Security (apenas em HTTPS)
            'Strict-Transport-Security': self._get_hsts_header(),
            
            # Cross-Origin policies
            'Cross-Origin-Embedder-Policy': 'require-corp',
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Resource-Policy': 'same-origin',
        }
        
        # Adicionar headers de segurança
        for header, value in security_headers.items():
            if value:  # Apenas adicionar se o valor não for None/empty
                response[header] = value
        
        # Remover headers que podem vazar informações
        self._remove_sensitive_headers(response)
        
        return response
    
    def _get_csp_header(self):
        """
        Gera Content Security Policy header.
        
        Returns:
            str: CSP header value
        """
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://apis.google.com https://accounts.google.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: blob:",
            "connect-src 'self' https://api.openai.com https://generativelanguage.googleapis.com",
            "frame-src 'self' https://accounts.google.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'",
            "frame-ancestors 'none'",
        ]
        
        return '; '.join(csp_directives)
    
    def _get_permissions_policy(self):
        """
        Gera Permissions Policy header.
        
        Returns:
            str: Permissions Policy header value
        """
        permissions = [
            'camera=()',
            'microphone=()',
            'geolocation=()',
            'payment=()',
            'usb=()',
            'magnetometer=()',
            'gyroscope=()',
            'accelerometer=()',
        ]
        
        return ', '.join(permissions)
    
    def _get_hsts_header(self):
        """
        Gera Strict-Transport-Security header.
        
        Returns:
            str: HSTS header value ou None se não em HTTPS
        """
        # Apenas adicionar HSTS se estiver em produção e HTTPS
        if getattr(settings, 'SECURE_SSL_REDIRECT', False):
            max_age = getattr(settings, 'SECURE_HSTS_SECONDS', 31536000)
            include_subdomains = getattr(settings, 'SECURE_HSTS_INCLUDE_SUBDOMAINS', True)
            preload = getattr(settings, 'SECURE_HSTS_PRELOAD', True)
            
            hsts_value = f'max-age={max_age}'
            if include_subdomains:
                hsts_value += '; includeSubDomains'
            if preload:
                hsts_value += '; preload'
            
            return hsts_value
        
        return None
    
    def _remove_sensitive_headers(self, response):
        """
        Remove headers que podem vazar informações sensíveis.
        
        Args:
            response: Objeto de resposta
        """
        sensitive_headers = [
            'Server',
            'X-Powered-By',
            'X-AspNet-Version',
            'X-AspNetMvc-Version',
        ]
        
        for header in sensitive_headers:
            if header in response:
                del response[header]


class RateLimitMiddleware(MiddlewareMixin):
    """
    Middleware para rate limiting básico.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        self.requests = {}  # Em produção, usar Redis
        super().__init__(get_response)
    
    def process_request(self, request):
        """
        Verifica rate limiting para a requisição.
        
        Args:
            request: Objeto de requisição
            
        Returns:
            HttpResponse com erro 429 se limite excedido
        """
        # Obter IP do cliente
        client_ip = self._get_client_ip(request)
        current_time = time.time()
        
        # Limpar requisições antigas (mais de 1 hora)
        self._clean_old_requests(current_time)
        
        # Verificar rate limit
        if self._is_rate_limited(client_ip, current_time):
            logger.warning(f"Rate limit exceeded for IP: {client_ip}")
            return HttpResponse(
                'Rate limit exceeded. Please try again later.',
                status=429,
                content_type='text/plain'
            )
        
        # Registrar requisição
        self._record_request(client_ip, current_time)
        
        return None
    
    def _get_client_ip(self, request):
        """
        Obtém o IP real do cliente considerando proxies.
        
        Args:
            request: Objeto de requisição
            
        Returns:
            str: IP do cliente
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def _clean_old_requests(self, current_time):
        """
        Remove requisições antigas do cache.
        
        Args:
            current_time: Timestamp atual
        """
        cutoff_time = current_time - 3600  # 1 hora atrás
        self.requests = {
            ip: times for ip, times in self.requests.items()
            if any(t > cutoff_time for t in times)
        }
    
    def _is_rate_limited(self, client_ip, current_time):
        """
        Verifica se o IP está sendo rate limited.
        
        Args:
            client_ip: IP do cliente
            current_time: Timestamp atual
            
        Returns:
            bool: True se rate limited
        """
        if client_ip not in self.requests:
            return False
        
        # Contar requisições na última hora
        cutoff_time = current_time - 3600
        recent_requests = [
            t for t in self.requests[client_ip] if t > cutoff_time
        ]
        
        # Limite: 1000 requisições por hora
        return len(recent_requests) >= 1000
    
    def _record_request(self, client_ip, current_time):
        """
        Registra uma nova requisição.
        
        Args:
            client_ip: IP do cliente
            current_time: Timestamp atual
        """
        if client_ip not in self.requests:
            self.requests[client_ip] = []
        
        self.requests[client_ip].append(current_time)


class RequestLoggingMiddleware(MiddlewareMixin):
    """
    Middleware melhorado para logging de requisições.
    """
    
    def process_request(self, request):
        """
        Log da requisição de entrada.
        
        Args:
            request: Objeto de requisição
        """
        request.start_time = time.time()
        
        # Log apenas para endpoints importantes
        if self._should_log_request(request):
            logger.info(
                f"Request: {request.method} {request.path} - "
                f"User: {getattr(request, 'user', 'Anonymous')} - "
                f"IP: {self._get_client_ip(request)}"
            )
    
    def process_response(self, request, response):
        """
        Log da resposta.
        
        Args:
            request: Objeto de requisição
            response: Objeto de resposta
            
        Returns:
            HttpResponse
        """
        if hasattr(request, 'start_time'):
            duration = time.time() - request.start_time
            
            # Log apenas para endpoints importantes ou erros
            if self._should_log_response(request, response):
                logger.info(
                    f"Response: {request.method} {request.path} - "
                    f"Status: {response.status_code} - "
                    f"Duration: {duration:.2f}s"
                )
        
        return response
    
    def _should_log_request(self, request):
        """
        Determina se deve logar a requisição.
        
        Args:
            request: Objeto de requisição
            
        Returns:
            bool: True se deve logar
        """
        # Log para endpoints da API
        return request.path.startswith('/api/')
    
    def _should_log_response(self, request, response):
        """
        Determina se deve logar a resposta.
        
        Args:
            request: Objeto de requisição
            response: Objeto de resposta
            
        Returns:
            bool: True se deve logar
        """
        # Log para endpoints da API ou erros
        return (
            request.path.startswith('/api/') or
            response.status_code >= 400
        )
    
    def _get_client_ip(self, request):
        """
        Obtém o IP do cliente.
        
        Args:
            request: Objeto de requisição
            
        Returns:
            str: IP do cliente
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')

