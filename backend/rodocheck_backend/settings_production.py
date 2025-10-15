"""
Configurações de produção para RodoCheck Backend.
Este arquivo contém todas as configurações otimizadas para ambiente de produção.
"""

import os
from pathlib import Path
from decouple import config, Csv
from django.core.exceptions import ImproperlyConfigured

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# =============================================================================
# VALIDAÇÃO DE VARIÁVEIS DE AMBIENTE OBRIGATÓRIAS
# =============================================================================

def get_required_env_var(var_name: str, description: str = ""):
    """
    Obtém uma variável de ambiente obrigatória.
    Levanta ImproperlyConfigured se a variável não estiver definida.
    """
    value = config(var_name, default=None)
    if not value:
        error_msg = f"Variável de ambiente obrigatória '{var_name}' não foi definida."
        if description:
            error_msg += f" {description}"
        raise ImproperlyConfigured(error_msg)
    return value

# Lista de variáveis obrigatórias para produção
REQUIRED_ENV_VARS = {
    'SECRET_KEY': 'Chave secreta do Django para produção',
    'DB_NAME': 'Nome do banco de dados PostgreSQL',
    'DB_USER': 'Usuário do banco de dados',
    'DB_PASSWORD': 'Senha do banco de dados',
    'DB_HOST': 'Host do banco de dados',
    'GOOGLE_OAUTH_CLIENT_ID': 'Client ID do Google OAuth',
    'GOOGLE_OAUTH_CLIENT_SECRET': 'Client Secret do Google OAuth',
}

# Validar todas as variáveis obrigatórias
for var_name, description in REQUIRED_ENV_VARS.items():
    get_required_env_var(var_name, description)

# =============================================================================
# CONFIGURAÇÕES BÁSICAS
# =============================================================================

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = get_required_env_var('SECRET_KEY')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Hosts permitidos - configurado via variável de ambiente
ALLOWED_HOSTS = config('ALLOWED_HOSTS', cast=Csv(), default='localhost,127.0.0.1')

# =============================================================================
# CONFIGURAÇÕES DE SEGURANÇA
# =============================================================================

# Configurações de SSL e HTTPS
SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
SECURE_HSTS_SECONDS = config('SECURE_HSTS_SECONDS', default=31536000, cast=int)
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Headers de segurança
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# Configurações de cookies seguros
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_AGE = 3600  # 1 hora
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True

# =============================================================================
# CONFIGURAÇÕES DE BANCO DE DADOS
# =============================================================================

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': get_required_env_var('DB_NAME'),
        'USER': get_required_env_var('DB_USER'),
        'PASSWORD': get_required_env_var('DB_PASSWORD'),
        'HOST': get_required_env_var('DB_HOST'),
        'PORT': config('DB_PORT', default='5432'),
        'OPTIONS': {
            'sslmode': config('DB_SSLMODE', default='prefer'),
        },
        # Configurações de pool de conexões para produção
        'CONN_MAX_AGE': config('DB_CONN_MAX_AGE', default=60, cast=int),
    }
}

# =============================================================================
# CONFIGURAÇÕES DE CACHE
# =============================================================================

# Cache Redis para produção
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://localhost:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
            }
        },
        'KEY_PREFIX': 'rodocheck',
        'TIMEOUT': 300,  # 5 minutos
    }
}

# Cache de sessões
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# =============================================================================
# CONFIGURAÇÕES DE CORS
# =============================================================================

# CORS configurado para produção
CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS', 
    cast=Csv(), 
    default='http://localhost:3000,http://localhost:9002'
)
CORS_ALLOW_CREDENTIALS = True

# Headers CORS permitidos
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# =============================================================================
# CONFIGURAÇÕES DE ARQUIVOS ESTÁTICOS E MÍDIA
# =============================================================================

# Arquivos estáticos
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.StaticFilesStorage'

# Arquivos de mídia
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Configurações de upload
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB

# =============================================================================
# CONFIGURAÇÕES DE LOGGING
# =============================================================================

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'maxBytes': 1024*1024*15,  # 15MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': BASE_DIR / 'logs' / 'django_error.log',
            'maxBytes': 1024*1024*15,  # 15MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'django.request': {
            'handlers': ['error_file', 'console'],
            'level': 'ERROR',
            'propagate': True,
        },
        'rodocheck': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}

# =============================================================================
# CONFIGURAÇÕES DE EMAIL
# =============================================================================

# Configurações de email para produção
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = True
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='noreply@rodocheck.com')

# =============================================================================
# CONFIGURAÇÕES DE CELERY
# =============================================================================

# Celery para tarefas assíncronas
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'America/Sao_Paulo'

# Configurações de worker
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
CELERY_TASK_ACKS_LATE = True
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000

# =============================================================================
# CONFIGURAÇÕES DE GOOGLE OAUTH
# =============================================================================

GOOGLE_OAUTH_CLIENT_ID = get_required_env_var('GOOGLE_OAUTH_CLIENT_ID')
GOOGLE_OAUTH_CLIENT_SECRET = get_required_env_var('GOOGLE_OAUTH_CLIENT_SECRET')

# =============================================================================
# CONFIGURAÇÕES DE IA
# =============================================================================

OPENAI_API_KEY = config('OPENAI_API_KEY', default='')
GOOGLE_AI_API_KEY = config('GOOGLE_AI_API_KEY', default='')
GEMINI_API_KEY = config('GEMINI_API_KEY', default='')

# =============================================================================
# CONFIGURAÇÕES DE GOOGLE DRIVE
# =============================================================================

GOOGLE_DRIVE_CREDENTIALS_FILE = config('GOOGLE_DRIVE_CREDENTIALS_FILE', default='')
GOOGLE_DRIVE_FOLDER_ID = config('GOOGLE_DRIVE_FOLDER_ID', default='')

# =============================================================================
# CONFIGURAÇÕES RESTANTES (herdadas do settings.py)
# =============================================================================

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'authentication',
    'checklists',
    'vehicles',
    'users',
    'tires',
    'ai_assistant',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'allauth.account.middleware.AccountMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'rodocheck_backend.middleware.RequestLoggingMiddleware',
]

ROOT_URLCONF = 'rodocheck_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'rodocheck_backend.wsgi.application'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'pt-br'
TIME_ZONE = 'America/Sao_Paulo'
USE_I18N = True
USE_TZ = True

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'authentication.User'

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour'
    }
}

# Django Allauth settings
AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'allauth.account.auth_backends.AuthenticationBackend',
]

SITE_ID = 1

# Google OAuth settings
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': [
            'profile',
            'email',
        ],
        'AUTH_PARAMS': {
            'access_type': 'online',
        },
        'OAUTH_PKCE_ENABLED': True,
    }
}

# =============================================================================
# CONFIGURAÇÕES DE MONITORAMENTO
# =============================================================================

# Configurações para monitoramento de performance
if config('ENABLE_DEBUG_TOOLBAR', default=False, cast=bool):
    INSTALLED_APPS += ['debug_toolbar']
    MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
    INTERNAL_IPS = ['127.0.0.1']

# =============================================================================
# CONFIGURAÇÕES DE BACKUP
# =============================================================================

# Configurações para backup automático
BACKUP_DIR = BASE_DIR / 'backups'
BACKUP_RETENTION_DAYS = config('BACKUP_RETENTION_DAYS', default=30, cast=int)

