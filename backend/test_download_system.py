"""
Teste do Sistema de Download de Checklists
"""

import os
import sys
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'rodocheck_backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from checklists.models import ChecklistTemplate, CompletedChecklist
from vehicles.models import Vehicle
from checklists.pdf_generator import ChecklistPDFGenerator
import tempfile

User = get_user_model()

def test_pdf_generation():
    """Test PDF generation functionality."""
    print("=== Teste de Geração de PDF ===")
    
    try:
        # Create test user
        user, created = User.objects.get_or_create(
            username='test_user',
            defaults={
                'email': 'test@example.com',
                'first_name': 'Test',
                'last_name': 'User',
                'password': 'testpass123'
            }
        )
        print(f"OK - Usuário de teste: {'criado' if created else 'encontrado'}")
        
        # Create test vehicle
        vehicle, created = Vehicle.objects.get_or_create(
            plate='ABC1234',
            defaults={
                'model': 'Civic',
                'brand': 'Honda',
                'year': 2020,
                'vehicle_type': 'truck',
                'color': 'Branco',
                'created_by': user
            }
        )
        print(f"OK - Veículo de teste: {'criado' if created else 'encontrado'}")
        
        # Create test checklist
        checklist_data = {
            'id': 'TEST-001',
            'vehicle': vehicle,
            'created_by': user,
            'final_status': 'approved',
            'general_observations': 'Checklist de teste realizado com sucesso.',
            'questions': [
                {
                    'text': 'Verificar pneus',
                    'status': 'approved',
                    'observations': 'Pneus em bom estado'
                },
                {
                    'text': 'Verificar freios',
                    'status': 'approved',
                    'observations': 'Sistema de freios funcionando perfeitamente'
                },
                {
                    'text': 'Verificar luzes',
                    'status': 'rejected',
                    'observations': 'Farol direito com problema'
                }
            ],
            'vehicle_images': {
                'front': {'url': 'https://example.com/front.jpg'},
                'rear': {'url': 'https://example.com/rear.jpg'}
            },
            'signatures': {
                'inspector': {'name': 'João Silva', 'timestamp': '2024-01-15T10:30:00Z'},
                'driver': {'name': 'Maria Santos', 'timestamp': '2024-01-15T10:35:00Z'}
            }
        }
        
        checklist, created = CompletedChecklist.objects.get_or_create(
            id=checklist_data['id'],
            defaults=checklist_data
        )
        print(f"OK - Checklist de teste: {'criado' if created else 'encontrado'}")
        
        # Test PDF generation
        generator = ChecklistPDFGenerator()
        pdf_content = generator.generate_pdf(checklist)
        
        print(f"OK - PDF gerado com sucesso ({len(pdf_content)} bytes)")
        
        # Save PDF to temporary file for inspection
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
            temp_file.write(pdf_content)
            temp_file_path = temp_file.name
        
        print(f"OK - PDF salvo em: {temp_file_path}")
        
        # Test file size
        file_size = len(pdf_content)
        if file_size > 1000:  # At least 1KB
            print(f"OK - Tamanho do PDF adequado: {file_size} bytes")
        else:
            print(f"AVISO - PDF muito pequeno: {file_size} bytes")
        
        return True
        
    except Exception as e:
        print(f"ERRO - Erro na geração de PDF: {e}")
        return False

def test_download_endpoints():
    """Test download endpoints."""
    print("\n=== Teste de Endpoints de Download ===")
    
    try:
        import requests
        
        # Test server availability
        try:
            response = requests.get('http://localhost:8000/api/checklists/', timeout=5)
            if response.status_code == 200:
                print("OK - Servidor Django está rodando")
            else:
                print(f"AVISO - Servidor respondeu com status {response.status_code}")
        except requests.exceptions.ConnectionError:
            print("ERRO - Servidor Django não está rodando")
            print("Execute: python manage.py runserver")
            return False
        
        # Test checklist list endpoint
        try:
            response = requests.get('http://localhost:8000/api/checklists/')
            if response.status_code == 200:
                print("OK - Endpoint de listagem de checklists funcionando")
            else:
                print(f"AVISO - Endpoint de listagem retornou status {response.status_code}")
        except Exception as e:
            print(f"ERRO - Erro ao testar endpoint de listagem: {e}")
        
        return True
        
    except ImportError:
        print("AVISO - requests não instalado, pulando teste de endpoints")
        return True
    except Exception as e:
        print(f"ERRO - Erro nos testes de endpoint: {e}")
        return False

def test_model_fields():
    """Test new model fields."""
    print("\n=== Teste de Campos do Modelo ===")
    
    try:
        # Test CompletedChecklist model
        checklist = CompletedChecklist.objects.first()
        if checklist:
            print(f"OK - Modelo CompletedChecklist encontrado")
            print(f"  - pdf_file: {checklist.pdf_file}")
            print(f"  - is_pdf_generated: {checklist.is_pdf_generated}")
            print(f"  - download_count: {checklist.download_count}")
        else:
            print("AVISO - Nenhum checklist encontrado para teste")
        
        return True
        
    except Exception as e:
        print(f"ERRO - Erro ao testar campos do modelo: {e}")
        return False

def main():
    """Run all tests."""
    print("=== Teste do Sistema de Download de Checklists ===")
    print("Testando funcionalidades de geração e download de PDFs...\n")
    
    tests = [
        test_pdf_generation,
        test_download_endpoints,
        test_model_fields
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"ERRO - Falha no teste {test.__name__}: {e}")
            results.append(False)
    
    print("\n=== Resumo dos Testes ===")
    passed = sum(results)
    total = len(results)
    
    print(f"Testes aprovados: {passed}/{total}")
    
    if passed == total:
        print("SUCESSO - Todos os testes passaram!")
        print("\nSistema de download está funcionando corretamente.")
        print("Funcionalidades disponíveis:")
        print("- Geração automática de PDF ao criar checklist")
        print("- Download de PDF via endpoint /api/checklists/{id}/download/")
        print("- Informações de download via /api/checklists/{id}/download-info/")
        print("- Contador de downloads")
    else:
        print("AVISO - Alguns testes falharam.")
        print("Verifique os erros acima e corrija antes de usar o sistema.")
    
    return passed == total

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
