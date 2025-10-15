#!/usr/bin/env python
"""
Script para testar os fluxos OAuth2
"""
import os
import sys
import django
import requests
import base64
import hashlib
import secrets
import string
from urllib.parse import urlencode, parse_qs, urlparse

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rodocheck_backend.settings')
django.setup()

from oauth2_provider.models import Application

def generate_pkce_pair():
    """Gerar par de code_verifier e code_challenge para PKCE"""
    code_verifier = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(128))
    code_challenge = hashlib.sha256(code_verifier.encode('utf-8')).digest()
    code_challenge = base64.urlsafe_b64encode(code_challenge).decode('utf-8').replace('=', '')
    return code_verifier, code_challenge

def test_authorization_code_flow():
    """Testar fluxo de código de autorização com PKCE"""
    print("\n=== TESTE: Authorization Code Flow (PKCE) ===")
    
    # Obter aplicativo web
    try:
        web_app = Application.objects.get(name="RodoCheck Web App")
        print(f"Client ID: {web_app.client_id}")
    except Application.DoesNotExist:
        print("ERRO: Aplicativo Web não encontrado. Execute create_oauth_apps.py primeiro.")
        return
    
    # Gerar PKCE
    code_verifier, code_challenge = generate_pkce_pair()
    print(f"Code Verifier: {code_verifier}")
    print(f"Code Challenge: {code_challenge}")
    
    # Parâmetros da autorização
    auth_params = {
        'response_type': 'code',
        'client_id': web_app.client_id,
        'redirect_uri': 'http://localhost:3000/callback',
        'code_challenge': code_challenge,
        'code_challenge_method': 'S256',
        'scope': 'read write'
    }
    
    auth_url = f"http://localhost:8000/o/authorize/?{urlencode(auth_params)}"
    print(f"\nURL de Autorização:")
    print(f"{auth_url}")
    
    print(f"\n[INSTRUÇÕES]")
    print(f"1. Acesse a URL acima no navegador")
    print(f"2. Faça login se necessário")
    print(f"3. Autorize o aplicativo")
    print(f"4. Copie o 'code' da URL de callback")
    print(f"5. Cole o código abaixo:")
    
    # Simular entrada do usuário
    authorization_code = input("\nCole o código de autorização aqui: ").strip()
    
    if not authorization_code:
        print("Código não fornecido. Teste cancelado.")
        return
    
    # Trocar código por token
    token_data = {
        'grant_type': 'authorization_code',
        'code': authorization_code,
        'client_id': web_app.client_id,
        'client_secret': web_app.client_secret,
        'redirect_uri': 'http://localhost:3000/callback',
        'code_verifier': code_verifier
    }
    
    print(f"\nTrocando código por token...")
    response = requests.post('http://localhost:8000/o/token/', data=token_data)
    
    if response.status_code == 200:
        token_info = response.json()
        print(f"[SUCESSO] Token obtido:")
        print(f"Access Token: {token_info.get('access_token', 'N/A')}")
        print(f"Token Type: {token_info.get('token_type', 'N/A')}")
        print(f"Expires In: {token_info.get('expires_in', 'N/A')} segundos")
        print(f"Scope: {token_info.get('scope', 'N/A')}")
        
        # Testar acesso a recurso protegido
        access_token = token_info.get('access_token')
        if access_token:
            print(f"\nTestando acesso a recurso protegido...")
            headers = {'Authorization': f'Bearer {access_token}'}
            api_response = requests.get('http://localhost:8000/api/vehicles/', headers=headers)
            print(f"Status da API: {api_response.status_code}")
            if api_response.status_code == 200:
                print("[SUCESSO] Acesso autorizado à API!")
            else:
                print(f"[ERRO] Falha no acesso: {api_response.text}")
    else:
        print(f"[ERRO] Falha na obtenção do token:")
        print(f"Status: {response.status_code}")
        print(f"Resposta: {response.text}")

