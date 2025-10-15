# 🚀 Guia de Deploy para Produção - RodoCheck

Este guia fornece instruções completas para fazer deploy do RodoCheck em ambiente de produção.

## 📋 Pré-requisitos

### Servidor
- Ubuntu 20.04+ ou similar
- Mínimo 2GB RAM, 2 CPU cores
- 20GB+ espaço em disco
- Acesso root/sudo

### Domínio e SSL
- Domínio configurado
- Certificados SSL (Let's Encrypt recomendado)

## 🔧 Configuração do Servidor

### 1. Preparar o Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y python3 python3-pip python3-venv postgresql postgresql-contrib redis-server nginx supervisor git curl wget build-essential libpq-dev python3-dev
```

### 2. Configurar Banco de Dados

```bash
# Acessar PostgreSQL
sudo -u postgres psql

# Criar banco e usuário
CREATE DATABASE rodocheck_prod;
CREATE USER rodocheck_user WITH PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE rodocheck_prod TO rodocheck_user;
ALTER USER rodocheck_user CREATEDB;
\q
```

### 3. Configurar Redis

```bash
# Redis já deve estar rodando, mas vamos verificar
sudo systemctl enable redis-server
sudo systemctl start redis-server
sudo systemctl status redis-server
```

## 📁 Deploy da Aplicação

### 1. Preparar Diretórios

```bash
# Criar usuário da aplicação
sudo useradd -m -s /bin/bash rodocheck
sudo usermod -aG www-data rodocheck

# Criar diretórios
sudo mkdir -p /opt/rodocheck
sudo mkdir -p /var/log/rodocheck
sudo mkdir -p /var/run/rodocheck
sudo chown -R rodocheck:rodocheck /opt/rodocheck
sudo chown -R rodocheck:rodocheck /var/log/rodocheck
sudo chown -R rodocheck:rodocheck /var/run/rodocheck
```

### 2. Fazer Upload do Código

```bash
# Como usuário rodocheck
sudo su - rodocheck
cd /opt/rodocheck

# Clonar repositório ou fazer upload do código
git clone https://github.com/seu-usuario/rodocheck.git .
# OU fazer upload via SCP/SFTP
```

### 3. Configurar Ambiente Python

```bash
# Criar ambiente virtual
python3 -m venv venv
source venv/bin/activate

# Instalar dependências
pip install -r requirements-production.txt
```

### 4. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp env.production.example .env

# Editar variáveis
nano .env
```

**Configurações obrigatórias no .env:**

```env
# Django
SECRET_KEY=sua-chave-secreta-super-segura
DEBUG=False
ALLOWED_HOSTS=seu-dominio.com,www.seu-dominio.com

# Banco de dados
DB_NAME=rodocheck_prod
DB_USER=rodocheck_user
DB_PASSWORD=sua_senha_segura
DB_HOST=localhost

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=seu-client-id
GOOGLE_OAUTH_CLIENT_SECRET=seu-client-secret

# Segurança
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
```

### 5. Executar Deploy

```bash
# Ativar ambiente virtual
source venv/bin/activate

# Executar script de deploy
python deploy_production.py
```

## 🌐 Configuração do Nginx

### 1. Configurar Site

```bash
sudo nano /etc/nginx/sites-available/rodocheck
```

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com;

    # SSL (configure seus certificados)
    ssl_certificate /etc/ssl/certs/seu-dominio.crt;
    ssl_certificate_key /etc/ssl/private/seu-dominio.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Headers de segurança
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Proxy para Django
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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
```

### 2. Ativar Site

```bash
sudo ln -sf /etc/nginx/sites-available/rodocheck /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

## 🔄 Configuração do Supervisor

### 1. Configurar Gunicorn

```bash
sudo nano /etc/supervisor/conf.d/rodocheck-gunicorn.conf
```

```ini
[program:rodocheck-gunicorn]
command=/opt/rodocheck/venv/bin/gunicorn --bind 127.0.0.1:8000 --workers 3 --timeout 120 rodocheck_backend.wsgi:application
directory=/opt/rodocheck
user=rodocheck
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/rodocheck/gunicorn.log
stderr_logfile=/var/log/rodocheck/gunicorn_error.log
```

### 2. Configurar Celery

```bash
sudo nano /etc/supervisor/conf.d/rodocheck-celery.conf
```

```ini
[program:rodocheck-celery]
command=/opt/rodocheck/venv/bin/celery -A rodocheck_backend worker --loglevel=info
directory=/opt/rodocheck
user=rodocheck
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/rodocheck/celery.log
stderr_logfile=/var/log/rodocheck/celery_error.log
```

### 3. Iniciar Serviços

```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start all
```

## 🔒 Configuração de SSL

### Usando Let's Encrypt (Recomendado)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Configurar renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🚀 Deploy do Frontend (Next.js)

### 1. Configurar Frontend

```bash
# No diretório do frontend
npm install
npm run build:production
```

### 2. Configurar PM2 (Opcional)

```bash
# Instalar PM2
npm install -g pm2

# Criar arquivo de configuração
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'rodocheck-frontend',
    script: 'npm',
    args: 'start:production',
    cwd: '/opt/rodocheck/frontend',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

```bash
# Iniciar com PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 📊 Monitoramento

### 1. Verificar Status dos Serviços

```bash
# Verificar serviços
sudo supervisorctl status
sudo systemctl status nginx
sudo systemctl status redis-server
sudo systemctl status postgresql

# Verificar logs
tail -f /var/log/rodocheck/gunicorn.log
tail -f /var/log/rodocheck/celery.log
```

### 2. Health Check

```bash
# Testar aplicação
curl -I https://seu-dominio.com/api/health/
```

## 🔧 Manutenção

### 1. Backup Automático

```bash
# O script de backup já está configurado
# Verificar se está funcionando
sudo crontab -l -u rodocheck
```

### 2. Atualizações

```bash
# Atualizar código
cd /opt/rodocheck
git pull origin main

# Executar deploy
source venv/bin/activate
python deploy_production.py
```

### 3. Logs

```bash
# Ver logs em tempo real
tail -f /var/log/rodocheck/*.log

# Rotacionar logs
sudo logrotate -f /etc/logrotate.d/rodocheck
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro 502 Bad Gateway**
   ```bash
   sudo supervisorctl restart rodocheck-gunicorn
   ```

2. **Erro de banco de dados**
   ```bash
   sudo systemctl restart postgresql
   ```

3. **Erro de Redis**
   ```bash
   sudo systemctl restart redis-server
   ```

4. **Erro de permissões**
   ```bash
   sudo chown -R rodocheck:rodocheck /opt/rodocheck
   ```

### Verificar Configurações

```bash
# Verificar variáveis de ambiente
cd /opt/rodocheck
source venv/bin/activate
python manage.py check --deploy

# Verificar configurações de produção
python -c "from rodocheck_backend.settings_production import *; print('Configurações OK')"
```

## 📞 Suporte

Em caso de problemas:

1. Verificar logs: `/var/log/rodocheck/`
2. Verificar status dos serviços: `sudo supervisorctl status`
3. Verificar configurações: `python manage.py check --deploy`
4. Verificar conectividade: `curl -I https://seu-dominio.com`

---

**✅ Deploy concluído com sucesso!**

Sua aplicação RodoCheck está rodando em produção com:
- ✅ Django com PostgreSQL
- ✅ Next.js otimizado
- ✅ Nginx com SSL
- ✅ Redis para cache
- ✅ Celery para tarefas assíncronas
- ✅ Headers de segurança
- ✅ Backup automático
- ✅ Monitoramento

