import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export interface ApiError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
}

// Middleware global de tratamento de erros
export const globalErrorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = error.status || error.statusCode || 500;
  const message = error.message || "Erro interno do servidor";
  const code = error.code || 'INTERNAL_ERROR';
  
  // Log detalhado do erro
  logger.error(`[ERROR] ${req.method} ${req.path} - Status: ${status}`, {
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    request: {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.method !== 'GET' ? req.body : undefined,
      query: req.query,
      params: req.params
    },
    timestamp: new Date().toISOString()
  });

  // Resposta padronizada de erro
  const errorResponse = {
    success: false,
    message,
    code,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error
    })
  };

  res.status(status).json(errorResponse);
};

// Middleware para capturar erros 404
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error: ApiError = new Error(`Rota não encontrada: ${req.method} ${req.path}`);
  error.status = 404;
  error.code = 'ROUTE_NOT_FOUND';
  next(error);
};

// Wrapper para funções async que automaticamente captura erros
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware para validação de requisições
export const validateRequest = (schema: any, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse(req[property]);
      req[property] = validatedData;
      next();
    } catch (error: any) {
      logger.warn(`[VALIDATION] Erro de validação em ${req.path}:`, error.errors);
      
      const apiError: ApiError = new Error('Dados de entrada inválidos');
      apiError.status = 400;
      apiError.code = 'VALIDATION_ERROR';
      
      res.status(400).json({
        success: false,
        message: 'Dados de entrada inválidos',
        code: 'VALIDATION_ERROR',
        errors: error.errors,
        timestamp: new Date().toISOString()
      });
    }
  };
};

// Middleware para rate limiting básico
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (maxRequests: number = 10000, windowMs: number = 15 * 60 * 1000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // TEMPORARILY DISABLED for development - rate limiting was causing 429 errors
    // Skip rate limiting entirely in development environment
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    
    // Verificar se usuário está autenticado - aplicar limite mais flexível
    const authHeader = req.headers.authorization;
    const isAuthenticated = authHeader && authHeader.startsWith('Bearer ');
    
    // Aplicar limites muito mais permissivos
    const effectiveLimit = isAuthenticated ? maxRequests * 10 : maxRequests;
    
    const clientId = req.ip || 'unknown';
    const now = Date.now();
    
    let clientData = requestCounts.get(clientId);
    
    if (!clientData || now > clientData.resetTime) {
      clientData = { count: 1, resetTime: now + windowMs };
      requestCounts.set(clientId, clientData);
      return next();
    }
    
    if (clientData.count >= effectiveLimit) {
      const logMessage = isAuthenticated 
        ? `[RATE_LIMIT] Usuário autenticado ${clientId} excedeu limite de ${effectiveLimit} requisições`
        : `[RATE_LIMIT] Cliente não autenticado ${clientId} excedeu limite de ${effectiveLimit} requisições`;
      
      logger.warn(logMessage);
      return res.status(429).json({
        success: false,
        message: 'Muitas requisições. Tente novamente mais tarde.',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((clientData.resetTime - now) / 1000),
        timestamp: new Date().toISOString()
      });
    }
    
    clientData.count++;
    next();
  };
};

// Health check endpoint robusto para Autoscale
export const healthCheck = (req: Request, res: Response) => {
  try {
    const healthData = {
      status: 'ok',
      service: 'ERP-Edunexia',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      memory: process.memoryUsage(),
      version: process.version,
      env: process.env.NODE_ENV,
      port: process.env.PORT || 5000,
      checks: {
        database: 'ok', // TODO: adicionar check real do banco
        memory: process.memoryUsage().heapUsed < 500 * 1024 * 1024 ? 'ok' : 'warning'
      }
    };
    
    logger.info(`[HEALTH] Health check requested from ${req.ip}`);
    res.status(200).json(healthData);
  } catch (error) {
    logger.error('[HEALTH] Health check failed:', error);
    res.status(503).json({
      status: 'error',
      message: 'Service unavailable',
      timestamp: new Date().toISOString()
    });
  }
};