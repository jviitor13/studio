#!/usr/bin/env python
"""
Script para testar funcionalidades principais da aplicação
"""
import requests
import json
import time

def test_backend_health():
    """Testa se o backend está funcionando."""
    print("Testando Backend...")
    
    try:
        # Teste básico de conectividade
        response = requests.get('http://localhost:8000/api/auth/me/', timeout=5)
        print(f"   Status: {response.status_code} (esperado: 403 - não autenticado)")
        
        if response.status_code == 403:
            print("   Backend funcionando - autenticacao requerida")
            return True
        else:
            print("   Backend com problema")
            return False
            
    except requests.exceptions.ConnectionError:
        print("   Backend nao esta rodando")
        return False
    except Exception as e:
        print(f"   Erro: {e}")
        return False

def test_frontend_health():
    """Testa se o frontend está funcionando."""
    print("\nTestando Frontend...")
    
    try:
        response = requests.get('http://localhost:9002/', timeout=5)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            print("   Frontend funcionando")
            return True
        else:
            print("   Frontend com problema")
            return False
            
    except requests.exceptions.ConnectionError:
        print("   Frontend nao esta rodando")
        return False
    except Exception as e:
        print(f"   Erro: {e}")
        return False

def test_api_endpoints():
    """Testa endpoints da API."""
    print("\nTestando Endpoints da API...")
    
    endpoints = [
        ('/api/auth/me/', 'GET', 'Informações do usuário'),
        ('/api/vehicles/', 'GET', 'Lista de veículos'),
        ('/api/checklists/', 'GET', 'Lista de checklists'),
        ('/api/users/profile/', 'GET', 'Perfil do usuário'),
    ]
    
    for endpoint, method, description in endpoints:
        try:
            response = requests.get(f'http://localhost:8000{endpoint}', timeout=3)
            status = "OK" if response.status_code == 403 else "WARN"
            print(f"   {status} {method} {endpoint} - {response.status_code} ({description})")
        except Exception as e:
            print(f"   ERRO {method} {endpoint} - Erro: {e}")

def test_database_connection():
    """Testa conexão com banco de dados."""
    print("\nTestando Banco de Dados...")
    
    try:
        # Teste simples de endpoint que requer banco
        response = requests.get('http://localhost:8000/api/vehicles/', timeout=5)
        
        if response.status_code == 403:
            print("   Banco de dados funcionando (autenticacao requerida)")
            return True
        elif response.status_code == 500:
            print("   Erro no banco de dados")
            return False
        else:
            print(f"   Status inesperado: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"   Erro: {e}")
        return False

def test_cors_configuration():
    """Testa configuração CORS."""
    print("\nTestando CORS...")
    
    try:
        headers = {
            'Origin': 'http://localhost:9002',
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'Content-Type'
        }
        
        response = requests.options('http://localhost:8000/api/vehicles/', headers=headers, timeout=5)
        
        cors_headers = response.headers.get('Access-Control-Allow-Origin', '')
        
        if 'localhost:9002' in cors_headers or '*' in cors_headers:
            print("   CORS configurado corretamente")
            return True
        else:
            print("   CORS pode nao estar configurado")
            return False
            
    except Exception as e:
        print(f"   Erro: {e}")
        return False

def main():
    """Executa todos os testes."""
    print("Iniciando testes da aplicacao...")
    print("=" * 50)
    
    # Aguardar servidores iniciarem
    print("Aguardando servidores iniciarem...")
    time.sleep(3)
    
    # Executar testes
    backend_ok = test_backend_health()
    frontend_ok = test_frontend_health()
    database_ok = test_database_connection()
    cors_ok = test_cors_configuration()
    
    # Testar endpoints
    test_api_endpoints()
    
    # Resumo
    print("\n" + "=" * 50)
    print("RESUMO DOS TESTES:")
    print(f"   Backend: {'OK' if backend_ok else 'FALHOU'}")
    print(f"   Frontend: {'OK' if frontend_ok else 'FALHOU'}")
    print(f"   Banco de Dados: {'OK' if database_ok else 'FALHOU'}")
    print(f"   CORS: {'OK' if cors_ok else 'VERIFICAR'}")
    
    if backend_ok and frontend_ok:
        print("\nAplicacao funcionando corretamente!")
        print("   Frontend: http://localhost:9002")
        print("   Backend: http://localhost:8000")
    else:
        print("\nAlguns problemas foram encontrados.")
        print("   Verifique os logs dos servidores.")

if __name__ == '__main__':
    main()
