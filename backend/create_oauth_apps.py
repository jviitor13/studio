#!/usr/bin/env python
"""
Script para criar aplicativos OAuth2 no Django OAuth Toolkit
"""
import os
import sys
import django
from django.conf import settings

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rodocheck_backend.settings')
django.setup()

from oauth2_provider.models import Application
from django.contrib.auth import get_user_model

User = get_user_model()

def create_oauth_applications():
    """Criar aplicativos OAuth2 para diferentes fluxos"""
    
    # 1. Aplicativo para Authorization Code Flow (Web/Mobile)
    web_app, created = Application.objects.get_or_create(
        name="RodoCheck Web App",
        defaults={
            'client_type': Application.CLIENT_CONFIDENTIAL,
            'authorization_grant_type': Application.GRANT_AUTHORIZATION_CODE,
            'redirect_uris': 'http://localhost:3000/callback\nhttp://127.0.0.1:3000/callback',
            'algorithm': Application.RS256_ALGORITHM,
            'client_secret': '',  # Será gerado automaticamente
        }
    )
    
    if created:
        print(f"[OK] Aplicativo Web criado:")
        print(f"   Client ID: {web_app.client_id}")
        print(f"   Client Secret: {web_app.client_secret}")
    else:
        print(f"[INFO] Aplicativo Web já existe:")
        print(f"   Client ID: {web_app.client_id}")
        print(f"   Client Secret: {web_app.client_secret}")
    
    # 2. Aplicativo para Client Credentials Flow (Machine-to-Machine)
    api_app, created = Application.objects.get_or_create(
        name="RodoCheck API Client",
        defaults={
            'client_type': Application.CLIENT_CONFIDENTIAL,
            'authorization_grant_type': Application.GRANT_CLIENT_CREDENTIALS,
            'algorithm': Application.RS256_ALGORITHM,
            'client_secret': '',  # Será gerado automaticamente
        }
    )
    
    if created:
        print(f"[OK] Aplicativo API criado:")
        print(f"   Client ID: {api_app.client_id}")
        print(f"   Client Secret: {api_app.client_secret}")
    else:
        print(f"[INFO] Aplicativo API já existe:")
        print(f"   Client ID: {api_app.client_id}")
        print(f"   Client Secret: {api_app.client_secret}")
    
    # 3. Aplicativo para Public Client (SPA/Mobile)
    public_app, created = Application.objects.get_or_create(
        name="RodoCheck Public Client",
        defaults={
            'client_type': Application.CLIENT_PUBLIC,
            'authorization_grant_type': Application.GRANT_AUTHORIZATION_CODE,
            'redirect_uris': 'http://localhost:3000/callback\nhttp://127.0.0.1:3000/callback',
            'algorithm': Application.RS256_ALGORITHM,
            'client_secret': '',  # Será gerado automaticamente
        }
    )
    
    if created:
        print(f"[OK] Aplicativo Público criado:")
        print(f"   Client ID: {public_app.client_id}")
        print(f"   Client Secret: {public_app.client_secret}")
    else:
        print(f"[INFO] Aplicativo Público já existe:")
        print(f"   Client ID: {public_app.client_id}")
        print(f"   Client Secret: {public_app.client_secret}")
    
    print("\n[ENDPOINTS] OAuth2 disponíveis:")
    print("   Authorization: http://localhost:8000/o/authorize/")
    print("   Token: http://localhost:8000/o/token/")
    print("   Revoke: http://localhost:8000/o/revoke_token/")
    print("   Introspect: http://localhost:8000/o/introspect/")
    print("   Applications: http://localhost:8000/o/applications/")
    
    print("\n[EXEMPLOS] Uso:")
    print("\n1. Authorization Code Flow (PKCE):")
    print("   GET /o/authorize/?response_type=code&client_id={client_id}&redirect_uri={redirect_uri}&code_challenge={code_challenge}&code_challenge_method=S256")
    
    print("\n2. Client Credentials Flow:")
    print("   POST /o/token/")
    print("   Headers: Authorization: Basic {base64(client_id:client_secret)}")
    print("   Body: grant_type=client_credentials")
    
    print("\n3. Token Exchange:")
    print("   POST /o/token/")
    print("   Body: grant_type=authorization_code&code={code}&client_id={client_id}&client_secret={client_secret}&redirect_uri={redirect_uri}")

if __name__ == '__main__':
    create_oauth_applications()
