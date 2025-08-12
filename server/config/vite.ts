import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options?) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  
  // SPA fallback - só para rotas que não são APIs, health checks ou recursos estáticos
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    
    // NÃO interceptar rotas de API, health checks ou recursos com extensão
    if (url.startsWith('/api') || 
        url.startsWith('/health') || 
        url === '/healthz' || 
        url === '/status' || 
        url === '/ping' ||
        url === '/test' ||
        url.includes('.')) { // arquivos .js, .css, .png, etc
      return next();
    }

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(process.cwd(), 'dist', 'public');

  if (!fs.existsSync(distPath)) {
    console.warn(`Build directory not found: ${distPath}. Tentando fallback...`);
    // Tentar servir do diretório client como fallback
    const clientDir = path.resolve(process.cwd(), 'client', 'public');
    if (fs.existsSync(clientDir)) {
      console.log(`Usando diretório client public como fallback: ${clientDir}`);
      app.use(express.static(clientDir, { index: false }));
      return;
    }
    throw new Error(`Nenhum diretório de arquivos estáticos encontrado. Execute 'npm run build' primeiro.`);
  }

  console.log(`Servindo arquivos estáticos de: ${distPath}`);
  app.use(express.static(distPath, { 
    index: false, 
    maxAge: '1d',
    etag: true 
  }));
}
