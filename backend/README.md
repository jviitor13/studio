# RodoCheck Backend

Backend Django para o sistema RodoCheck com autenticação Google OAuth e integração com Google Drive.

## 🚀 Configuração

### 1. Instalar dependências
```bash
pip install -r requirements.txt
```

### 2. Configurar variáveis de ambiente
Copie o arquivo `env.example` para `.env` e configure:

```bash
cp env.example .env
```

### 3. Configurar banco de dados
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### 4. Executar servidor
```bash
python manage.py runserver
```

## 🔧 Configuração Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um projeto ou selecione um existente
3. Ative a Google+ API
4. Crie credenciais OAuth 2.0
5. Configure as URLs de redirecionamento:
   - `http://localhost:8000/accounts/google/login/callback/`
   - `http://localhost:3000/auth/callback` (para frontend)

## 📁 Estrutura do Projeto

```
backend/
├── authentication/     # Autenticação e usuários
├── checklists/        # Gestão de checklists
├── vehicles/          # Gestão de veículos
├── users/             # Perfis de usuário
└── rodocheck_backend/ # Configurações Django
```

## 🔗 APIs Disponíveis

### Autenticação
- `POST /api/auth/google/` - Login com Google
- `POST /api/auth/login/` - Login tradicional
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/me/` - Informações do usuário

### Checklists
- `GET /api/checklists/` - Listar checklists
- `POST /api/checklists/` - Criar checklist
- `GET /api/checklists/{id}/` - Detalhes do checklist
- `POST /api/checklists/{id}/retry/` - Reenviar para Google Drive

### Veículos
- `GET /api/vehicles/` - Listar veículos
- `POST /api/vehicles/` - Criar veículo
- `GET /api/vehicles/{id}/` - Detalhes do veículo

## 🔄 Integração com Google Drive

O sistema automaticamente:
1. Cria pastas organizadas por veículo e data
2. Gera PDFs dos checklists
3. Faz upload de imagens individuais
4. Organiza tudo no Google Drive compartilhado

## 🎯 Próximos Passos

1. Configurar Redis para Celery
2. Implementar notificações
3. Adicionar relatórios avançados
4. Implementar backup automático
