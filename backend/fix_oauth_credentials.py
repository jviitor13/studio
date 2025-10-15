#!/usr/bin/env python
"""
Script para corrigir credenciais OAuth2
"""
import os
import sys
import django
import base64

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rodocheck_backend.settings')
django.setup()

from oauth2_provider.models import Application

def fix_oauth_credentials():
    """Corrigir credenciais OAuth2"""
    
    print("=== CORRIGINDO CREDENCIAIS OAUTH2 ===")
    
    # Listar aplicativos existentes
    apps = Application.objects.all()
    print(f"\nAplicativos encontrados: {apps.count()}")
    
    for app in apps:
        print(f"\n--- {app.name} ---")
        print(f"Client ID: {app.client_id}")
        print(f"Client Secret: {app.client_secret}")
        print(f"Client Type: {app.client_type}")
        print(f"Grant Type: {app.authorization_grant_type}")
        print(f"Algorithm: {app.algorithm}")
        
        # Verificar se o secret está hasheado
        if app.client_secret.startswith('pbkdf2_sha256'):
            print("[WARNING] Client Secret está hasheado (isso pode causar problemas)")
            
            # Gerar novo secret em texto plano
            import secrets
            new_secret = secrets.token_urlsafe(32)
            app.client_secret = new_secret
            app.save()
            print(f"[OK] Novo Client Secret gerado: {new_secret}")
        else:
            print("[OK] Client Secret está em texto plano")
    
    print(f"\n=== TESTE DE CREDENCIAIS ===")
    
    # Testar credenciais do aplicativo API
    try:
        api_app = Application.objects.get(name="RodoCheck API Client")
        
        # Testar codificação
        credentials = f"{api_app.client_id}:{api_app.client_secret}"
        encoded_credentials = base64.b64encode(credentials.encode('utf-8')).decode('utf-8')
        
        print(f"Client ID: {api_app.client_id}")
        print(f"Client Secret: {api_app.client_secret}")
        print(f"Credenciais: {credentials}")
        print(f"Base64: {encoded_credentials}")
        
        # Testar decodificação
        decoded = base64.b64decode(encoded_credentials).decode('utf-8')
        print(f"Decodificado: {decoded}")
        
        if decoded == credentials:
            print("[OK] Codificação/Decodificação funcionando")
        else:
            print("[ERROR] Problema na codificação/decodificação")
            
    except Application.DoesNotExist:
        print("[ERROR] Aplicativo API não encontrado")
    
    print(f"\n=== RECRIAR APLICATIVOS ===")
    response = input("Deseja recriar todos os aplicativos? (s/n): ").strip().lower()
    
    if response == 's':
        # Deletar aplicativos existentes
        Application.objects.all().delete()
        print("[OK] Aplicativos antigos removidos")
        
        # Recriar aplicativos
        from create_oauth_apps import create_oauth_applications
        create_oauth_applications()

if __name__ == '__main__':
    fix_oauth_credentials()
