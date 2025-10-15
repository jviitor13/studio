"""
Validador de variáveis de ambiente para RodoCheck Backend.
Este módulo valida se todas as variáveis de ambiente necessárias estão definidas.
"""

import os
from typing import Dict, List, Optional, Any
from decouple import config, UndefinedValueError
from django.core.exceptions import ImproperlyConfigured
import logging

logger = logging.getLogger('rodocheck')


class EnvironmentValidator:
    """
    Validador de variáveis de ambiente para diferentes ambientes.
    """
    
    # Variáveis obrigatórias para produção
    PRODUCTION_REQUIRED_VARS = {
        'SECRET_KEY': 'Chave secreta do Django para produção',
        'DB_NAME': 'Nome do banco de dados PostgreSQL',
        'DB_USER': 'Usuário do banco de dados',
        'DB_PASSWORD': 'Senha do banco de dados',
        'DB_HOST': 'Host do banco de dados',
        'GOOGLE_OAUTH_CLIENT_ID': 'Client ID do Google OAuth',
        'GOOGLE_OAUTH_CLIENT_SECRET': 'Client Secret do Google OAuth',
    }
    
    # Variáveis obrigatórias para desenvolvimento
    DEVELOPMENT_REQUIRED_VARS = {
        'SECRET_KEY': 'Chave secreta do Django',
    }
    
    # Variáveis opcionais com valores padrão
    OPTIONAL_VARS = {
        'DEBUG': 'True',
        'DB_PORT': '5432',
        'DB_SSLMODE': 'prefer',
        'DB_CONN_MAX_AGE': '60',
        'REDIS_URL': 'redis://localhost:6379/1',
        'CELERY_BROKER_URL': 'redis://localhost:6379/0',
        'CELERY_RESULT_BACKEND': 'redis://localhost:6379/0',
        'EMAIL_HOST': 'smtp.gmail.com',
        'EMAIL_PORT': '587',
        'EMAIL_HOST_USER': '',
        'EMAIL_HOST_PASSWORD': '',
        'DEFAULT_FROM_EMAIL': 'noreply@rodocheck.com',
        'ALLOWED_HOSTS': 'localhost,127.0.0.1',
        'CORS_ALLOWED_ORIGINS': 'http://localhost:3000,http://localhost:9002',
        'SECURE_SSL_REDIRECT': 'False',
        'SECURE_HSTS_SECONDS': '31536000',
        'BACKUP_RETENTION_DAYS': '30',
        'ENABLE_DEBUG_TOOLBAR': 'False',
    }
    
    # Variáveis de IA (opcionais)
    AI_VARS = {
        'OPENAI_API_KEY': '',
        'GOOGLE_AI_API_KEY': '',
        'GEMINI_API_KEY': '',
        'GOOGLE_DRIVE_CREDENTIALS_FILE': '',
        'GOOGLE_DRIVE_FOLDER_ID': '',
    }
    
    def __init__(self, environment: str = 'development'):
        """
        Inicializa o validador para um ambiente específico.
        
        Args:
            environment: Ambiente ('development', 'production', 'testing')
        """
        self.environment = environment
        self.errors: List[str] = []
        self.warnings: List[str] = []
        
    def validate_environment(self) -> bool:
        """
        Valida todas as variáveis de ambiente necessárias.
        
        Returns:
            bool: True se todas as validações passaram, False caso contrário
        """
        self.errors.clear()
        self.warnings.clear()
        
        # Validar variáveis obrigatórias baseadas no ambiente
        if self.environment == 'production':
            self._validate_required_vars(self.PRODUCTION_REQUIRED_VARS)
        elif self.environment == 'development':
            self._validate_required_vars(self.DEVELOPMENT_REQUIRED_VARS)
        
        # Validar variáveis opcionais
        self._validate_optional_vars()
        
        # Validar variáveis de IA
        self._validate_ai_vars()
        
        # Validar configurações específicas
        self._validate_specific_configs()
        
        # Log dos resultados
        self._log_validation_results()
        
        return len(self.errors) == 0
    
    def _validate_required_vars(self, required_vars: Dict[str, str]) -> None:
        """
        Valida variáveis obrigatórias.
        
        Args:
            required_vars: Dicionário com variáveis obrigatórias e suas descrições
        """
        for var_name, description in required_vars.items():
            try:
                value = config(var_name)
                if not value or value.strip() == '':
                    self.errors.append(f"Variável obrigatória '{var_name}' está vazia. {description}")
            except UndefinedValueError:
                self.errors.append(f"Variável obrigatória '{var_name}' não foi definida. {description}")
    
    def _validate_optional_vars(self) -> None:
        """
        Valida variáveis opcionais e define valores padrão se necessário.
        """
        for var_name, default_value in self.OPTIONAL_VARS.items():
            try:
                value = config(var_name, default=default_value)
                # Validações específicas para algumas variáveis
                if var_name == 'DEBUG' and self.environment == 'production':
                    if value.lower() in ['true', '1', 'yes']:
                        self.warnings.append("DEBUG está habilitado em produção. Isso é inseguro!")
                
                if var_name == 'SECRET_KEY' and value == 'django-insecure-change-me-in-production':
                    if self.environment == 'production':
                        self.errors.append("SECRET_KEY não pode usar o valor padrão em produção!")
                    else:
                        self.warnings.append("SECRET_KEY está usando valor padrão. Considere definir uma chave personalizada.")
                
                if var_name == 'ALLOWED_HOSTS' and self.environment == 'production':
                    if 'localhost' in value or '127.0.0.1' in value:
                        self.warnings.append("ALLOWED_HOSTS contém localhost em produção. Configure domínios de produção.")
                        
            except Exception as e:
                self.warnings.append(f"Erro ao validar variável '{var_name}': {str(e)}")
    
    def _validate_ai_vars(self) -> None:
        """
        Valida variáveis relacionadas a IA.
        """
        ai_services_configured = 0
        
        for var_name, default_value in self.AI_VARS.items():
            try:
                value = config(var_name, default=default_value)
                if value and value.strip() != '':
                    ai_services_configured += 1
            except Exception as e:
                self.warnings.append(f"Erro ao validar variável de IA '{var_name}': {str(e)}")
        
        if ai_services_configured == 0:
            self.warnings.append("Nenhum serviço de IA configurado. Funcionalidades de IA não estarão disponíveis.")
        elif ai_services_configured < 2:
            self.warnings.append("Apenas um serviço de IA configurado. Considere configurar múltiplos para redundância.")
    
    def _validate_specific_configs(self) -> None:
        """
        Valida configurações específicas do ambiente.
        """
        if self.environment == 'production':
            # Validar configurações de produção
            try:
                debug = config('DEBUG', default='False', cast=bool)
                if debug:
                    self.errors.append("DEBUG deve ser False em produção")
            except Exception:
                pass
            
            try:
                allowed_hosts = config('ALLOWED_HOSTS', default='')
                if not allowed_hosts or allowed_hosts.strip() == '':
                    self.errors.append("ALLOWED_HOSTS deve ser definido em produção")
            except Exception:
                pass
            
            # Validar configurações de banco
            try:
                db_engine = config('DB_ENGINE', default='django.db.backends.postgresql')
                if 'sqlite' in db_engine:
                    self.errors.append("SQLite não é recomendado para produção. Use PostgreSQL.")
            except Exception:
                pass
    
    def _log_validation_results(self) -> None:
        """
        Registra os resultados da validação no log.
        """
        if self.errors:
            logger.error(f"Erros de validação de ambiente ({self.environment}):")
            for error in self.errors:
                logger.error(f"  - {error}")
        
        if self.warnings:
            logger.warning(f"Avisos de validação de ambiente ({self.environment}):")
            for warning in self.warnings:
                logger.warning(f"  - {warning}")
        
        if not self.errors and not self.warnings:
            logger.info(f"Validação de ambiente ({self.environment}) concluída com sucesso")
    
    def get_validation_report(self) -> Dict[str, Any]:
        """
        Retorna um relatório detalhado da validação.
        
        Returns:
            Dict com relatório de validação
        """
        return {
            'environment': self.environment,
            'is_valid': len(self.errors) == 0,
            'errors': self.errors,
            'warnings': self.warnings,
            'total_errors': len(self.errors),
            'total_warnings': len(self.warnings),
        }


