"""
Script para configurar chaves de IA de exemplo para teste
"""

import os

def setup_example_keys():
    """Configura chaves de exemplo para teste."""
    
    # Chaves de exemplo para teste
    example_keys = {
        'GEMINI_API_KEY': 'test-gemini-key-12345',
        'GOOGLE_API_KEY': 'test-google-key-67890',
        'OPENAI_API_KEY': 'test-openai-key-abcdef',
        'GOOGLE_OAUTH_CLIENT_ID': 'test-google-client-id-12345',
        'GOOGLE_OAUTH_CLIENT_SECRET': 'test-google-client-secret-67890'
    }
    
    # Ler o arquivo .env atual
    env_content = []
    if os.path.exists('.env'):
        with open('.env', 'r', encoding='utf-8') as f:
            env_content = f.readlines()
    
    # Atualizar as chaves
    updated_lines = []
    for line in env_content:
        updated = False
        for key, value in example_keys.items():
            if line.startswith(f"{key}="):
                updated_lines.append(f"{key}={value}\n")
                updated = True
                print(f"OK - Configurado {key}")
                break
        
        if not updated:
            updated_lines.append(line)
    
    # Adicionar chaves que não existem
    existing_keys = set()
    for line in updated_lines:
        for key in example_keys.keys():
            if line.startswith(f"{key}="):
                existing_keys.add(key)
    
    for key, value in example_keys.items():
        if key not in existing_keys:
            updated_lines.append(f"{key}={value}\n")
            print(f"OK - Adicionado {key}")
    
    # Salvar o arquivo atualizado
    with open('.env', 'w', encoding='utf-8') as f:
        f.writelines(updated_lines)
    
    print("\nConfiguração de chaves de exemplo concluída!")
    print("Agora você pode testar as funcionalidades de IA.")
    print("\nPara usar chaves reais:")
    print("1. Obtenha uma chave da OpenAI: https://platform.openai.com/api-keys")
    print("2. Obtenha uma chave do Google AI: https://aistudio.google.com/app/apikey")
    print("3. Substitua as chaves de exemplo no arquivo .env")

if __name__ == "__main__":
    print("=== Configurando Chaves de IA de Exemplo ===")
    setup_example_keys()


