
// CONFIGURAÇÕES DO BANCO NEON
// Substitua estas configurações pelas suas credenciais do NEON

export const DATABASE_CONFIG = {
  // Configurações do NEON Database
  host: process.env.REACT_APP_DB_HOST || 'your-neon-host.neon.tech',
  database: process.env.REACT_APP_DB_NAME || 'your-database-name',
  username: process.env.REACT_APP_DB_USER || 'your-username',
  password: process.env.REACT_APP_DB_PASSWORD || 'your-password',
  port: process.env.REACT_APP_DB_PORT || '5432',
  ssl: true, // NEON sempre usa SSL
};

// URL de conexão completa para o NEON
export const DATABASE_URL = process.env.REACT_APP_DATABASE_URL || 
  `postgresql://${DATABASE_CONFIG.username}:${DATABASE_CONFIG.password}@${DATABASE_CONFIG.host}:${DATABASE_CONFIG.port}/${DATABASE_CONFIG.database}?sslmode=require`;

// Configurações da API BotConversa
export const BOTCONVERSA_CONFIG = {
  apiUrl: process.env.REACT_APP_BOTCONVERSA_API_URL || 'https://api.botconversa.com.br',
  token: process.env.REACT_APP_BOTCONVERSA_TOKEN || 'your-botconversa-token',
  webhookSecret: process.env.REACT_APP_BOTCONVERSA_WEBHOOK_SECRET || 'your-webhook-secret',
};

// SQL Schema para criar as tabelas necessárias no NEON
export const DATABASE_SCHEMA = `
-- Tabela para armazenar atendimentos
CREATE TABLE IF NOT EXISTS atendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead VARCHAR(255) NOT NULL,
  hora VARCHAR(10) NOT NULL,
  atendente VARCHAR(255) NOT NULL,
  equipe VARCHAR(100) NOT NULL,
  duracao VARCHAR(10),
  status VARCHAR(20) CHECK (status IN ('Pendente', 'Em andamento', 'Concluído')) DEFAULT 'Pendente',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  botconversa_id VARCHAR(255) UNIQUE,
  dados_extras JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_atendimentos_status ON atendimentos(status);
CREATE INDEX IF NOT EXISTS idx_atendimentos_equipe ON atendimentos(equipe);
CREATE INDEX IF NOT EXISTS idx_atendimentos_timestamp ON atendimentos(timestamp);
CREATE INDEX IF NOT EXISTS idx_atendimentos_botconversa_id ON atendimentos(botconversa_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_atendimentos_updated_at 
    BEFORE UPDATE ON atendimentos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Tabela para logs de webhook da BotConversa
CREATE TABLE IF NOT EXISTS botconversa_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_data JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  atendimento_id UUID REFERENCES atendimentos(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhooks_processed ON botconversa_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_webhooks_created_at ON botconversa_webhooks(created_at);
`;