def test_client_credentials_flow():
    """Testar fluxo de credenciais do cliente"""
    print("\n=== TESTE: Client Credentials Flow ===")
    
    # Obter aplicativo API
    try:
        api_app = Application.objects.get(name="RodoCheck API Client")
        print(f"Client ID: {api_app.client_id}")
    except Application.DoesNotExist:
        print("ERRO: Aplicativo API não encontrado. Execute create_oauth_apps.py primeiro.")
        return
    
    # Codificar credenciais
    credentials = f"{api_app.client_id}:{api_app.client_secret}"
    encoded_credentials = base64.b64encode(credentials.encode('utf-8')).decode('utf-8')
    
    print(f"Credenciais codificadas: {encoded_credentials}")
    
    # Solicitar token
    headers = {
        'Authorization': f'Basic {encoded_credentials}',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    data = {
        'grant_type': 'client_credentials',
        'scope': 'read write'
    }
    
    print(f"\nSolicitando token...")
    response = requests.post('http://localhost:8000/o/token/', headers=headers, data=data)
    
    if response.status_code == 200:
        token_info = response.json()
        print(f"[SUCESSO] Token obtido:")
        print(f"Access Token: {token_info.get('access_token', 'N/A')}")
        print(f"Token Type: {token_info.get('token_type', 'N/A')}")
        print(f"Expires In: {token_info.get('expires_in', 'N/A')} segundos")
        print(f"Scope: {token_info.get('scope', 'N/A')}")
        
        # Testar acesso a recurso protegido
        access_token = token_info.get('access_token')
        if access_token:
            print(f"\nTestando acesso a recurso protegido...")
            headers = {'Authorization': f'Bearer {access_token}'}
            api_response = requests.get('http://localhost:8000/api/vehicles/', headers=headers)
            print(f"Status da API: {api_response.status_code}")
            if api_response.status_code == 200:
                print("[SUCESSO] Acesso autorizado à API!")
            else:
                print(f"[ERRO] Falha no acesso: {api_response.text}")
    else:
        print(f"[ERRO] Falha na obtenção do token:")
        print(f"Status: {response.status_code}")
        print(f"Resposta: {response.text}")

def test_token_introspection():
    """Testar introspecção de token"""
    print("\n=== TESTE: Token Introspection ===")
    
    # Obter aplicativo API
    try:
        api_app = Application.objects.get(name="RodoCheck API Client")
    except Application.DoesNotExist:
        print("ERRO: Aplicativo API não encontrado.")
        return
    
    # Primeiro obter um token
    credentials = f"{api_app.client_id}:{api_app.client_secret}"
    encoded_credentials = base64.b64encode(credentials.encode('utf-8')).decode('utf-8')
    
    headers = {
        'Authorization': f'Basic {encoded_credentials}',
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    
    data = {'grant_type': 'client_credentials', 'scope': 'read write'}
    response = requests.post('http://localhost:8000/o/token/', headers=headers, data=data)
    
    if response.status_code != 200:
        print("ERRO: Não foi possível obter token para teste.")
        return
    
    access_token = response.json().get('access_token')
    print(f"Token para introspecção: {access_token}")
    
    # Testar introspecção
    introspection_data = {'token': access_token}
    introspection_response = requests.post(
        'http://localhost:8000/o/introspect/',
        headers=headers,
        data=introspection_data
    )
    
    if introspection_response.status_code == 200:
        token_info = introspection_response.json()
        print(f"[SUCESSO] Introspecção realizada:")
        print(f"Ativo: {token_info.get('active', 'N/A')}")
        print(f"Escopo: {token_info.get('scope', 'N/A')}")
        print(f"Cliente: {token_info.get('client_id', 'N/A')}")
        print(f"Tipo: {token_info.get('token_type', 'N/A')}")
    else:
        print(f"[ERRO] Falha na introspecção:")
        print(f"Status: {introspection_response.status_code}")
        print(f"Resposta: {introspection_response.text}")

def main():
    """Executar todos os testes"""
    print("=== TESTES OAUTH2 RODOCHECK ===")
    print("Certifique-se de que o servidor Django está rodando em http://localhost:8000")
    
    # Verificar se o servidor está rodando
    try:
        response = requests.get('http://localhost:8000/', timeout=5)
        if response.status_code != 200:
            print("ERRO: Servidor Django não está respondendo corretamente.")
            return
    except requests.exceptions.RequestException:
        print("ERRO: Não foi possível conectar ao servidor Django.")
        print("Execute: python manage.py runserver")
        return
    
    print("Servidor Django está rodando. Iniciando testes...")
    
    # Executar testes
    test_client_credentials_flow()
    test_token_introspection()
    
    print("\n=== TESTE INTERATIVO ===")
    print("Para testar o Authorization Code Flow, execute:")
    print("python test_oauth_flows.py --auth-code")
    
    if len(sys.argv) > 1 and sys.argv[1] == '--auth-code':
        test_authorization_code_flow()

if __name__ == '__main__':
    main()
