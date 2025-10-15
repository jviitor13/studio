"""
Script para iniciar o servidor Django corretamente
"""

import os
import sys
import subprocess
import time

def start_django_server():
    """Inicia o servidor Django."""
    print("=== Iniciando Servidor Django ===")
    
    # Mudar para o diretório backend
    backend_dir = os.path.join(os.getcwd(), 'backend')
    if not os.path.exists(backend_dir):
        print("ERRO: Diretório backend não encontrado!")
        return False
    
    os.chdir(backend_dir)
    print(f"Diretório: {os.getcwd()}")
    
    # Ativar ambiente virtual
    venv_activate = os.path.join(backend_dir, 'venv', 'Scripts', 'activate.bat')
    if not os.path.exists(venv_activate):
        print("ERRO: Ambiente virtual não encontrado!")
        return False
    
    # Iniciar servidor Django
    try:
        print("Iniciando servidor Django...")
        process = subprocess.Popen([
            'python', 'manage.py', 'runserver', '0.0.0.0:8000'
        ], cwd=backend_dir)
        
        print("Servidor Django iniciado!")
        print("Acesse: http://localhost:8000")
        print("Endpoints de IA: http://localhost:8000/api/ai/")
        print("\nPressione Ctrl+C para parar o servidor")
        
        # Aguardar o processo
        process.wait()
        
    except KeyboardInterrupt:
        print("\nParando servidor...")
        process.terminate()
        print("Servidor parado.")
    except Exception as e:
        print(f"ERRO ao iniciar servidor: {e}")
        return False
    
    return True

if __name__ == "__main__":
    start_django_server()