def validate_environment(environment: str = 'development') -> bool:
    """
    Função de conveniência para validar o ambiente.
    
    Args:
        environment: Ambiente a ser validado
        
    Returns:
        bool: True se válido, False caso contrário
        
    Raises:
        ImproperlyConfigured: Se houver erros críticos
    """
    validator = EnvironmentValidator(environment)
    is_valid = validator.validate_environment()
    
    if not is_valid:
        error_msg = f"Erros de configuração de ambiente ({environment}):\n"
        for error in validator.errors:
            error_msg += f"  - {error}\n"
        raise ImproperlyConfigured(error_msg)
    
    return True


def get_environment_report(environment: str = 'development') -> Dict[str, Any]:
    """
    Obtém um relatório detalhado do ambiente.
    
    Args:
        environment: Ambiente a ser analisado
        
    Returns:
        Dict com relatório detalhado
    """
    validator = EnvironmentValidator(environment)
    validator.validate_environment()
    return validator.get_validation_report()


# Validação automática ao importar o módulo
if __name__ == '__main__':
    # Validar ambiente baseado na variável DJANGO_SETTINGS_MODULE
    import os
    settings_module = os.environ.get('DJANGO_SETTINGS_MODULE', '')
    
    if 'production' in settings_module:
        validate_environment('production')
    elif 'test' in settings_module:
        validate_environment('testing')
    else:
        validate_environment('development')

