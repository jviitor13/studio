#!/usr/bin/env python3
"""
Script de deploy para produção - RodoCheck Backend
Este script automatiza o processo de deploy em ambiente de produção.
"""

import os
import sys
import subprocess
import logging
from pathlib import Path
from typing import List, Dict, Any

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ProductionDeployer:
    """
    Classe para gerenciar o deploy de produção.
    """
    
    def __init__(self, project_root: str = None):
        """
        Inicializa o deployer.
        
        Args:
            project_root: Caminho raiz do projeto
        """
        self.project_root = Path(project_root) if project_root else Path(__file__).parent
        self.venv_path = self.project_root / 'venv'
        self.requirements_file = self.project_root / 'requirements-production.txt'
        self.env_file = self.project_root / '.env'
        
    def deploy(self) -> bool:
        """
        Executa o processo completo de deploy.
        
        Returns:
            bool: True se o deploy foi bem-sucedido
        """
        try:
            logger.info("🚀 Iniciando deploy de produção...")
            
            # 1. Validar ambiente
            if not self._validate_environment():
                logger.error("❌ Validação de ambiente falhou")
                return False
            
            # 2. Backup do banco de dados
            if not self._backup_database():
                logger.error("❌ Backup do banco de dados falhou")
                return False
            
            # 3. Atualizar dependências
            if not self._update_dependencies():
                logger.error("❌ Atualização de dependências falhou")
                return False
            
            # 4. Executar migrações
            if not self._run_migrations():
                logger.error("❌ Migrações falharam")
                return False
            
            # 5. Coletar arquivos estáticos
            if not self._collect_static_files():
                logger.error("❌ Coleta de arquivos estáticos falhou")
                return False
            
            # 6. Reiniciar serviços
            if not self._restart_services():
                logger.error("❌ Reinicialização de serviços falhou")
                return False
            
            # 7. Verificar saúde da aplicação
            if not self._health_check():
                logger.error("❌ Verificação de saúde falhou")
                return False
            
            logger.info("✅ Deploy de produção concluído com sucesso!")
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro durante o deploy: {e}")
            return False
    
    def _validate_environment(self) -> bool:
        """
        Valida se o ambiente está configurado corretamente.
        
        Returns:
            bool: True se válido
        """
        logger.info("🔍 Validando ambiente...")
        
        # Verificar se estamos em produção
        if os.environ.get('DJANGO_SETTINGS_MODULE') != 'rodocheck_backend.settings_production':
            logger.warning("⚠️  DJANGO_SETTINGS_MODULE não está configurado para produção")
        
        # Verificar variáveis obrigatórias
        required_vars = [
            'SECRET_KEY',
            'DB_NAME',
            'DB_USER',
            'DB_PASSWORD',
            'DB_HOST',
            'GOOGLE_OAUTH_CLIENT_ID',
            'GOOGLE_OAUTH_CLIENT_SECRET',
        ]
        
        missing_vars = []
        for var in required_vars:
            if not os.environ.get(var):
                missing_vars.append(var)
        
        if missing_vars:
            logger.error(f"❌ Variáveis de ambiente obrigatórias não definidas: {missing_vars}")
            return False
        
        logger.info("✅ Ambiente validado com sucesso")
        return True
    
    def _backup_database(self) -> bool:
        """
        Cria backup do banco de dados.
        
        Returns:
            bool: True se backup foi bem-sucedido
        """
        logger.info("💾 Criando backup do banco de dados...")
        
        try:
            # Criar diretório de backup se não existir
            backup_dir = self.project_root / 'backups'
            backup_dir.mkdir(exist_ok=True)
            
            # Nome do arquivo de backup
            from datetime import datetime
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_file = backup_dir / f'backup_{timestamp}.sql'
            
            # Comando de backup PostgreSQL
            db_name = os.environ.get('DB_NAME')
            db_user = os.environ.get('DB_USER')
            db_host = os.environ.get('DB_HOST')
            
            cmd = [
                'pg_dump',
                '-h', db_host,
                '-U', db_user,
                '-d', db_name,
                '-f', str(backup_file)
            ]
            
            # Executar backup
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                logger.info(f"✅ Backup criado: {backup_file}")
                return True
            else:
                logger.error(f"❌ Erro no backup: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Erro ao criar backup: {e}")
            return False
    
    def _update_dependencies(self) -> bool:
        """
        Atualiza dependências do Python.
        
        Returns:
            bool: True se atualização foi bem-sucedida
        """
        logger.info("📦 Atualizando dependências...")
        
        try:
            # Ativar ambiente virtual
            if sys.platform == 'win32':
                activate_script = self.venv_path / 'Scripts' / 'activate.bat'
                pip_cmd = str(self.venv_path / 'Scripts' / 'pip.exe')
            else:
                activate_script = self.venv_path / 'bin' / 'activate'
                pip_cmd = str(self.venv_path / 'bin' / 'pip')
            
            # Instalar dependências de produção
            cmd = [pip_cmd, 'install', '-r', str(self.requirements_file)]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                logger.info("✅ Dependências atualizadas com sucesso")
                return True
            else:
                logger.error(f"❌ Erro ao atualizar dependências: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Erro ao atualizar dependências: {e}")
            return False
    
    def _run_migrations(self) -> bool:
        """
        Executa migrações do Django.
        
        Returns:
            bool: True se migrações foram bem-sucedidas
        """
        logger.info("🔄 Executando migrações...")
        
        try:
            # Comando para executar migrações
            if sys.platform == 'win32':
                python_cmd = str(self.venv_path / 'Scripts' / 'python.exe')
            else:
                python_cmd = str(self.venv_path / 'bin' / 'python')
            
            cmd = [python_cmd, 'manage.py', 'migrate', '--noinput']
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.project_root)
            
            if result.returncode == 0:
                logger.info("✅ Migrações executadas com sucesso")
                return True
            else:
                logger.error(f"❌ Erro nas migrações: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Erro ao executar migrações: {e}")
            return False
    
    def _collect_static_files(self) -> bool:
        """
        Coleta arquivos estáticos.
        
        Returns:
            bool: True se coleta foi bem-sucedida
        """
        logger.info("📁 Coletando arquivos estáticos...")
        
        try:
            if sys.platform == 'win32':
                python_cmd = str(self.venv_path / 'Scripts' / 'python.exe')
            else:
                python_cmd = str(self.venv_path / 'bin' / 'python')
            
            cmd = [python_cmd, 'manage.py', 'collectstatic', '--noinput']
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=self.project_root)
            
            if result.returncode == 0:
                logger.info("✅ Arquivos estáticos coletados com sucesso")
                return True
            else:
                logger.error(f"❌ Erro ao coletar arquivos estáticos: {result.stderr}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Erro ao coletar arquivos estáticos: {e}")
            return False
    
    def _restart_services(self) -> bool:
        """
        Reinicia serviços necessários.
        
        Returns:
            bool: True se reinicialização foi bem-sucedida
        """
        logger.info("🔄 Reiniciando serviços...")
        
        try:
            # Lista de serviços para reiniciar
            services = ['gunicorn', 'celery', 'redis']
            
            for service in services:
                try:
                    # Tentar reiniciar serviço (pode falhar se não estiver rodando)
                    if sys.platform == 'win32':
                        subprocess.run(['net', 'stop', service], capture_output=True)
                        subprocess.run(['net', 'start', service], capture_output=True)
                    else:
                        subprocess.run(['sudo', 'systemctl', 'restart', service], capture_output=True)
                    
                    logger.info(f"✅ Serviço {service} reiniciado")
                except Exception as e:
                    logger.warning(f"⚠️  Não foi possível reiniciar {service}: {e}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Erro ao reiniciar serviços: {e}")
            return False
    
    def _health_check(self) -> bool:
        """
        Verifica se a aplicação está funcionando corretamente.
        
        Returns:
            bool: True se aplicação está saudável
        """
        logger.info("🏥 Verificando saúde da aplicação...")
        
        try:
            # Verificar se o servidor está respondendo
            import requests
            
            # URL de health check (se implementado)
            health_url = os.environ.get('HEALTH_CHECK_URL', 'http://localhost:8000/api/health/')
            
            response = requests.get(health_url, timeout=10)
            
            if response.status_code == 200:
                logger.info("✅ Aplicação está saudável")
                return True
            else:
                logger.error(f"❌ Aplicação não está saudável: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Erro na verificação de saúde: {e}")
            return False


def main():
    """
    Função principal do script de deploy.
    """
    if len(sys.argv) > 1:
        project_root = sys.argv[1]
    else:
        project_root = None
    
    deployer = ProductionDeployer(project_root)
    
    if deployer.deploy():
        logger.info("🎉 Deploy concluído com sucesso!")
        sys.exit(0)
    else:
        logger.error("💥 Deploy falhou!")
        sys.exit(1)


if __name__ == '__main__':
    main()

