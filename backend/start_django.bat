@echo off
echo === Iniciando Servidor Django ===
cd /d "%~dp0"
call venv\Scripts\activate.bat
python manage.py runserver 0.0.0.0:8000
pause


