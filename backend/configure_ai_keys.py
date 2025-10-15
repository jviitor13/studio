"""
Script para configurar as chaves de IA do .env.local no backend Django
"""

import os
import re

def read_env_local():
    """Lê as chaves do .env.local do frontend."""
    env_local_path = '../.env.local'
    
    if not os.path.exists(env_local_path):
        print("Arquivo .env.local não encontrado!")
        return {}
    
    env_vars = {}
    with open(env_local_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                env_vars[key] = value
    
    return env_vars

def update_backend_env():
    """Atualiza o .env do backend com as chaves do frontend."""
    env_local = read_env_local()
    
    if not env_local:
        print("Nenhuma variável encontrada no .env.local")
        return
    
    # Mapear as chaves do frontend para o backend
    key_mapping = {
        'GEMINI_API_KEY': 'GEMINI_API_KEY',
        'GOOGLE_API_KEY': 'GOOGLE_API_KEY',
        'NEXT_PUBLIC_GOOGLE_CLIENT_ID': 'GOOGLE_OAUTH_CLIENT_ID',
    }
    
    # Ler o arquivo .env atual
    env_content = []
    if os.path.exists('.env'):
        try:
            with open('.env', 'r', encoding='utf-8') as f:
                env_content = f.readlines()
        except UnicodeDecodeError:
            with open('.env', 'r', encoding='latin-1') as f:
                env_content = f.readlines()
    
    # Atualizar as chaves
    updated_keys = set()
    for i, line in enumerate(env_content):
        for frontend_key, backend_key in key_mapping.items():
            if line.startswith(f"{backend_key}="):
                if frontend_key in env_local:
                    env_content[i] = f"{backend_key}={env_local[frontend_key]}\n"
                    updated_keys.add(backend_key)
                    print(f"OK - Atualizado {backend_key}")
                break
    
    # Adicionar chaves que não existem
    for frontend_key, backend_key in key_mapping.items():
        if frontend_key in env_local and backend_key not in updated_keys:
            env_content.append(f"{backend_key}={env_local[frontend_key]}\n")
            print(f"OK - Adicionado {backend_key}")
    
    # Salvar o arquivo atualizado
    with open('.env', 'w', encoding='utf-8') as f:
        f.writelines(env_content)
    
    print("\nConfiguração concluída!")
    print("Chaves configuradas:")
    for frontend_key, backend_key in key_mapping.items():
        if frontend_key in env_local:
            print(f"  {backend_key}: {env_local[frontend_key][:20]}...")

if __name__ == "__main__":
    print("=== Configurando Chaves de IA ===")
    update_backend_env()
