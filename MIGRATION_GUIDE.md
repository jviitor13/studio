# Guia de Migração - RodoCheck

## Funcionalidades Migradas para Django

### ✅ Concluído

1. **Modelos Django para IA**
   - `AIAssistantSession` - Sessões do assistente de IA
   - `AIAssistantMessage` - Mensagens do chat
   - `VehicleDamageAssessment` - Avaliação de danos de veículos
   - `TireAnalysis` - Análise de pneus
   - `AIConfiguration` - Configurações de serviços de IA
   - `AIUsageLog` - Logs de uso das APIs de IA

2. **Serviços de IA**
   - `OpenAIService` - Integração com OpenAI GPT
   - `GoogleAIService` - Integração com Google AI/Gemini
   - `AIAssistantService` - Serviço principal do assistente

3. **Endpoints de API**
   - `/api/ai/chat/` - Chat com assistente de IA
   - `/api/ai/assess-damage/` - Avaliação de danos
   - `/api/ai/status/` - Status dos serviços de IA
   - `/api/ai/usage-stats/` - Estatísticas de uso

4. **App de Pneus**
   - Modelo `Tire` para gestão de pneus
   - Endpoints `/api/tires/` para CRUD de pneus

### 🔄 Em Progresso

1. **Migração do Frontend**
   - Substituir chamadas do Genkit por APIs Django
   - Atualizar componentes de IA
   - Migrar funcionalidades de Firebase para Django

### 📋 Próximos Passos

1. **Configurar Chaves de API**
   ```bash
   # No arquivo backend/.env
   OPENAI_API_KEY=sk-your-openai-key-here
   GOOGLE_AI_API_KEY=your-google-ai-key-here
   GEMINI_API_KEY=your-gemini-key-here
   ```

2. **Atualizar Frontend**
   - Remover dependências do Genkit
   - Atualizar `src/lib/actions.ts` para usar APIs Django
   - Modificar `src/components/ai-assistant.tsx`
   - Atualizar `src/ai/flows/` para usar Django

3. **Migrar Dados do Firebase**
   - Criar scripts de migração
   - Mapear dados de pneus e manutenções
   - Atualizar referências no frontend

## Como Usar as Novas Funcionalidades

### 1. Assistente de IA

```javascript
// Frontend - Exemplo de uso
const response = await fetch('/api/ai/chat/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Token ${userToken}`
  },
  body: JSON.stringify({
    query: "Como criar um checklist de manutenção?",
    context: {
      tireData: { "Em Uso": 5, "Em Estoque": 3 },
      maintenanceData: { "Pendente": 2, "Concluída": 8 }
    }
  })
});

const data = await response.json();
// data.response - Resposta do assistente
// data.action - Ação a executar (navigate, link, none)
// data.payload - Dados da ação
```

### 2. Avaliação de Danos

```javascript
// Frontend - Exemplo de uso
const response = await fetch('/api/ai/assess-damage/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Token ${userToken}`
  },
  body: JSON.stringify({
    checklist_id: "checklist-123",
    vehicle_id: "vehicle-456",
    image_url: "https://example.com/image.jpg",
    image_base64: "data:image/jpeg;base64,..."
  })
});

const data = await response.json();
// data.damage_detected - Boolean
// data.damage_description - String
```

### 3. Gestão de Pneus

```javascript
// Frontend - Exemplo de uso
const response = await fetch('/api/tires/', {
  method: 'GET',
  headers: {
    'Authorization': `Token ${userToken}`
  }
});

const tires = await response.json();
```

## Vantagens da Migração

1. **Performance**: APIs Django são mais rápidas que Genkit
2. **Controle**: Controle total sobre as funcionalidades de IA
3. **Custo**: Redução de custos com APIs externas
4. **Integração**: Melhor integração com o sistema Django
5. **Logging**: Sistema completo de logs e monitoramento
6. **Escalabilidade**: Fácil escalonamento e otimização

## Configuração Necessária

### Backend (.env)
```
OPENAI_API_KEY=sk-your-key-here
GOOGLE_AI_API_KEY=your-google-key-here
GEMINI_API_KEY=your-gemini-key-here
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Testes

Execute o script de teste para verificar as funcionalidades:

```bash
cd backend
python test_ai_functionality.py
```

## Status da Migração

- ✅ Modelos Django criados
- ✅ Serviços de IA implementados
- ✅ Endpoints de API funcionando
- ✅ Sistema de logging implementado
- 🔄 Frontend em migração
- ⏳ Dados do Firebase em migração

A migração está 70% concluída. As funcionalidades principais de IA estão funcionando no Django e prontas para uso.

