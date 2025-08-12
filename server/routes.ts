import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketServer } from "socket.io";
import { setupVite, serveStatic } from "./config/vite";
import path from "path";
import bcrypt from "bcryptjs";
import { storage } from "./lib/storage";
import { logger } from "./utils/logger";
import { sql, eq, inArray } from "drizzle-orm";
import { db } from "./config/db";
import { users, conversations, attendanceMessages, internalNotes } from "@shared/schema";
import helmet from "helmet";
import compression from "compression";
import cors from "cors"; 
import { 
  insertUserSchema, 
  insertRegistrationTokenSchema, 
  insertCertificationSchema, 
  insertStudentEnrollmentSchema, 
  insertStudentDocumentSchema, 
  insertStudentPaymentSchema, 
  insertSimplifiedEnrollmentSchema,
  insertAcademicCourseSchema,
  insertAcademicProfessorSchema,
  insertAcademicDisciplineSchema,
  insertAcademicStudentSchema,
  insertAcademicGradeSchema,
  insertAcademicCertificateSchema,
  insertCertificateTemplateSchema,
  insertNegociacaoSchema,
  insertNegociacaoExpiradoSchema,
  insertQuitacaoSchema,
  insertEnvioUnicvSchema,
  insertEnvioFamarSchema,
  insertCertificacaoFadycSchema
} from "@shared/schema";
import { z } from "zod";
import jwt from "jsonwebtoken";
import { UnifiedAsaasService } from "./services/unified-asaas-service";
import asaasRoutes from "./routes/asaas-routes";
import { v4 as uuidv4 } from 'uuid';
import { PDFService } from './services/pdfService';
import { 
  certificacoesQuery, 
  atendimentosQuery, 
  negociacoesQuery, 
  quitacoesQuery,
  preRegisteredCoursesQuery,
  certificacoesFadycQuery,
  enviosQuery
} from './schemas/query';

// Importar middlewares robustos
import { 
  authenticateToken, 
  optionalAuth, 
  generateToken,
  type AuthenticatedRequest 
} from "./middleware/auth";
import { 
  globalErrorHandler, 
  notFoundHandler, 
  asyncHandler, 
  validateRequest, 
  rateLimiter, 
  healthCheck 
} from "./middleware/errorHandler";
import { rbac } from "./middleware/rbac";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";

// Configuração do serviço Asaas
const asaasService = new UnifiedAsaasService({
  baseURL: 'https://api.asaas.com/v3',
  apiKey: process.env.ASAAS_API_KEY!
});

// Configuração do serviço PDF
const pdfService = new PDFService(storage);

// Schema para login
const loginSchema = z.object({
  username: z.string().min(1, "Username é obrigatório"),
  password: z.string().min(1, "Password é obrigatório"),
});

// Schema para login do aluno (Portal do Aluno)
const studentLoginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  cpf: z.string().min(11, "CPF deve ter pelo menos 11 dígitos").max(14, "CPF inválido")
});

// Schema para login do professor
const professorLoginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// Schemas para proteção contra parseInt quebrando silenciosamente
const idParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

// Helper para validar parâmetros de ID com proteção contra parseInt
const validateIdParam = (req: any): number => {
  const result = idParamSchema.parse(req.params);
  return result.id;
};

