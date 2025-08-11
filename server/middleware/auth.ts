import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { storage } from "../lib/storage";
import { logger } from "../utils/logger";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";

export interface AuthenticatedRequest extends Request {
  user?: any;
}

// Middleware robusto de autenticação com fallbacks e logs detalhados
export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // 1. Extrair token de múltiplas fontes
    const authHeader = req.headers['authorization'];
    const cookieToken = req.cookies?.token;
    const bodyToken = req.body?.token;
    
    let token = authHeader && authHeader.split(' ')[1];
    if (!token && cookieToken) token = cookieToken;
    if (!token && bodyToken) token = bodyToken;

    if (!token) {
      logger.warn(`[AUTH] Token ausente - IP: ${req.ip}, Path: ${req.path}, Headers: ${JSON.stringify(req.headers)}`);
      return res.status(401).json({ 
        message: 'Token de acesso requerido',
        code: 'NO_TOKEN',
        timestamp: new Date().toISOString()
      });
    }

    // 2. Verificar e decodificar token
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError: any) {
      logger.error(`[AUTH] Token inválido - IP: ${req.ip}, Error: ${jwtError.message}, Token: ${token.substring(0, 20)}...`);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token expirado',
          code: 'TOKEN_EXPIRED',
          timestamp: new Date().toISOString()
        });
      }
      
      return res.status(403).json({ 
        message: 'Token inválido',
        code: 'INVALID_TOKEN',
        timestamp: new Date().toISOString()
      });
    }

    // 3. Buscar usuário com retry automático
    let user;
    let retries = 0;
    const MAX_RETRIES = 3;
    
    while (retries < MAX_RETRIES) {
      try {
        user = await storage.getUser(decoded.userId);
        break;
      } catch (dbError: any) {
        retries++;
        logger.warn(`[AUTH] Tentativa ${retries}/${MAX_RETRIES} falhou ao buscar usuário ${decoded.userId}: ${dbError.message}`);
        
        if (retries >= MAX_RETRIES) {
          logger.error(`[AUTH] Falha persistente ao buscar usuário ${decoded.userId} após ${MAX_RETRIES} tentativas`);
          return res.status(500).json({ 
            message: 'Erro interno do servidor',
            code: 'DATABASE_ERROR',
            timestamp: new Date().toISOString()
          });
        }
        
        // Esperar antes de tentar novamente (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 100));
      }
    }

    // 4. Validar usuário encontrado
    if (!user) {
      logger.warn(`[AUTH] Usuário não encontrado - ID: ${decoded.userId}, Token válido mas usuário inexistente`);
      return res.status(401).json({ 
        message: 'Usuário não encontrado',
        code: 'USER_NOT_FOUND',
        timestamp: new Date().toISOString()
      });
    }

    // 5. Verificar se conta está ativa
    if (!user.isActive) {
      logger.warn(`[AUTH] Conta desativada - User ID: ${user.id}, Username: ${user.username}`);
      return res.status(401).json({ 
        message: 'Conta desativada',
        code: 'ACCOUNT_DISABLED',
        timestamp: new Date().toISOString()
      });
    }

    // 6. Sucesso - anexar usuário à requisição
    req.user = user;
    logger.debug(`[AUTH] Autenticação bem-sucedida - User: ${user.username} (${user.id}), Path: ${req.path}`);
    next();
    
  } catch (error: any) {
    logger.error(`[AUTH] Erro crítico na autenticação - IP: ${req.ip}, Path: ${req.path}, Error: ${error.message}`, error);
    return res.status(500).json({ 
      message: 'Erro interno do servidor',
      code: 'AUTH_SYSTEM_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

// Middleware opcional de autenticação (não bloqueia se token ausente)
export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // Continua sem usuário
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (error) {
    logger.debug(`[AUTH] Token opcional inválido, continuando sem autenticação: ${error}`);
  }
  
  next();
};

// Gerar token JWT com configurações seguras
export const generateToken = (userId: string | number): string => {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    {
      expiresIn: '24h',
      issuer: 'edunexia-crm',
      audience: 'edunexia-users'
    }
  );
};

// Validar se token é válido sem acessar banco de dados
export const isValidToken = (token: string): boolean => {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
};