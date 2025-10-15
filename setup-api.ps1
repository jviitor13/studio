# Script de Configuração da API - RodoCheck
# Execute este script para configurar as variáveis de ambiente

Write-Host "=== Configuração da API RodoCheck ===" -ForegroundColor Green
Write-Host ""

# Verificar se o arquivo .env.local existe
if (Test-Path ".env.local") {
    Write-Host "Arquivo .env.local já existe." -ForegroundColor Yellow
    $overwrite = Read-Host "Deseja sobrescrever? (s/n)"
    if ($overwrite -ne "s" -and $overwrite -ne "S") {
        Write-Host "Configuração cancelada." -ForegroundColor Red
        exit
    }
}

Write-Host "Criando arquivo .env.local..." -ForegroundColor Blue

# Criar conteúdo do arquivo .env.local
$envContent = @"
# Configurações do Google AI/Genkit
# Obtenha sua chave em: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# Configurações do Google Drive (opcional - já configurado via service account)
GOOGLE_API_KEY=your_google_api_key_here

# Configurações do Firebase (já configurado via service account)
FIREBASE_PROJECT_ID=rodocheck-244cd
FIREBASE_STORAGE_BUCKET=rodocheck-244cd.appspot.com
"@

# Escrever arquivo
$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host "Arquivo .env.local criado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Obtenha sua chave da API Gemini em: https://aistudio.google.com/app/apikey"
Write-Host "2. Edite o arquivo .env.local e substitua 'your_gemini_api_key_here' pela sua chave"
Write-Host "3. Reinicie o servidor de desenvolvimento"
Write-Host ""
Write-Host "Para obter a chave da API Gemini:" -ForegroundColor Cyan
Write-Host "- Acesse: https://aistudio.google.com/app/apikey"
Write-Host "- Faça login com sua conta Google"
Write-Host "- Clique em 'Create API Key'"
Write-Host "- Copie a chave gerada"
Write-Host ""
Write-Host "Configuração concluída!" -ForegroundColor Green
