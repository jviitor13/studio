#!/usr/bin/env python
"""
Script para criar aplicativos OAuth2 com secrets em texto plano
"""
import os
import sys
import django
import secrets

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rodocheck_backend.settings')
django.setup()

from oauth2_provider.models import Application

def create_simple_oauth_apps():
    """Criar aplicativos OAuth2 com secrets em texto plano"""
    
    print("=== CRIANDO APLICATIVOS OAUTH2 SIMPLES ===")
    
    # Deletar aplicativos existentes
    Application.objects.all().delete()
    print("[OK] Aplicativos antigos removidos")
    
    # 1. Aplicativo para Authorization Code Flow
    web_app = Application.objects.create(
        name="RodoCheck Web App",
        client_type=Application.CLIENT_CONFIDENTIAL,
        authorization_grant_type=Application.GRANT_AUTHORIZATION_CODE,
        redirect_uris='http://localhost:3000/callback\nhttp://127.0.0.1:3000/callback',
        algorithm=Application.RS256_ALGORITHM,
    )
    
    # Gerar secret em texto plano
    web_secret = secrets.token_urlsafe(32)
    web_app.client_secret = web_secret
    web_app.save()
    
    print(f"[OK] Aplicativo Web criado:")
    print(f"   Client ID: {web_app.client_id}")
    print(f"   Client Secret: {web_secret}")
    
    # 2. Aplicativo para Client Credentials Flow
    api_app = Application.objects.create(
        name="RodoCheck API Client",
        client_type=Application.CLIENT_CONFIDENTIAL,
        authorization_grant_type=Application.GRANT_CLIENT_CREDENTIALS,
        algorithm=Application.RS256_ALGORITHM,
    )
    
    # Gerar secret em texto plano
    api_secret = secrets.token_urlsafe(32)
    api_app.client_secret = api_secret
    api_app.save()
    
    print(f"[OK] Aplicativo API criado:")
    print(f"   Client ID: {api_app.client_id}")
    print(f"   Client Secret: {api_secret}")
    
    # 3. Aplicativo Público
    public_app = Application.objects.create(
        name="RodoCheck Public Client",
        client_type=Application.CLIENT_PUBLIC,
        authorization_grant_type=Application.GRANT_AUTHORIZATION_CODE,
        redirect_uris='http://localhost:3000/callback\nhttp://127.0.0.1:3000/callback',
        algorithm=Application.RS256_ALGORITHM,
    )
    
    # Gerar secret em texto plano
    public_secret = secrets.token_urlsafe(32)
    public_app.client_secret = public_secret
    public_app.save()
    
    print(f"[OK] Aplicativo Público criado:")
    print(f"   Client ID: {public_app.client_id}")
    print(f"   Client Secret: {public_secret}")
    
    print(f"\n[ENDPOINTS] OAuth2 disponíveis:")
    print("   Authorization: http://localhost:8000/o/authorize/")
    print("   Token: http://localhost:8000/o/token/")
    print("   Revoke: http://localhost:8000/o/revoke_token/")
    print("   Introspect: http://localhost:8000/o/introspect/")
    print("   Applications: http://localhost:8000/o/applications/")
    
    print(f"\n[TESTE] Client Credentials Flow:")
    print(f"Client ID: {api_app.client_id}")
    print(f"Client Secret: {api_secret}")
    
    # Testar credenciais
    import base64
    credentials = f"{api_app.client_id}:{api_secret}"
    encoded_credentials = base64.b64encode(credentials.encode('utf-8')).decode('utf-8')
    print(f"Base64: {encoded_credentials}")
    
    print(f"\n[EXEMPLO] Teste com curl:")
    print(f"curl -X POST \\")
    print(f"  -H 'Authorization: Basic {encoded_credentials}' \\")
    print(f"  -H 'Content-Type: application/x-www-form-urlencoded' \\")
    print(f"  -d 'grant_type=client_credentials' \\")
    print(f"  http://localhost:8000/o/token/")

if __name__ == '__main__':
    create_simple_oauth_apps()
