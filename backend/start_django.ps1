# Script PowerShell para iniciar o servidor Django
Write-Host "=== Iniciando Servidor Django ===" -ForegroundColor Green

# Mudar para o diretório do script
Set-Location $PSScriptRoot

# Ativar ambiente virtual
Write-Host "Ativando ambiente virtual..." -ForegroundColor Yellow
& ".\venv\Scripts\Activate.ps1"

# Iniciar servidor Django
Write-Host "Iniciando servidor Django..." -ForegroundColor Yellow
Write-Host "Acesse: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Endpoints de IA: http://localhost:8000/api/ai/" -ForegroundColor Cyan
Write-Host "Pressione Ctrl+C para parar o servidor" -ForegroundColor Red
Write-Host ""

python manage.py runserver 0.0.0.0:8000


