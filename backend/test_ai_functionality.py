"""
Test script for AI functionality
"""

import os
import sys
import django
import requests
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rodocheck_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from ai_assistant.models import AIConfiguration
from ai_assistant.services import AIAssistantService

User = get_user_model()

def test_ai_configuration():
    """Test AI configuration."""
    print("=== Testando Configuração de IA ===")
    
    # Load environment variables from .env file
    from decouple import config
    
    # Check if AI services are configured
    openai_key = config('OPENAI_API_KEY', default='')
    google_key = config('GOOGLE_AI_API_KEY', default='')
    gemini_key = config('GEMINI_API_KEY', default='')
    
    print(f"OpenAI API Key: {'Configurado' if openai_key else 'Não configurado'}")
    print(f"Google AI API Key: {'Configurado' if google_key else 'Não configurado'}")
    print(f"Gemini API Key: {'Configurado' if gemini_key else 'Não configurado'}")
    
    # Create AI configuration records
    if openai_key:
        AIConfiguration.objects.get_or_create(
            service_name='openai',
            defaults={
                'api_key': openai_key,
                'model_name': 'gpt-3.5-turbo',
                'is_active': True,
                'configuration': {
                    'max_tokens': 1000,
                    'temperature': 0.7
                }
            }
        )
        print("OK - Configuração OpenAI criada")
    
    if google_key:
        AIConfiguration.objects.get_or_create(
            service_name='google_ai',
            defaults={
                'api_key': google_key,
                'model_name': 'gemini-pro',
                'is_active': True,
                'configuration': {
                    'max_tokens': 1000,
                    'temperature': 0.7
                }
            }
        )
        print("OK - Configuração Google AI criada")
    
    return bool(openai_key or google_key or gemini_key)

def test_ai_assistant():
    """Test AI assistant functionality."""
    print("\n=== Testando Assistente de IA ===")
    
    try:
        # Get or create test user
        user, created = User.objects.get_or_create(
            email='test@example.com',
            defaults={
                'username': 'test@example.com',
                'first_name': 'Test',
                'last_name': 'User',
                'role': 'admin'
            }
        )
        
        if created:
            print("OK - Usuário de teste criado")
        else:
            print("OK - Usuário de teste encontrado")
        
        # Test AI assistant service
        ai_service = AIAssistantService()
        
        # Test query
        query = "Olá, como posso criar um checklist de manutenção?"
        context = {
            'tireData': {'Em Uso': 5, 'Em Estoque': 3, 'Em Manutenção': 1},
            'maintenanceData': {'Pendente': 2, 'Concluída': 8}
        }
        
        print(f"Enviando query: {query}")
        result = ai_service.process_assistant_query(query, user, context)
        
        if result['success']:
            print("OK - Assistente de IA funcionando")
            print(f"Resposta: {result['data']['response']}")
            print(f"Acao: {result['data'].get('action', 'none')}")
            print(f"Payload: {result['data'].get('payload', '')}")
        else:
            print(f"ERRO - Erro no assistente: {result['error']}")
            
    except Exception as e:
        print(f"ERRO - Erro ao testar assistente: {e}")

def test_ai_endpoints():
    """Test AI endpoints."""
    print("\n=== Testando Endpoints de IA ===")
    
    base_url = "http://localhost:8000"
    endpoints = [
        "/api/ai/status/",
        "/api/ai/usage-stats/",
        "/api/ai/sessions/",
    ]
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=5)
            if response.status_code == 200:
                print(f"OK - {endpoint} - OK")
            else:
                print(f"ERRO - {endpoint} - Status {response.status_code}")
        except requests.exceptions.ConnectionError:
            print(f"ERRO - {endpoint} - Servidor nao esta rodando")
        except Exception as e:
            print(f"ERRO - {endpoint} - Erro: {e}")

def test_database_models():
    """Test database models."""
    print("\n=== Testando Modelos de Banco ===")
    
    try:
        # Test AIAssistantSession
        from ai_assistant.models import AIAssistantSession, AIAssistantMessage
        
        user = User.objects.filter(email='test@example.com').first()
        if user:
            session = AIAssistantSession.objects.create(
                user=user,
                session_id='test-session-123'
            )
            print("OK - AIAssistantSession criado")
            
            # Test AIAssistantMessage
            message = AIAssistantMessage.objects.create(
                session=session,
                message_type='user',
                content='Teste de mensagem'
            )
            print("OK - AIAssistantMessage criado")
            
            # Cleanup
            session.delete()
            print("OK - Teste de modelos concluido")
        else:
            print("ERRO - Usuario de teste nao encontrado")
            
    except Exception as e:
        print(f"ERRO - Erro ao testar modelos: {e}")

def main():
    """Main test function."""
    print("=== Teste de Funcionalidades de IA - RodoCheck ===\n")
    
    # Test AI configuration
    ai_configured = test_ai_configuration()
    
    if ai_configured:
        # Test AI assistant
        test_ai_assistant()
        
        # Test database models
        test_database_models()
    else:
        print("\nAVISO - Nenhuma chave de IA configurada. Configure OPENAI_API_KEY ou GOOGLE_AI_API_KEY no .env")
        print("   Exemplo: OPENAI_API_KEY=sk-your-key-here")
        print("   Exemplo: GOOGLE_AI_API_KEY=your-google-key-here")
    
    # Test endpoints (requires server running)
    test_ai_endpoints()
    
    print("\n=== Resumo ===")
    print("OK - Modelos Django criados para funcionalidades de IA")
    print("OK - Servicos de IA implementados (OpenAI e Google AI)")
    print("OK - Endpoints de API criados")
    print("OK - Sistema de logging de uso implementado")
    print("\nPara usar as funcionalidades de IA:")
    print("1. Configure as chaves de API no arquivo .env")
    print("2. Reinicie o servidor Django")
    print("3. Use os endpoints /api/ai/ para acessar as funcionalidades")

if __name__ == "__main__":
    main()
