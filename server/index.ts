// Interceptador de logs deve ser o primeiro import em produção
import "./utils/productionLogger";

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./config/vite";
import { logger } from "./utils/logger";

const app = express();

// Middlewares para compatibilidade global e acessibilidade
app.use((req, res, next) => {
  // Headers de segurança e acessibilidade global
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('X-Content-Type-Options', 'nosniff');
  // Removido X-Frame-Options para permitir embed em iframes
  res.header('X-XSS-Protection', '1; mode=block');
  
  // Suporte a requests OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api") || path.startsWith("/webhook")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Função principal com tratamento de erros robusto
async function startServer() {
  try {
    console.log("Iniciando servidor...");
    
    // Registrar rotas (incluindo configuração do Vite)
    const server = await registerRoutes(app);
    console.log("Rotas registradas com sucesso");
    
    const port = Number(process.env.PORT) || 5000;
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '0.0.0.0';
    
    server.listen(port, host, () => {
      logger.production();
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log(`Server running on ${host}:${port}`);
      log(`serving on port ${port}`);
    });
    
    // Tratamento de sinais para shutdown graceful
    process.on('SIGTERM', () => {
      logger.production();
      server.close(() => {
        logger.production();
        process.exit(0);
      });
    });
    
    process.on('SIGINT', () => {
      logger.production();
      server.close(() => {
        logger.production();
        process.exit(0);
      });
    });
    
  } catch (error) {
    logger.error('Erro crítico na inicialização do servidor:', error);
    console.error('Erro crítico na inicialização do servidor:', error);
    process.exit(1);
  }
}

// Tratamento global de erros não capturados
process.on('uncaughtException', (error) => {
  logger.error('Exceção não capturada:', error);
  console.error('Exceção não capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Promise rejeitada não tratada:', { reason, promise });
  console.error('Promise rejeitada não tratada:', reason);
  process.exit(1);
});

// Iniciar servidor
startServer();