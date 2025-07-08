
# 🔗 Integração com Banco NEON - Guia de Configuração

## 📋 O que foi preparado

✅ **Estrutura completa** para integração com API externa  
✅ **Hook customizado** para gerenciar atendimentos  
✅ **Serviço de API** configurável  
✅ **Schema do banco** pronto para NEON  
✅ **Interface atualizada** com dados dinâmicos  
✅ **Sistema de filtros** funcionando  
✅ **Exportação CSV** implementada  

## 🚀 Próximos passos para você

### 1. Configurar o Banco NEON

1. Acesse seu painel do NEON
2. Execute o SQL que está em `src/config/database.ts` (variável `DATABASE_SCHEMA`)
3. Anote suas credenciais de conexão

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com:

```env
# Banco NEON
REACT_APP_DB_HOST=your-neon-host.neon.tech
REACT_APP_DB_NAME=your-database-name
REACT_APP_DB_USER=your-username
REACT_APP_DB_PASSWORD=your-password
REACT_APP_DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# API Backend
REACT_APP_API_URL=http://localhost:3001/api

# BotConversa
REACT_APP_BOTCONVERSA_API_URL=https://api.botconversa.com.br
REACT_APP_BOTCONVERSA_TOKEN=your-token
REACT_APP_BOTCONVERSA_WEBHOOK_SECRET=your-secret
```

### 3. Criar API Backend (Node.js/Express)

Você precisará criar uma API backend que:

- Conecte com o NEON usando as credenciais
- Exponha endpoints REST para CRUD de atendimentos
- Receba webhooks da BotConversa
- Processe e sincronize os dados

### 4. Endpoints necessários na sua API:

```
GET    /api/atendimentos          - Lista atendimentos com filtros
POST   /api/atendimentos          - Cria novo atendimento
PATCH  /api/atendimentos/:id      - Atualiza atendimento
POST   /api/botconversa/webhook   - Recebe webhook da BotConversa
```

### 5. Webhook da BotConversa

Configure na BotConversa para enviar webhooks para:
`https://sua-api.com/api/botconversa/webhook`

## 🔧 Como funciona agora

1. **Dados Mock**: Enquanto não conectar a API, usa dados de exemplo
2. **Auto-refresh**: Atualiza dados a cada 30 segundos
3. **Filtros**: Funcionam localmente e serão enviados para API
4. **Status**: Pode ser alterado manualmente (será sincronizado com API)
5. **Exportar**: Gera CSV com os dados atuais

## 📁 Arquivos modificados/criados

- ✅ `src/services/atendimentosService.ts` - Serviço de API
- ✅ `src/hooks/useAtendimentos.ts` - Hook para gerenciar dados  
- ✅ `src/pages/Atendimentos.tsx` - Interface atualizada
- ✅ `src/config/database.ts` - Configurações e schema SQL
- ✅ `README_INTEGRACAO.md` - Este guia

## 🎯 Benefícios

- **Tempo real**: Dados sincronizados automaticamente
- **Filtros avançados**: Busca por qualquer campo
- **Status dinâmico**: Atualização em tempo real
- **Exportação**: Relatórios em CSV
- **Error handling**: Fallback para dados locais
- **Performance**: Cache e otimizações

**Tudo pronto para você conectar com seu NEON! 🚀**
