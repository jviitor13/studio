#!/bin/bash
# Script de configuração para produção - RodoCheck Backend
# Este script configura o ambiente de produção

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Verificar se está rodando como root
if [[ $EUID -eq 0 ]]; then
   error "Este script não deve ser executado como root"
   exit 1
fi

log "🚀 Iniciando configuração de produção..."

# 1. Atualizar sistema
log "📦 Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# 2. Instalar dependências do sistema
log "🔧 Instalando dependências do sistema..."
sudo apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    postgresql \
    postgresql-contrib \
    redis-server \
    nginx \
    supervisor \
    git \
    curl \
    wget \
    build-essential \
    libpq-dev \
    python3-dev

# 3. Configurar PostgreSQL
log "🐘 Configurando PostgreSQL..."
sudo -u postgres psql -c "CREATE DATABASE rodocheck_prod;"
sudo -u postgres psql -c "CREATE USER rodocheck_user WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE rodocheck_prod TO rodocheck_user;"
sudo -u postgres psql -c "ALTER USER rodocheck_user CREATEDB;"

# 4. Configurar Redis
log "🔴 Configurando Redis..."
sudo systemctl enable redis-server
sudo systemctl start redis-server

# 5. Criar usuário para aplicação
log "👤 Criando usuário para aplicação..."
sudo useradd -m -s /bin/bash rodocheck || true
sudo usermod -aG www-data rodocheck

# 6. Criar diretórios
log "📁 Criando diretórios..."
sudo mkdir -p /opt/rodocheck
sudo mkdir -p /var/log/rodocheck
sudo mkdir -p /var/run/rodocheck
sudo chown -R rodocheck:rodocheck /opt/rodocheck
sudo chown -R rodocheck:rodocheck /var/log/rodocheck
sudo chown -R rodocheck:rodocheck /var/run/rodocheck

# 7. Configurar Nginx
log "🌐 Configurando Nginx..."
sudo tee /etc/nginx/sites-available/rodocheck << EOF
server {
    listen 80;
    server_name your-domain.com;

    # Redirecionar HTTP para HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # Configurações SSL (certificados devem ser configurados)
    ssl_certificate /etc/ssl/certs/your-domain.crt;
    ssl_certificate_key /etc/ssl/private/your-domain.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Headers de segurança
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Configurações de upload
    client_max_body_size 10M;

    # Proxy para Django
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Arquivos estáticos
    location /static/ {
        alias /opt/rodocheck/staticfiles/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Arquivos de mídia
    location /media/ {
        alias /opt/rodocheck/media/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Habilitar site
sudo ln -sf /etc/nginx/sites-available/rodocheck /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# 8. Configurar Supervisor
log "👨‍💼 Configurando Supervisor..."

# Configuração do Gunicorn
sudo tee /etc/supervisor/conf.d/rodocheck-gunicorn.conf << EOF
[program:rodocheck-gunicorn]
command=/opt/rodocheck/venv/bin/gunicorn --bind 127.0.0.1:8000 --workers 3 --timeout 120 rodocheck_backend.wsgi:application
directory=/opt/rodocheck
user=rodocheck
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/rodocheck/gunicorn.log
stderr_logfile=/var/log/rodocheck/gunicorn_error.log
EOF

# Configuração do Celery
sudo tee /etc/supervisor/conf.d/rodocheck-celery.conf << EOF
[program:rodocheck-celery]
command=/opt/rodocheck/venv/bin/celery -A rodocheck_backend worker --loglevel=info
directory=/opt/rodocheck
user=rodocheck
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/rodocheck/celery.log
stderr_logfile=/var/log/rodocheck/celery_error.log
EOF

# Configuração do Celery Beat
sudo tee /etc/supervisor/conf.d/rodocheck-celery-beat.conf << EOF
[program:rodocheck-celery-beat]
command=/opt/rodocheck/venv/bin/celery -A rodocheck_backend beat --loglevel=info
directory=/opt/rodocheck
user=rodocheck
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/rodocheck/celery_beat.log
stderr_logfile=/var/log/rodocheck/celery_beat_error.log
EOF

# Recarregar Supervisor
sudo supervisorctl reread
sudo supervisorctl update

# 9. Configurar firewall
log "🔥 Configurando firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# 10. Configurar logrotate
log "📝 Configurando rotação de logs..."
sudo tee /etc/logrotate.d/rodocheck << EOF
/var/log/rodocheck/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 rodocheck rodocheck
    postrotate
        supervisorctl restart rodocheck-gunicorn
        supervisorctl restart rodocheck-celery
    endscript
}
EOF

# 11. Configurar backup automático
log "💾 Configurando backup automático..."
sudo tee /opt/rodocheck/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/rodocheck/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

mkdir -p $BACKUP_DIR

# Backup do banco de dados
pg_dump -h localhost -U rodocheck_user -d rodocheck_prod > $BACKUP_FILE

# Comprimir backup
gzip $BACKUP_FILE

# Remover backups antigos (manter apenas 30 dias)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup criado: $BACKUP_FILE.gz"
EOF

sudo chmod +x /opt/rodocheck/backup.sh
sudo chown rodocheck:rodocheck /opt/rodocheck/backup.sh

# Adicionar ao crontab
echo "0 2 * * * /opt/rodocheck/backup.sh" | sudo crontab -u rodocheck -

log "✅ Configuração de produção concluída!"
log "📋 Próximos passos:"
log "1. Configure as variáveis de ambiente em /opt/rodocheck/.env"
log "2. Faça upload do código para /opt/rodocheck/"
log "3. Execute: python deploy_production.py"
log "4. Configure certificados SSL"
log "5. Reinicie os serviços: sudo supervisorctl restart all"

