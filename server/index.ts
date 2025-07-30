import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

(async () => {
  if (process.env.NODE_ENV === 'development') {
  console.log("Iniciando servidor...");
}
  let server;
  
  try {
    server = await registerRoutes(app);
    if (process.env.NODE_ENV === 'development') {
      console.log("Rotas registradas com sucesso");
    }
  } catch (error) {
    console.error("Erro ao registrar rotas:", error);
    process.exit(1);
  }

  // Middleware de tratamento de erros robusto
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Erro interno do servidor";
    
    // Log detalhado do erro
    console.error(`[ERROR] ${req.method} ${req.path} - Status: ${status}`, {
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      timestamp: new Date().toISOString()
    });

    // Resposta padronizada
    res.status(status).json({ 
      message,
      code: err.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  });

  // Middleware para rotas não encontradas
  app.use('*', (req: Request, res: Response) => {
    res.status(404).json({
      message: `Rota não encontrada: ${req.method} ${req.originalUrl}`,
      code: 'ROUTE_NOT_FOUND',
      timestamp: new Date().toISOString()
    });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "development") {
    console.log("Configurando Vite para desenvolvimento...");
    await setupVite(app, server);
    console.log("Vite configurado com sucesso!");
  } else {
    console.log("Configurando servidor estático para produção...");
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    log(`serving on port ${port}`);
  });
})().catch(error => {
  console.error("Erro fatal no servidor:", error);
  process.exit(1);
});
