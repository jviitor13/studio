# 🔐 Configuração do Google OAuth

Para que o login pelo Google funcione corretamente, você precisa configurar as credenciais do Google OAuth.

## 📋 **PASSO A PASSO:**

### 1. **Criar Projeto no Google Cloud Console**

1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative a **Google+ API** e **Google Drive API**

### 2. **Configurar OAuth 2.0**

1. Vá para **APIs & Services** > **Credentials**
2. Clique em **Create Credentials** > **OAuth 2.0 Client IDs**
3. Configure:
   - **Application type**: Web application
   - **Name**: RodoCheck App
   - **Authorized JavaScript origins**:
     - `http://localhost:9002`
     - `http://localhost:3000`
   - **Authorized redirect URIs**:
     - `http://localhost:8000/accounts/google/login/callback/`
     - `http://localhost:3000/auth/callback`

### 3. **Configurar Variáveis de Ambiente**

#### **Frontend (.env.local):**
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=seu-client-id-aqui
```

#### **Backend (backend/.env):**
```bash
GOOGLE_OAUTH_CLIENT_ID=seu-client-id-aqui
GOOGLE_OAUTH_CLIENT_SECRET=seu-client-secret-aqui
```

### 4. **Configurar Google Drive (Opcional)**

Para upload automático de checklists:

1. Crie uma **Service Account** no Google Cloud Console
2. Baixe o arquivo JSON das credenciais
3. Configure no backend/.env:
```bash
GOOGLE_DRIVE_CREDENTIALS_FILE=caminho/para/service-account.json
GOOGLE_DRIVE_FOLDER_ID=id-da-pasta-no-google-drive
```

## ⚠️ **IMPORTANTE:**

- **NUNCA** commite as credenciais no Git
- Use sempre variáveis de ambiente
- Teste em ambiente de desenvolvimento primeiro
- Configure domínios de produção quando for deployar

## 🧪 **TESTANDO:**

1. Configure as variáveis de ambiente
2. Reinicie os servidores
3. Acesse `http://localhost:9002`
4. Teste o login com Google

## 🔧 **TROUBLESHOOTING:**

- **Erro 400**: Verifique se o Client ID está correto
- **Erro 403**: Verifique se as URLs estão autorizadas
- **Erro 500**: Verifique se as variáveis de ambiente estão configuradas

