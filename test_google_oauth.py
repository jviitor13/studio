#!/usr/bin/env python
"""
Script para testar a configuração do Google OAuth
"""
import os
import sys
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rodocheck_backend.settings')
django.setup()

from django.conf import settings

def test_google_oauth_config():
    """Testa a configuração do Google OAuth."""
    print("🔐 Testando configuração do Google OAuth...")
    
    # Verificar variáveis de ambiente
    print("\n1. Verificando variáveis de ambiente:")
    
    client_id = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', None)
    client_secret = getattr(settings, 'GOOGLE_OAUTH_CLIENT_SECRET', None)
    
    print(f"   GOOGLE_OAUTH_CLIENT_ID: {'✅ Configurado' if client_id else '❌ Não configurado'}")
    print(f"   GOOGLE_OAUTH_CLIENT_SECRET: {'✅ Configurado' if client_secret else '❌ Não configurado'}")
    
    if not client_id or not client_secret:
        print("\n⚠️  ATENÇÃO: Configure as variáveis de ambiente!")
        print("   Edite o arquivo backend/.env e adicione:")
        print("   GOOGLE_OAUTH_CLIENT_ID=seu-client-id")
        print("   GOOGLE_OAUTH_CLIENT_SECRET=seu-client-secret")
        return False
    
    # Verificar configurações do Django Allauth
    print("\n2. Verificando configurações do Django Allauth:")
    
    social_providers = getattr(settings, 'SOCIALACCOUNT_PROVIDERS', {})
    google_config = social_providers.get('google', {})
    
    print(f"   Google provider configurado: {'✅ Sim' if google_config else '❌ Não'}")
    print(f"   SCOPE: {google_config.get('SCOPE', 'Não configurado')}")
    print(f"   AUTH_PARAMS: {google_config.get('AUTH_PARAMS', 'Não configurado')}")
    
    # Verificar URLs
    print("\n3. Verificando URLs de autenticação:")
    
    try:
        response = requests.get('http://localhost:8000/accounts/google/login/')
        print(f"   Google login URL: {'✅ Acessível' if response.status_code == 200 else '❌ Não acessível'}")
    except:
        print("   Google login URL: ❌ Servidor não está rodando")
    
    # Verificar API endpoints
    print("\n4. Verificando endpoints da API:")
    
    try:
        response = requests.get('http://localhost:8000/api/auth/me/')
        print(f"   API auth endpoint: {'✅ Acessível' if response.status_code in [200, 403] else '❌ Não acessível'}")
    except:
        print("   API auth endpoint: ❌ Servidor não está rodando")
    
    print("\n✅ Teste de configuração concluído!")
    return True

def show_setup_instructions():
    """Mostra instruções de configuração."""
    print("\n📋 INSTRUÇÕES DE CONFIGURAÇÃO:")
    print("=" * 50)
    print("1. Acesse: https://console.cloud.google.com/")
    print("2. Crie um projeto ou selecione um existente")
    print("3. Ative a Google+ API")
    print("4. Vá para APIs & Services > Credentials")
    print("5. Clique em 'Create Credentials' > 'OAuth 2.0 Client IDs'")
    print("6. Configure:")
    print("   - Application type: Web application")
    print("   - Authorized JavaScript origins: http://localhost:9002")
    print("   - Authorized redirect URIs: http://localhost:8000/accounts/google/login/callback/")
    print("7. Copie o Client ID e Client Secret")
    print("8. Configure no arquivo backend/.env:")
    print("   GOOGLE_OAUTH_CLIENT_ID=seu-client-id")
    print("   GOOGLE_OAUTH_CLIENT_SECRET=seu-client-secret")
    print("9. Configure no arquivo .env.local:")
    print("   NEXT_PUBLIC_GOOGLE_CLIENT_ID=seu-client-id")
    print("10. Reinicie os servidores")

if __name__ == '__main__':
    print("🚀 Iniciando teste do Google OAuth...")
    
    success = test_google_oauth_config()
    
    if not success:
        show_setup_instructions()
    
    print("\n🎉 Teste concluído!")