// Helper para tratar erros de validação
const handleValidationError = (error: any, res: any, defaultMessage: string) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({ 
      message: "Parâmetros inválidos", 
      errors: error.errors 
    });
  }
  logger.error(defaultMessage, error);
  return res.status(500).json({ message: "Erro interno do servidor" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // --- sanity check de envs críticas (fail-fast) ---
  const requiredEnvs = {
    JWT_SECRET: process.env.JWT_SECRET || "your-super-secret-jwt-key",
    ASAAS_API_KEY: process.env.ASAAS_API_KEY,
    NODE_ENV: process.env.NODE_ENV
  } as const;

  for (const [k, v] of Object.entries(requiredEnvs)) {
    if (!v || String(v).trim() === "") {
      throw new Error(`Environment variable ${k} is missing`);
    }
  }

  // Configuração de segurança e CORS
  const ORIGINS = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);

  const server = createServer(app);
  const io = new SocketServer(server, {
    cors: {
      origin: (origin, cb) => {
        if (!origin) return cb(null, true); // permitir curl/postman
        if (ORIGINS.length === 0) return cb(null, true); // fallback em dev
        return ORIGINS.includes(origin) ? cb(null, true) : cb(new Error("Not allowed by CORS"));
      },
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      credentials: true,
      allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"]
    },
    transports: ['websocket', 'polling'], // Suporte a múltiplos transports
    allowEIO3: true, // Compatibilidade com versões antigas
    upgradeTimeout: 30000,
    pingTimeout: 60000,
    pingInterval: 25000
  });

  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: process.env.NODE_ENV === 'development' ? false : {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    }
  }));
  app.use(compression());

  app.use(cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true); // permitir curl/postman
      if (ORIGINS.length === 0) return cb(null, true); // fallback em dev
      return ORIGINS.includes(origin) ? cb(null, true) : cb(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET","POST","PUT","DELETE","OPTIONS"],
    allowedHeaders: ["Origin","X-Requested-With","Content-Type","Accept","Authorization"]
  }));

  // se usa proxy (replit/vercel/ingress), ative para rate-limit/IP correto
  app.set("trust proxy", 1);

  // Middlewares globais
  app.use(rateLimiter());

  // Health checks específicos para Autoscale
  app.get('/health', healthCheck);
  app.get('/api/health', healthCheck);
  app.get('/healthz', healthCheck);
  app.get('/status', healthCheck);
  
  // Health check simples para monitoramento básico (não intercepta a raiz)
  app.get('/ping', (req, res) => res.status(200).json({ status: 'ok', service: 'ERP-Edunexia' }));

  // ===== ENDPOINTS DE NEGOCIAÇÕES =====
  
  // Buscar negociações
  app.get("/api/negociacoes", async (req, res) => {
    try {
      const parse = negociacoesQuery.safeParse(req.query);
      if (!parse.success) {
        return res.status(400).json({ 
          message: "Parâmetros inválidos", 
          issues: parse.error.issues 
        });
      }
      
      const negociacoes = await storage.getNegociacoes(parse.data);
      res.json(negociacoes);
    } catch (error) {
      logger.error("Erro ao buscar negociações:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar negociação
  app.post("/api/negociacoes", validateRequest(insertNegociacaoSchema), async (req, res) => {
    try {
      const negociacao = await storage.createNegociacao(req.body);
      res.status(201).json(negociacao);
    } catch (error) {
      logger.error("Erro ao criar negociação:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Atualizar negociação
  app.put("/api/negociacoes/:id", async (req, res) => {
    try {
      const id = validateIdParam(req);
      const result = await storage.updateCertificacaoFadyc(id, req.body);
      
      if (!result) {
        return res.status(404).json({ message: "Item não encontrado" });
      }
      
      res.json(result);
    } catch (error) {
      return handleValidationError(error, res, "Erro na operação:");
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "ID inválido", 
          errors: error.errors 
        });
      }
      logger.error("Erro ao atualizar negociação:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Deletar negociação
  app.delete("/api/negociacoes/:id", async (req, res) => {
    try {
      const id = validateIdParam(req);
      const result = await storage.updateCertificacaoFadyc(id, req.body);
      
      if (!result) {
        return res.status(404).json({ message: "Item não encontrado" });
      }
      
      res.json(result);
    } catch (error) {
      return handleValidationError(error, res, "Erro na operação:");
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "ID inválido", 
          errors: error.errors 
        });
      }
      logger.error("Erro ao deletar negociação:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar negociações expiradas
  app.get("/api/negociacoes-expirados", async (req, res) => {
    try {
      const parse = negociacoesQuery.safeParse(req.query);
      if (!parse.success) {
        return res.status(400).json({ 
          message: "Parâmetros inválidos", 
          issues: parse.error.issues 
        });
      }
      
      const expirados = await storage.getNegociacoesExpirados(parse.data);
      res.json(expirados);
    } catch (error) {
      logger.error("Erro ao buscar negociações expiradas:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar quitações
  app.get("/api/quitacoes", async (req, res) => {
    try {
      const parse = quitacoesQuery.safeParse(req.query);
      if (!parse.success) {
        return res.status(400).json({ 
          message: "Parâmetros inválidos", 
          issues: parse.error.issues 
        });
      }
      
      const quitacoes = await storage.getQuitacoes(parse.data);
      res.json(quitacoes);
    } catch (error) {
      logger.error("Erro ao buscar quitações:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar certificações FADYC
  app.get("/api/certificacoes-fadyc", async (req, res) => {
    try {
      const parse = certificacoesFadycQuery.safeParse(req.query);
      if (!parse.success) {
        return res.status(400).json({ 
          message: "Parâmetros inválidos", 
          issues: parse.error.issues 
        });
      }
      
      const certificacoes = await storage.getCertificacoesFadyc(parse.data);
      res.json(certificacoes);
    } catch (error) {
      logger.error("Erro ao buscar certificações FADYC:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar certificação FADYC
  app.post("/api/certificacoes-fadyc", validateRequest(insertCertificacaoFadycSchema), async (req, res) => {
    try {
      const certificacao = await storage.createCertificacaoFadyc(req.body);
      res.status(201).json(certificacao);
    } catch (error) {
      logger.error("Erro ao criar certificação FADYC:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Atualizar certificação FADYC
  app.put("/api/certificacoes-fadyc/:id", async (req, res) => {
    try {
      const id = validateIdParam(req);
      const result = await storage.updateCertificacaoFadyc(id, req.body);
      
      if (!result) {
        return res.status(404).json({ message: "Item não encontrado" });
      }
      
      res.json(result);
    } catch (error) {
      return handleValidationError(error, res, "Erro na operação:");
      logger.error("Erro ao atualizar certificação FADYC:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Deletar certificação FADYC
  app.delete("/api/certificacoes-fadyc/:id", async (req, res) => {
    try {
      const id = validateIdParam(req);
      const result = await storage.updateCertificacaoFadyc(id, req.body);
      
      if (!result) {
        return res.status(404).json({ message: "Item não encontrado" });
      }
      
      res.json(result);
    } catch (error) {
      return handleValidationError(error, res, "Erro na operação:");
      logger.error("Erro ao deletar certificação FADYC:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar cursos pré-cadastrados
  app.get("/api/pre-registered-courses", async (req, res) => {
    try {
      const parse = preRegisteredCoursesQuery.safeParse(req.query);
      if (!parse.success) {
        return res.status(400).json({ 
          message: "Parâmetros inválidos", 
          issues: parse.error.issues 
        });
      }
      
      const courses = await storage.getPreRegisteredCourses(parse.data);
      res.json(courses);
    } catch (error) {
      logger.error("Erro ao buscar cursos pré-cadastrados:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar curso pré-cadastrado
  app.post("/api/pre-registered-courses", async (req, res) => {
    try {
      const course = await storage.createPreRegisteredCourse(req.body);
      res.status(201).json(course);
    } catch (error) {
      logger.error("Erro ao criar curso pré-cadastrado:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });





  // ===== ROTAS ACADÊMICAS =====
  
  // Buscar cursos acadêmicos
  app.get("/api/academic/courses", authenticateToken, rbac("admin"), async (req, res) => {
    try {
      const courses = await storage.getAcademicCourses();
      res.json(courses);
    } catch (error) {
      logger.error("Erro ao buscar cursos acadêmicos:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar curso acadêmico
  app.post("/api/academic/courses", authenticateToken, rbac("admin"), async (req, res) => {
    try {
      const course = await storage.createAcademicCourse(req.body);
      res.status(201).json(course);
    } catch (error) {
      logger.error("Erro ao criar curso acadêmico:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Atualizar curso acadêmico
  app.put("/api/academic/courses/:id", authenticateToken, rbac("admin"), async (req, res) => {
    try {
      const id = validateIdParam(req);
      const result = await storage.updateCertificacaoFadyc(id, req.body);
      
      if (!result) {
        return res.status(404).json({ message: "Item não encontrado" });
      }
      
      res.json(result);
    } catch (error) {
      return handleValidationError(error, res, "Erro na operação:");
      logger.error("Erro ao atualizar curso acadêmico:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Deletar curso acadêmico
  app.delete("/api/academic/courses/:id", authenticateToken, rbac("admin"), async (req, res) => {
    try {
      const id = validateIdParam(req);
      const result = await storage.updateCertificacaoFadyc(id, req.body);
      
      if (!result) {
        return res.status(404).json({ message: "Item não encontrado" });
      }
      
      res.json(result);
    } catch (error) {
      return handleValidationError(error, res, "Erro na operação:");
      logger.error("Erro ao deletar curso acadêmico:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar disciplinas acadêmicas
  app.get("/api/academic/disciplines", authenticateToken, rbac("admin"), async (req, res) => {
    try {
      const disciplines = await storage.getAcademicDisciplines();
      res.json(disciplines);
    } catch (error) {
      logger.error("Erro ao buscar disciplinas acadêmicas:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar disciplina acadêmica
  app.post("/api/academic/disciplines", authenticateToken, rbac("admin"), async (req, res) => {
    try {
      const discipline = await storage.createAcademicDiscipline(req.body);
      res.status(201).json(discipline);
    } catch (error) {
      logger.error("Erro ao criar disciplina acadêmica:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Atualizar disciplina acadêmica
  app.put("/api/academic/disciplines/:id", authenticateToken, rbac("admin"), async (req, res) => {
    try {
      const id = validateIdParam(req);
      const result = await storage.updateCertificacaoFadyc(id, req.body);
      
      if (!result) {
        return res.status(404).json({ message: "Item não encontrado" });
      }
      
      res.json(result);
    } catch (error) {
      return handleValidationError(error, res, "Erro na operação:");
      logger.error("Erro ao atualizar disciplina acadêmica:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Deletar disciplina acadêmica
  app.delete("/api/academic/disciplines/:id", authenticateToken, rbac("admin"), async (req, res) => {
    try {
      const id = validateIdParam(req);
      const result = await storage.updateCertificacaoFadyc(id, req.body);
      
      if (!result) {
        return res.status(404).json({ message: "Item não encontrado" });
      }
      
      res.json(result);
    } catch (error) {
      return handleValidationError(error, res, "Erro na operação:");
      logger.error("Erro ao deletar disciplina acadêmica:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar professores acadêmicos
  app.get("/api/academic/professors", authenticateToken, rbac("admin"), async (req, res) => {
    try {
      const professors = await storage.getAcademicProfessors();
      res.json(professors);
    } catch (error) {
      logger.error("Erro ao buscar professores acadêmicos:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar professor acadêmico
  app.post("/api/academic/professors", authenticateToken, rbac("admin"), async (req, res) => {
    try {
      const professor = await storage.createAcademicProfessor(req.body);
      res.status(201).json(professor);
    } catch (error) {
      logger.error("Erro ao criar professor acadêmico:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Atualizar professor acadêmico
  app.put("/api/academic/professors/:id", authenticateToken, rbac("admin"), async (req, res) => {
    try {
      const id = validateIdParam(req);
      const result = await storage.updateCertificacaoFadyc(id, req.body);
      
      if (!result) {
        return res.status(404).json({ message: "Item não encontrado" });
      }
      
      res.json(result);
    } catch (error) {
      return handleValidationError(error, res, "Erro na operação:");
      logger.error("Erro ao atualizar professor acadêmico:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Deletar professor acadêmico
  app.delete("/api/academic/professors/:id", authenticateToken, rbac("admin"), async (req, res) => {
    try {
      const id = validateIdParam(req);
      const result = await storage.updateCertificacaoFadyc(id, req.body);
      
      if (!result) {
        return res.status(404).json({ message: "Item não encontrado" });
      }
      
      res.json(result);
    } catch (error) {
      return handleValidationError(error, res, "Erro na operação:");
      logger.error("Erro ao buscar disciplinas do curso:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Adicionar disciplinas a um curso
  app.post("/api/academic/courses/:id/disciplines", authenticateToken, rbac("admin"), async (req, res) => {
    try {
      const courseId = validateIdParam(req);
      const { disciplineIds } = req.body;
      
      await storage.addDisciplinesToCourse(courseId, disciplineIds);
      res.json({ message: "Disciplinas adicionadas ao curso com sucesso" });
    } catch (error) {
      logger.error("Erro ao adicionar disciplinas ao curso:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Aplicar rotas Asaas
  app.use('/api/asaas', asaasRoutes);



  // ===== AUTENTICAÇÃO =====
  
  // Login do admin
  app.post("/api/auth/login", validateRequest(loginSchema), async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const user = await storage.getUserByUsername(username);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      const token = generateToken(user.id.toString(), user.role);
      logger.info(`[AUTH] Login bem-sucedido - User: ${user.username} (${user.id})`);
      
      res.json({ 
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          isActive: user.isActive
        }
      });
    } catch (error) {
      logger.error("[AUTH] Erro no login:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Login do professor
  app.post("/api/auth/professor-login", validateRequest(professorLoginSchema), async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Buscar professor pelo email
      const professors = await storage.getAcademicProfessors();
      const professor = professors.find((p) => p.email === email);
      
      if (!professor) {
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }

      // Para professores, vamos usar uma senha padrão por enquanto
      // TODO: Implementar sistema de senhas para professores
      if (password !== 'professor123') {
        return res.status(401).json({ message: "Email ou senha inválidos" });
      }

      // Gerar token
      const token = generateToken(professor.id.toString(), 'professor');
      
      res.json({ 
        token,
        professor: {
          id: professor.id,
          name: professor.nome,
          email: professor.email,
          role: 'professor',
          department: 'Acadêmico'
        }
      });
    } catch (error) {
      logger.error("Erro no login do professor:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Login do aluno
  app.post("/api/auth/student-login", validateRequest(studentLoginSchema), async (req, res) => {
    try {
      const { email, cpf } = req.body;
      
      // Buscar estudante pelo email e CPF
      const students = await storage.getAcademicStudents();
      const student = students.find((s) => s.email === email && s.cpf === cpf);
      
      if (!student) {
        return res.status(401).json({ message: "Email ou CPF inválidos" });
      }

      // Gerar token
      const token = generateToken(student.id.toString(), 'student');
      
      res.json({ 
        token,
        student: {
          id: student.id,
          name: student.nome,
          email: student.email,
          cpf: student.cpf,
          role: 'student',
          matriculaAtiva: true
        }
      });
    } catch (error) {
      logger.error("Erro no login do aluno:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Registro de usuário
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, email, password, name, token: registrationToken } = req.body;

      if (!registrationToken) {
        return res.status(400).json({ message: "Token de registro é obrigatório" });
      }

      const regToken = await storage.getRegistrationToken(registrationToken);
      if (!regToken || new Date() > regToken.expiresAt || regToken.isUsed) {
        return res.status(400).json({ message: "Token inválido ou expirado" });
      }

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username já existe" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        name,
        role: 'user'
      });

      // Marcar token de registro como usado
      await storage.markTokenAsUsed(registrationToken, user.id);

      const token = generateToken(user.id.toString(), user.role);
      
      res.status(201).json({ 
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      logger.error("Erro no registro:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar token de registro
  app.post("/api/admin/registration-token", authenticateToken, rbac("admin"), async (req: any, res) => {
    try {

      const { expiresInDays = 7 } = req.body;
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      const regToken = await storage.createRegistrationToken({
        token,
        createdBy: req.user.id,
        expiresAt
      });

      res.status(201).json({ token: regToken.token, expiresAt: regToken.expiresAt });
    } catch (error) {
      logger.error("Erro ao criar token:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== MÉTRICAS DO DASHBOARD =====
  
  // Endpoint para métricas do dashboard com dados reais
  app.get("/api/dashboard/metrics", authenticateToken, async (req: any, res) => {
    try {
      // Buscar dados reais do sistema
      const conversations = await storage.getConversations();
      const users = await storage.getAllUsers();
      const certificationsResult = await storage.getCertifications();
      const certifications = certificationsResult.data || [];
      
      // Calcular total de atendimentos
      const totalAttendances = conversations.length;
      
      // Calcular atendentes ativos (usuários com atendimentos)
      const activeAgents = users.filter(user => 
        user.isActive && 
        conversations.some(conv => 
          conv.atendente === user.username
        )
      ).length;
      
      // Calcular certificações pendentes
      const pendingCertifications = certifications.filter((cert: any) => 
        cert.status === 'pendente' || cert.status === 'em andamento'
      ).length;
      
      // Calcular taxa de conclusão
      const completedConversations = conversations.filter(conv => conv.status === 'closed').length;
      const completionRate = totalAttendances > 0 ? 
        Math.round((completedConversations / totalAttendances) * 100) : 0;
      
      // Calcular comparações com período anterior (simulado)
      const totalTrend = totalAttendances > 50 ? "+12%" : "+5%";
      const agentsTrend = activeAgents > 5 ? "+2" : "+1";
      const certificationsTrend = pendingCertifications > 100 ? "-15" : "-8";
      const rateTrend = completionRate > 80 ? "+3%" : "+1%";
      
      res.json({
        totalAttendances,
        activeAgents,
        pendingCertifications,
        completionRate: `${completionRate}%`,
        trends: {
          totalTrend,
          agentsTrend,
          certificationsTrend,
          rateTrend
        }
      });
      
    } catch (error) {
      logger.error("Erro ao buscar métricas do dashboard:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Endpoint para dados dos gráficos do dashboard
  app.get("/api/dashboard/charts", authenticateToken, async (req: any, res) => {
    try {
      // Buscar dados dos últimos 7 dias para o gráfico de atendimentos
      const now = new Date();
      const todayBrazil = new Date(now.toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
      const conversations = await storage.getConversations();
      const users = await storage.getAllUsers();
      const activeUsers = users.filter(user => user.isActive && user.username !== 'admin');
      
      // Dados para gráfico de atendimentos por dia (últimos 7 dias)
      const attendancesByDay = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(todayBrazil);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        
        const dayConversations = conversations.filter(conv => {
          const convDate = conv.createdAt ? new Date(conv.createdAt) : new Date();
          return convDate >= date && convDate < nextDate;
        });
        
        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const dayName = dayNames[date.getDay()];
        
        attendancesByDay.push({
          day: dayName,
          attendances: dayConversations.length,
          date: date.toISOString().split('T')[0]
        });
      }
      
      // Dados para gráfico de produtividade por atendente (top 5)
      const userProductivity = activeUsers.map(user => {
        const userConversations = conversations.filter(conv => 
          conv.atendente === user.username ||
          (conv.atendente && conv.atendente.toLowerCase().includes(user.username.toLowerCase()))
        );
        
        return {
          agent: user.username.split(' ')[0], // Primeiro nome apenas
          attendances: userConversations.length,
          fullName: user.username
        };
      })
      .filter(user => user.attendances > 0)
      .sort((a, b) => b.attendances - a.attendances)
      .slice(0, 5); // Top 5 apenas
      
      res.json({
        attendancesByDay,
        productivityByAgent: userProductivity
      });
      
    } catch (error) {
      logger.error("Erro ao buscar dados dos gráficos do dashboard:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== GESTÃO DE TOKENS DE REGISTRO =====
  
  // Buscar todos os tokens de registro
  app.get("/api/registration-tokens", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const tokens = await storage.getAllRegistrationTokens();
      res.json(tokens);
    } catch (error) {
      logger.error("Erro ao buscar tokens:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== GESTÃO DE USUÁRIOS =====
  
  // Buscar todos os usuários
  app.get("/api/users", authenticateToken, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      const safeUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt
      }));
      
      res.json(safeUsers);
    } catch (error) {
      logger.error("Erro ao buscar usuários:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== CURSOS PRÉ-CADASTRADOS =====
  
  // Endpoint para buscar cursos pré-cadastrados por categoria
  app.get("/api/cursos-pre-cadastrados", authenticateToken, async (req: any, res) => {
    try {
      const { categoria } = req.query;
      
      if (!categoria) {
        return res.status(400).json({ 
          success: false, 
          message: "Categoria é obrigatória" 
        });
      }
      
      // Buscar cursos pela categoria
      const courses = await storage.getAcademicCourses({
        categoria: categoria,
        status: 'ativo'
      });
      
      // Transformar os dados para o formato esperado pelo frontend
      const cursosFormatados = courses.map(course => ({
        id: course.id,
        nome: course.nome,
        categoria: course.categoria,
        modalidade: course.modalidade,
        cargaHoraria: course.cargaHoraria,
        duracao: course.duracao,
        preco: course.preco,
        areaConhecimento: course.areaConhecimento
      }));
      
      res.json({
        success: true,
        data: cursosFormatados,
        total: cursosFormatados.length
      });
      
    } catch (error) {
      logger.error("Erro ao buscar cursos pré-cadastrados:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  });

  // Endpoint para criar novos cursos pré-cadastrados
  app.post("/api/cursos-pre-cadastrados", authenticateToken, async (req: any, res) => {
    try {
      const { nome, categoria, modalidade, cargaHoraria, area } = req.body;
      
      if (!nome || !categoria) {
        return res.status(400).json({ 
          success: false, 
          message: "Nome e categoria são obrigatórios" 
        });
      }
      
      // Criar novo curso
      const novoCurso = await storage.createAcademicCourse({
        nome,
        categoria,
        modalidade: modalidade || 'presencial',
        cargaHoraria: Number.isFinite(+cargaHoraria) ? parseInt(cargaHoraria) : 0,
        areaConhecimento: area || 'Geral',
        status: 'ativo',
        duracao: '12 meses',
        preco: 0
      });
      
      res.json({
        success: true,
        data: novoCurso,
        message: "Curso criado com sucesso"
      });
      
    } catch (error) {
      logger.error("Erro ao criar curso pré-cadastrado:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erro interno do servidor" 
      });
    }
  });

  // ===== CERTIFICAÇÕES =====
  
  // Schema específico para certificações com proteção contra parseInt
  const certificacoesQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(50),
    categoria: z.string().optional(),
    status: z.string().optional(),
    search: z.string().optional()
  });
  
  // Endpoint para buscar certificações
  app.get("/api/certificacoes", authenticateToken, async (req: any, res) => {
    try {
      const parse = certificacoesQuerySchema.safeParse(req.query);
      if (!parse.success) {
        return res.status(400).json({ 
          message: "Parâmetros inválidos", 
          issues: parse.error.issues 
        });
      }
      
      const { page, limit, categoria, status, ...rest } = parse.data;
      const filters = {
        categoria: categoria !== 'todos' ? categoria : undefined,
        status: status !== 'todos' ? status : undefined,
        page,
        limit,
        ...rest
      };
      
      const result = await storage.getCertifications(filters);
      res.json(result);
    } catch (error) {
      logger.error("Erro ao buscar certificações:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Endpoint para criar certificação
  app.post("/api/certificacoes", authenticateToken, validateRequest(insertCertificationSchema), async (req: any, res) => {
    try {
      const certification = await storage.createCertification(req.body);
      res.status(201).json(certification);
    } catch (error) {
      logger.error("Erro ao criar certificação:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Endpoint para atualizar certificação
  app.put("/api/certificacoes/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = validateIdParam(req);
      const result = await storage.updateCertificacaoFadyc(id, req.body);
      
      if (!result) {
        return res.status(404).json({ message: "Item não encontrado" });
      }
      
      res.json(result);
    } catch (error) {
      return handleValidationError(error, res, "Erro na operação:");
      logger.error("Erro ao atualizar certificação:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Endpoint para deletar certificação
  app.delete("/api/certificacoes/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = validateIdParam(req);
      const result = await storage.updateCertificacaoFadyc(id, req.body);
      
      if (!result) {
        return res.status(404).json({ message: "Item não encontrado" });
      }
      
      res.json(result);
    } catch (error) {
      return handleValidationError(error, res, "Erro na operação:");
      logger.error("Erro ao deletar certificação:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ATENDIMENTOS =====
  
  // Endpoint para buscar dados de filtros de atendimento
  app.get("/api/atendimentos/filters-data", authenticateToken, async (req: any, res) => {
    try {
      // Buscar usuários ativos do sistema interno
      const activeUsers = await storage.getAllUsers();
      const atendentesInternos = activeUsers
        .filter(user => user.isActive && user.username !== 'admin')
        .map(user => user.username)
        .sort();
      
      // Definir equipes do sistema
      const equipesInternas = [
        'Comercial',
        'Cobrança', 
        'Tutoria',
        'Secretaria Pós',
        'Secretaria Segunda',
        'Documentação',
        'Análise Certificação',
        'Suporte',
        'Financeiro',
        'Não atribuído'
      ];
      
      // Buscar status reais das conversas do banco
      const conversations = await storage.getConversations();
      const statusSet = new Set(conversations.map(conv => {
        return conv.status === 'active' ? 'Em andamento' : 
               conv.status === 'closed' ? 'Concluído' : 'Pendente';
      }));
      const uniqueStatuses = Array.from(statusSet);
      
      // Garantir que todos os status possíveis estejam disponíveis
      const allPossibleStatuses = ['Em andamento', 'Concluído', 'Pendente'];
      const statusFromDb = uniqueStatuses.length > 0 ? uniqueStatuses : allPossibleStatuses;
      
      res.json({
        atendentes: [...atendentesInternos, 'Não atribuído'].sort(),
        equipes: equipesInternas.sort(),
        status: statusFromDb
      });
    } catch (error) {
      logger.error("Erro ao buscar dados de filtros:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Endpoint para buscar atendimentos do sistema
  app.get("/api/atendimentos", authenticateToken, async (req: any, res) => {
    try {
      const parse = atendimentosQuery.safeParse(req.query);
      if (!parse.success) {
        return res.status(400).json({ 
          message: "Parâmetros inválidos", 
          issues: parse.error.issues 
        });
      }
      
      const { page, limit, status, attendantId, dataInicio, dataFim, search } = parse.data;
      
      // Buscar conversas do banco
      let conversations = await storage.getConversations();
      
      // Se não há conversas do sistema, retornar dados vazios
      if (conversations.length === 0) {
        return res.json({
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false
          }
        });
      }
      
      // Formatar dados para exibição
      const atendimentos = conversations.map(conv => {
        // Calcular duração
        let duracao = 'N/A';
        if (conv.createdAt && conv.updatedAt) {
          const inicio = new Date(conv.createdAt);
          const fim = new Date(conv.updatedAt);
          const diffMinutos = Math.floor((fim.getTime() - inicio.getTime()) / (1000 * 60));
          duracao = `${diffMinutos} min`;
        }
        
        // Formatar data e hora
        const createdDate = conv.createdAt ? new Date(conv.createdAt) : new Date();
        const dataEntrada = createdDate.toLocaleDateString('pt-BR');
        const horaEntrada = conv.hora || createdDate.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });

        return {
          id: conv.id,
          lead: conv.customerName || conv.customerPhone || `Cliente ${conv.id}`,
          data: dataEntrada,
          hora: horaEntrada,
          atendente: conv.atendente || 'Não atribuído',
          equipe: conv.equipe || 'Comercial',
          duracao: conv.duracao || duracao,
          status: conv.status === 'active' ? 'Em andamento' : 
                 conv.status === 'closed' ? 'Concluído' : 'Pendente',
          resultado: conv.resultado || null,
          assunto: conv.assunto || null,
          observacoes: conv.observacoes || null
        };
      });
      
      // Aplicar filtros adicionais
      let filteredAtendimentos = atendimentos;
      
      // Filtro por status
      if (status && status !== 'Todos') {
        filteredAtendimentos = filteredAtendimentos.filter(atendimento => 
          atendimento.status === status
        );
      }
      
      // Filtro por atendente (usando attendantId do schema)
      if (attendantId) {
        // Buscar nome do atendente pelo ID
        const users = await storage.getAllUsers();
        const attendantUser = users.find(u => u.id === attendantId);
        if (attendantUser) {
          filteredAtendimentos = filteredAtendimentos.filter(atendimento => 
            atendimento.atendente === attendantUser.name
          );
        }
      }
      
      // Filtro por busca (nome/telefone/email)
      if (search) {
        filteredAtendimentos = filteredAtendimentos.filter(atendimento => 
          atendimento.lead.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      // Filtros por data
      if (dataInicio) {
        const inicio = new Date(dataInicio);
        filteredAtendimentos = filteredAtendimentos.filter(atendimento => {
          const [dia, mes, ano] = atendimento.data.split('/');
          const dataAtendimento = new Date(`${ano}-${mes}-${dia}`);
          return dataAtendimento >= inicio;
        });
      }
      
      if (dataFim) {
        const fim = new Date(dataFim);
        filteredAtendimentos = filteredAtendimentos.filter(atendimento => {
          const [dia, mes, ano] = atendimento.data.split('/');
          const dataAtendimento = new Date(`${ano}-${mes}-${dia}`);
          return dataAtendimento <= fim;
        });
      }
      
      // Ordenar por data de criação (mais recentes primeiro) - melhor ordenação semântica
      filteredAtendimentos.sort((a, b) => {
        const ad = a.data?.split("/").reverse().join("-") || "";
        const bd = b.data?.split("/").reverse().join("-") || "";
        return bd.localeCompare(ad); // mais recentes primeiro
      });
      
      // Calcular paginação
      const total = filteredAtendimentos.length;
      const totalPages = Math.ceil(total / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedAtendimentos = filteredAtendimentos.slice(startIndex, endIndex);
      
      // Resposta com informações de paginação
      res.json({
        data: paginatedAtendimentos,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      });
    } catch (error) {
      logger.error("Erro ao buscar atendimentos:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Middleware de autenticação para Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace("Bearer ", "");
    if (!token) {
      // permitir por enquanto para não quebrar, mas logar
      logger.warn("[WS] Conexão sem token", { id: socket.id });
      return next();
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!);
      (socket as any).user = payload;
      next();
    } catch {
      logger.warn("[WS] Token inválido", { id: socket.id });
      next(new Error("Unauthorized"));
    }
  });

  // Socket.io para notificações em tempo real
  io.on('connection', (socket) => {
    logger.info("WS conectado", { id: socket.id, user: (socket as any).user?.sub });
    
    // Envio de mensagens entre usuários
    socket.on('send_message', (data) => {
      socket.broadcast.emit('receive_message', data);
    });

    // Notificações de metas alcançadas
    socket.on('goal_achieved', (data) => {
      io.emit(data.teamId ? 'team_goal_achieved' : 'individual_goal_achieved', data);
    });

    socket.on('disconnect', () => {
      logger.info("WS desconectado", { id: socket.id });
    });
  });



  // ===== SETUP DO FRONTEND =====
  
  // Configuração específica para desenvolvimento vs produção
  if (process.env.NODE_ENV === 'production') {
    logger.info('Configurando para produção - servindo arquivos estáticos');
    serveStatic(app);
    
    // Fallback para SPA - SEMPRE servir index.html para rotas não-API
    app.get('*', (req, res, next) => {
      // Verificar se é uma rota de API ou recurso estático
      if (req.path.startsWith('/api') || 
          req.path.startsWith('/health') || 
          req.path === '/healthz' || 
          req.path === '/status' || 
          req.path === '/ping' ||
          req.path === '/test' ||
          req.path.includes('.')) { // arquivos com extensão (.js, .css, .ico, etc)
        return next();
      }
      
      // Para todas as outras rotas, servir a aplicação React
      try {
        res.sendFile(path.resolve('dist/public/index.html'));
      } catch (error) {
        logger.error('Erro ao servir index.html:', error);
        res.status(500).send('Erro interno do servidor');
      }
    });
  } else {
    logger.info('Configurando para desenvolvimento - usando Vite');
    try {
      await setupVite(app, server);
    } catch (error) {
      logger.error('Erro ao configurar Vite:', error);
      // Fallback: servir arquivos estáticos se Vite falhar
      logger.info('Usando fallback para arquivos estáticos');
      serveStatic(app);
      
      // Fallback para desenvolvimento também
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || 
            req.path.startsWith('/health') || 
            req.path === '/healthz' || 
            req.path === '/status' || 
            req.path === '/ping' ||
            req.path === '/test' ||
            req.path.includes('.')) {
          return next();
        }
        
        try {
          res.sendFile(path.resolve('client/index.html'));
        } catch (error) {
          logger.error('Erro ao servir index.html em desenvolvimento:', error);
          res.status(500).send('Erro interno do servidor');
        }
      });
    }
  }
  
  // Endpoint de teste que funciona em qualquer ambiente
  app.get('/test', (req, res) => {
    res.json({ 
      message: 'Servidor funcionando!', 
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString() 
    });
  });

  // ===== HANDLERS DE ERRO =====
  
  // Handler para rotas não encontradas
  app.use(notFoundHandler);

  // Handler global de erros
  app.use(globalErrorHandler);

  return server;
}