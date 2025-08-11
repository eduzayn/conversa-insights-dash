import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketServer } from "socket.io";
import { setupVite, serveStatic } from "./vite";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { logger } from "./utils/logger";
import { sql, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { users, conversations, attendanceMessages, internalNotes } from "@shared/schema"; 
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
  insertEnvioFamarSchema
} from "@shared/schema";
import { z } from "zod";

import { UnifiedAsaasService } from "./services/unified-asaas-service";
import asaasRoutes from "./routes/asaas-routes";
import { v4 as uuidv4 } from 'uuid';
import { PDFService } from './pdfService';

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
  cpf: z.string().min(11, "CPF é obrigatório").max(14, "CPF inválido"),
});

// Schema para registro
const registerSchema = insertUserSchema.extend({
  token: z.string().min(1, "Token de registro é obrigatório"),
  multiCompanyAccess: z.any().optional(),
}).partial({
  companyAccount: true,
  department: true,
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const io = new SocketServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // ===== MIDDLEWARES GLOBAIS =====
  
  // Rate limiting flexível - mais permissivo para usuários autenticados
  app.use('/api', rateLimiter(1000, 15 * 60 * 1000)); // 1000 reqs por 15min por IP
  
  // Health check endpoint (não autenticado)
  app.get('/api/health', healthCheck);
  
  // ===== AUTENTICAÇÃO E USUÁRIOS =====
  
  // Login robusto com múltiplas validações
  app.post("/api/auth/login", asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Conta desativada" });
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          companyAccount: user.companyAccount,
          department: user.department
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      logger.error("Erro no login:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  }));

  // Endpoint para renovar token JWT
  app.post("/api/auth/refresh", asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        message: 'Token de acesso requerido',
        code: 'NO_TOKEN',
        timestamp: new Date().toISOString()
      });
    }

    try {
      // Verificar se o token é válido (mesmo que próximo do vencimento)
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const user = await storage.getUser(decoded.userId);
      
      if (!user || !user.isActive) {
        return res.status(401).json({ 
          message: 'Usuário inválido ou inativo',
          code: 'INVALID_USER',
          timestamp: new Date().toISOString()
        });
      }

      // Gerar novo token com tempo estendido
      const newToken = generateToken(user.id);
      
      logger.info(`[REFRESH] Token renovado com sucesso - User: ${user.username} (${user.id})`);
      
      res.json({
        token: newToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          role: user.role,
          companyAccount: user.companyAccount,
          department: user.department
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error: any) {
      logger.error(`[REFRESH] Erro ao renovar token:`, error);
      return res.status(401).json({ 
        message: 'Token inválido para renovação',
        code: 'REFRESH_FAILED',
        timestamp: new Date().toISOString()
      });
    }
  }));

  // Validar token e retornar dados do usuário
  app.get("/api/auth/me", authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        companyAccount: req.user.companyAccount,
        department: req.user.department
      },
      timestamp: new Date().toISOString()
    });
  }));

  // Registro
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, email, name, role, token, companyAccount, department, multiCompanyAccess } = registerSchema.parse(req.body);
      
      // Verificar token de registro
      const regToken = await storage.getRegistrationToken(token);
      if (!regToken || regToken.isUsed || regToken.expiresAt < new Date()) {
        return res.status(400).json({ message: "Token de registro inválido ou expirado" });
      }

      // Verificar se username/email já existem
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username já está em uso" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email já está em uso" });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Criar usuário
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        email,
        name,
        role: regToken.role, // Usar o role do token
        companyAccount,
        department,
        multiCompanyAccess
      });

      // Marcar token como usado
      await storage.markTokenAsUsed(token, newUser.id);

      // Gerar JWT
      const jwtToken = jwt.sign(
        { userId: newUser.id, username: newUser.username, role: newUser.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        token: jwtToken,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          companyAccount: newUser.companyAccount,
          department: newUser.department
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      logger.error("Erro no registro:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Verificar token (middleware de autenticação)
  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        companyAccount: req.user.companyAccount,
        department: req.user.department,
        cpf: req.user.cpf,
        telefone: req.user.telefone,
        dataNascimento: req.user.dataNascimento,
        matriculaAtiva: req.user.matriculaAtiva
      }
    });
  });

  // Login para Portal do Aluno (usando e-mail e CPF como senha)
  app.post("/api/auth/student-login", async (req, res) => {
    try {
      const { email, cpf } = studentLoginSchema.parse(req.body);
      
      // Limpar CPF removendo formatação
      const cleanCpf = cpf.replace(/\D/g, '');
      console.log("🔍 Tentativa de login:", { email, cpf: cleanCpf });
      
      // Buscar aluno por e-mail
      const student = await storage.getUserByEmail(email);
      console.log("👤 Aluno encontrado:", student ? { id: student.id, name: student.name, role: student.role, isActive: student.isActive, matriculaAtiva: student.matriculaAtiva, cpf: student.cpf } : "não encontrado");
      
      if (!student || student.role !== 'aluno') {
        console.log("❌ Falha: aluno não encontrado ou não é aluno");
        return res.status(401).json({ message: "Credenciais inválidas ou aluno não encontrado" });
      }

      // Validar CPF como senha (comparar CPF limpo)
      const studentCpf = student.cpf?.replace(/\D/g, '') || '';
      console.log("🔑 Comparação de CPFs:", { enviado: cleanCpf, banco: studentCpf });
      
      if (studentCpf !== cleanCpf) {
        console.log("❌ Falha: CPFs não coincidem");
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      if (!student.isActive || !student.matriculaAtiva) {
        console.log("❌ Falha: conta inativa ou matrícula inativa");
        return res.status(401).json({ message: "Matrícula inativa ou conta desativada" });
      }

      const token = jwt.sign(
        { userId: student.id, email: student.email, role: student.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log("✅ Login bem-sucedido para:", student.name);

      res.json({
        token,
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
          cpf: student.cpf,
          telefone: student.telefone,
          role: student.role,
          matriculaAtiva: student.matriculaAtiva,
          documentacaoStatus: student.documentacaoStatus
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      logger.error("Erro no login do aluno:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Gerenciar tokens de registro (apenas admins)
  app.post("/api/admin/tokens", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado" });
      }

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
          const convDate = new Date(conv.createdAt);
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

  // Criar novo token de registro
  app.post("/api/registration-tokens", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const { role } = req.body;
      
      if (!role || !['admin', 'agent'].includes(role)) {
        return res.status(400).json({ message: "Role deve ser 'admin' ou 'agent'" });
      }

      // Gerar token único
      const token = uuidv4();
      
      // Token expira em 7 dias
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const newToken = await storage.createRegistrationToken({
        token,
        role,
        createdBy: req.user.id,
        expiresAt,
        isUsed: false
      });

      res.status(201).json(newToken);
    } catch (error) {
      logger.error("Erro ao criar token:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Desativar usuário (alterar isActive para false)
  app.patch("/api/users/:id/deactivate", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuário inválido" });
      }

      // Não permitir desativar o próprio usuário admin
      if (userId === req.user.id) {
        return res.status(400).json({ message: "Não é possível desativar seu próprio usuário" });
      }

      const updatedUser = await storage.updateUser(userId, { isActive: false });
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json({ message: "Usuário desativado com sucesso", user: updatedUser });
    } catch (error) {
      logger.error("Erro ao desativar usuário:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Reativar usuário (alterar isActive para true)
  app.patch("/api/users/:id/activate", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuário inválido" });
      }

      const updatedUser = await storage.updateUser(userId, { isActive: true });
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json({ message: "Usuário reativado com sucesso", user: updatedUser });
    } catch (error) {
      logger.error("Erro ao reativar usuário:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== USUÁRIOS =====
  
  // Buscar todos os usuários (apenas admin e agent)
  app.get("/api/users", authenticateToken, async (req: any, res) => {
    try {
      const result = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role
        })
        .from(users)
        .where(inArray(users.role, ['admin', 'agent']))
        .orderBy(users.username);
      
      res.json(result);
    } catch (error) {
      logger.error("Erro ao buscar usuários:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ROTAS DO PORTAL DO ALUNO =====

  // Dashboard do aluno - matrícula e progresso
  app.get("/api/student/enrollments", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'aluno') {
        return res.status(403).json({ message: "Acesso negado - apenas alunos" });
      }

      const enrollments = await storage.getStudentEnrollments(req.user.id);
      res.json(enrollments);
    } catch (error) {
      logger.error("Erro ao buscar matrículas:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Avaliações do aluno
  app.get("/api/student/enrollments/:enrollmentId/evaluations", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'aluno') {
        return res.status(403).json({ message: "Acesso negado - apenas alunos" });
      }

      const { enrollmentId } = req.params;
      const evaluations = await storage.getStudentEvaluations(parseInt(enrollmentId));
      res.json(evaluations);
    } catch (error) {
      logger.error("Erro ao buscar avaliações:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Documentos do aluno
  app.get("/api/student/documents", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'aluno') {
        return res.status(403).json({ message: "Acesso negado - apenas alunos" });
      }

      const documents = await storage.getStudentDocuments(req.user.id);
      res.json(documents);
    } catch (error) {
      logger.error("Erro ao buscar documentos:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/student/documents", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'aluno') {
        return res.status(403).json({ message: "Acesso negado - apenas alunos" });
      }

      const { tipoDocumento, nomeArquivo, urlArquivo } = req.body;
      const document = await storage.createStudentDocument({
        studentId: req.user.id,
        tipoDocumento,
        nomeArquivo,
        urlArquivo
      });

      res.status(201).json(document);
    } catch (error) {
      logger.error("Erro ao enviar documento:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Pagamentos do aluno
  app.get("/api/student/payments", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'aluno') {
        return res.status(403).json({ message: "Acesso negado - apenas alunos" });
      }

      const payments = await storage.getStudentPayments(req.user.id);
      res.json(payments);
    } catch (error) {
      logger.error("Erro ao buscar pagamentos:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Certificados do aluno
  app.get("/api/student/certificates", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'aluno') {
        return res.status(403).json({ message: "Acesso negado - apenas alunos" });
      }

      const certificates = await storage.getStudentCertificates(req.user.id);
      res.json(certificates);
    } catch (error) {
      logger.error("Erro ao buscar certificados:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Solicitar certificado
  app.post("/api/student/certificates", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'aluno') {
        return res.status(403).json({ message: "Acesso negado - apenas alunos" });
      }

      const { enrollmentId, tipoCertificado, titulo } = req.body;
      const certificate = await storage.createStudentCertificate({
        studentId: req.user.id,
        enrollmentId: parseInt(enrollmentId),
        tipoCertificado,
        titulo,
        codigoVerificacao: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      });

      res.status(201).json(certificate);
    } catch (error) {
      logger.error("Erro ao solicitar certificado:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Carteirinha do aluno
  app.get("/api/student/card", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'aluno') {
        return res.status(403).json({ message: "Acesso negado - apenas alunos" });
      }

      const card = await storage.getStudentCard(req.user.id);
      res.json(card);
    } catch (error) {
      logger.error("Erro ao buscar carteirinha:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Gerar carteirinha (primeira vez)
  app.post("/api/student/card", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'aluno') {
        return res.status(403).json({ message: "Acesso negado - apenas alunos" });
      }

      // Verificar se já existe carteirinha
      const existingCard = await storage.getStudentCard(req.user.id);
      if (existingCard) {
        return res.status(400).json({ message: "Carteirinha já existe" });
      }

      const numeroCarteirinha = `EST${new Date().getFullYear()}${req.user.id.toString().padStart(6, '0')}`;
      const tokenValidacao = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const qrCodeData = JSON.stringify({
        studentId: req.user.id,
        numeroCarteirinha,
        tokenValidacao,
        validoAte: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 ano
      });

      const card = await storage.createStudentCard({
        studentId: req.user.id,
        numeroCarteirinha,
        tokenValidacao,
        qrCodeData,
        validoAte: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        cursoAtual: req.body.cursoAtual || null
      });

      res.status(201).json(card);
    } catch (error) {
      logger.error("Erro ao gerar carteirinha:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Validar carteirinha (endpoint público)
  app.get("/api/public/validate-card/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const card = await storage.validateStudentCard(token);
      
      if (!card) {
        return res.status(404).json({ message: "Carteirinha não encontrada ou inválida" });
      }

      if (new Date() > card.validoAte) {
        return res.status(400).json({ message: "Carteirinha expirada" });
      }

      if (card.status !== 'ativa') {
        return res.status(400).json({ message: "Carteirinha inativa" });
      }

      res.json({
        valid: true,
        student: {
          numeroCarteirinha: card.numeroCarteirinha,
          cursoAtual: card.cursoAtual,
          validoAte: card.validoAte
        }
      });
    } catch (error) {
      logger.error("Erro ao validar carteirinha:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ROTAS ESPECÍFICAS DO PORTAL DO ALUNO =====
  
  // Cursos do aluno  
  app.get("/api/portal/aluno/cursos", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'aluno') {
        return res.status(403).json({ message: "Acesso negado - apenas alunos" });
      }

      const enrollments = await storage.getStudentEnrollments(req.user.id);
      res.json(enrollments);
    } catch (error) {
      logger.error("Erro ao buscar cursos:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar matrícula
  app.post("/api/portal/aluno/matricula", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'aluno') {
        return res.status(403).json({ message: "Acesso negado - apenas alunos" });
      }

      const { courseId, dataMatricula, status } = req.body;

      // Validar dados obrigatórios
      if (!courseId) {
        return res.status(400).json({ message: "ID do curso é obrigatório" });
      }

      // Verificar se o curso existe
      const course = await storage.getPreRegisteredCourseById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Curso não encontrado" });
      }

      // Verificar se o aluno já está matriculado neste curso
      const existingEnrollments = await storage.getStudentEnrollments(req.user.id);
      const alreadyEnrolled = existingEnrollments.some(e => e.courseId === courseId);
      
      if (alreadyEnrolled) {
        return res.status(400).json({ message: "Aluno já está matriculado neste curso" });
      }

      // Criar matrícula
      const enrollmentData = {
        studentId: req.user.id,
        courseId: courseId,
        dataMatricula: dataMatricula ? new Date(dataMatricula) : new Date(),
        status: status || 'ativa',
        progresso: 0,
        horasCompletadas: 0
      };

      const enrollment = await storage.createStudentEnrollment(enrollmentData);
      
      res.status(201).json({
        message: "Matrícula realizada com sucesso!",
        enrollment: enrollment
      });
    } catch (error) {
      logger.error("Erro ao criar matrícula:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Endpoint para testar matrícula com cobrança automática (admin)
  app.post("/api/admin/test-matricula", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const { studentId, courseId } = req.body;

      if (!studentId || !courseId) {
        return res.status(400).json({ message: "studentId e courseId são obrigatórios" });
      }

      // Verificar se o aluno existe
      const student = await storage.getUser(studentId);
      if (!student) {
        return res.status(404).json({ message: "Aluno não encontrado" });
      }

      // Verificar se o curso existe
      const course = await storage.getPreRegisteredCourseById(courseId);
      if (!course) {
        return res.status(404).json({ message: "Curso não encontrado" });
      }

      // Criar matrícula de teste
      const enrollmentData = {
        studentId: studentId,
        courseId: courseId,
        dataMatricula: new Date(),
        status: 'ativa',
        progresso: 0,
        horasCompletadas: 0
      };

      const enrollment = await storage.createStudentEnrollment(enrollmentData);
      
      res.status(201).json({
        message: "Matrícula de teste criada com sucesso!",
        enrollment: enrollment,
        courseInfo: {
          nome: course.nome,
          modalidade: course.modalidade
        }
      });
    } catch (error) {
      logger.error("Erro ao testar matrícula:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Endpoint para testar webhook manualmente
  app.post("/api/admin/test-webhook", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const { event, paymentId, value } = req.body;
      
      if (!event || !paymentId) {
        return res.status(400).json({ message: "event e paymentId são obrigatórios" });
      }

      // Criar payload simulado do webhook
      const mockPayload = {
        event: event,
        payment: {
          id: paymentId,
          value: value || 100,
          paymentDate: new Date().toISOString(),
          invoiceUrl: `https://sistema.local/invoice/${paymentId}`
        }
      };

      res.status(200).json({
        success: true,
        message: "Sistema de webhook foi removido",
        mockPayload
      });
    } catch (error) {
      logger.error("Erro ao testar webhook:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Disciplinas do aluno com conteúdos integrados do Portal do Professor
  app.get("/api/portal/aluno/disciplinas", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'aluno') {
        return res.status(403).json({ message: "Acesso negado - apenas alunos" });
      }

      // Buscar matrículas do aluno
      const enrollments = await storage.getStudentEnrollments(req.user.id);
      
      // Para cada matrícula, buscar disciplinas e seus conteúdos
      const disciplinasCompletas = [];
      
      for (const enrollment of enrollments) {
        // Mock: mapear curso para disciplinas (integração real dependeria da estrutura de cursos)
        const disciplinas = await storage.getAllSubjects();
        
        for (const disciplina of disciplinas.slice(0, 2)) { // Limitar para teste
          const conteudos = await storage.getSubjectContents(disciplina.id);
          const avaliacoes = await storage.getProfessorEvaluations(disciplina.id);
          
          disciplinasCompletas.push({
            id: disciplina.id,
            nome: disciplina.nome,
            codigo: disciplina.codigo,
            descricao: disciplina.descricao,
            cargaHoraria: disciplina.cargaHoraria,
            area: disciplina.area,
            professorNome: "Prof. João Silva", // Mock - seria buscado da relação professor-disciplina
            progresso: Math.floor(Math.random() * 100), // Mock - seria calculado baseado no progresso real
            conteudos: conteudos.map(conteudo => ({
              ...conteudo,
              professorNome: "Prof. João Silva",
              visualizado: Math.random() > 0.5 // Mock - seria baseado no histórico do aluno
            })),
            avaliacoes: avaliacoes.map(avaliacao => ({
              ...avaliacao,
              status: avaliacao.dataFechamento && new Date(avaliacao.dataFechamento) > new Date() ? "disponivel" : "expirada",
              nota: Math.random() > 0.5 ? Math.floor(Math.random() * 10) + 1 : undefined,
              professorNome: "Prof. João Silva"
            }))
          });
        }
      }

      res.json(disciplinasCompletas);
    } catch (error) {
      logger.error("Erro ao buscar disciplinas:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Marcar conteúdo como visualizado
  app.post("/api/portal/aluno/conteudo/:id/visualizar", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'aluno') {
        return res.status(403).json({ message: "Acesso negado - apenas alunos" });
      }

      const contentId = parseInt(req.params.id);
      // TODO: Implementar lógica para marcar como visualizado
      // await storage.markContentAsViewed(req.user.id, contentId);
      
      res.json({ success: true, message: "Conteúdo marcado como visualizado" });
    } catch (error) {
      logger.error("Erro ao marcar conteúdo como visualizado:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Enviar notificação para alunos sobre novo conteúdo
  app.post("/api/notifications/new-content", authenticateToken, async (req: any, res) => {
    try {
      if (!['professor', 'conteudista', 'coordenador'].includes(req.user.role)) {
        return res.status(403).json({ message: "Acesso negado - apenas professores" });
      }

      const { subjectId, contentTitle, students } = req.body;
      
      // TODO: Implementar sistema de notificações real
      // Para cada aluno matriculado na disciplina, criar notificação
      const notifications = students.map((studentId: number) => ({
        studentId,
        type: "novo_conteudo",
        title: "Novo Conteúdo Disponível",
        message: `Novo conteúdo "${contentTitle}" foi adicionado`,
        metadata: { subjectId, contentTitle }
      }));

      console.log("Notificações criadas:", notifications);
      res.json({ success: true, notificationsCreated: notifications.length });
    } catch (error) {
      logger.error("Erro ao enviar notificações:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Avaliações do aluno
  app.get("/api/portal/aluno/avaliacoes", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'aluno') {
        return res.status(403).json({ message: "Acesso negado - apenas alunos" });
      }

      // Buscar avaliações de todas as matrículas do aluno
      const enrollments = await storage.getStudentEnrollments(req.user.id);
      const allEvaluations = [];
      
      for (const enrollment of enrollments) {
        const evaluations = await storage.getStudentEvaluations(enrollment.id);
        allEvaluations.push(...evaluations);
      }
      
      res.json(allEvaluations);
    } catch (error) {
      logger.error("Erro ao buscar avaliações:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Certificados do aluno
  app.get("/api/portal/aluno/certificados", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'aluno') {
        return res.status(403).json({ message: "Acesso negado - apenas alunos" });
      }

      const certificates = await storage.getStudentCertificates(req.user.id);
      res.json(certificates);
    } catch (error) {
      logger.error("Erro ao buscar certificados:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Pagamentos do aluno
  app.get("/api/portal/aluno/pagamentos", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'aluno') {
        return res.status(403).json({ message: "Acesso negado - apenas alunos" });
      }

      const payments = await storage.getStudentPayments(req.user.id);
      res.json(payments);
    } catch (error) {
      logger.error("Erro ao buscar pagamentos:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Documentos do aluno
  app.get("/api/portal/aluno/documentos", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'aluno') {
        return res.status(403).json({ message: "Acesso negado - apenas alunos" });
      }

      const documents = await storage.getStudentDocuments(req.user.id);
      res.json(documents);
    } catch (error) {
      logger.error("Erro ao buscar documentos:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Upload de documento
  app.post("/api/portal/aluno/documentos", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'aluno') {
        return res.status(403).json({ message: "Acesso negado - apenas alunos" });
      }

      // Para este exemplo, vamos simular o upload
      const { tipoDocumento } = req.body;
      const fileName = `documento_${Date.now()}.pdf`;
      
      const document = await storage.createStudentDocument({
        studentId: req.user.id,
        tipoDocumento,
        nomeArquivo: fileName,
        urlArquivo: `/uploads/documentos/${fileName}`,
        status: 'pendente',
        dataEnvio: new Date(),
        observacoes: 'Documento enviado para análise'
      });

      res.status(201).json(document);
    } catch (error) {
      logger.error("Erro ao fazer upload do documento:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Perfil do aluno
  app.get("/api/portal/aluno/perfil", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'aluno') {
        return res.status(403).json({ message: "Acesso negado - apenas alunos" });
      }

      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Buscar informações acadêmicas
      const enrollments = await storage.getStudentEnrollments(req.user.id);
      const currentEnrollment = enrollments.find(e => e.status === 'ativa');

      const profile = {
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: user.cpf,
        telefone: user.telefone,
        endereco: user.endereco,
        cidade: user.cidade,
        estado: user.estado,
        cep: user.cep,
        matriculaAtiva: enrollments.some(e => e.status === 'ativa'),
        dataMatricula: currentEnrollment?.dataMatricula,
        cursoAtual: currentEnrollment?.course?.nome,
        modalidadeAtual: currentEnrollment?.course?.modalidade,
        statusDocumentacao: 'aprovada', // Implementar lógica baseada nos documentos
        observacoes: user.observacoes
      };

      res.json(profile);
    } catch (error) {
      logger.error("Erro ao buscar perfil:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Atualizar perfil do aluno
  app.put("/api/portal/aluno/perfil", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'aluno') {
        return res.status(403).json({ message: "Acesso negado - apenas alunos" });
      }

      const updatedUser = await storage.updateUser(req.user.id, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.json(updatedUser);
    } catch (error) {
      logger.error("Erro ao atualizar perfil:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Carteirinha do aluno
  app.get("/api/portal/aluno/carteirinha", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'aluno') {
        return res.status(403).json({ message: "Acesso negado - apenas alunos" });
      }

      const card = await storage.getStudentCard(req.user.id);
      res.json(card);
    } catch (error) {
      logger.error("Erro ao buscar carteirinha:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Suporte - conversas do aluno
  app.get("/api/portal/aluno/suporte/conversas", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'aluno') {
        return res.status(403).json({ message: "Acesso negado - apenas alunos" });
      }

      // Para este exemplo, retornamos um array vazio
      // Em produção, implementar lógica de conversas de suporte
      res.json([]);
    } catch (error) {
      logger.error("Erro ao buscar conversas de suporte:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Suporte - mensagens da conversa
  app.get("/api/portal/aluno/suporte/mensagens/:conversationId", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'aluno') {
        return res.status(403).json({ message: "Acesso negado - apenas alunos" });
      }

      // Para este exemplo, retornamos um array vazio
      res.json([]);
    } catch (error) {
      logger.error("Erro ao buscar mensagens:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Teams
  app.get("/api/teams", authenticateToken, async (req: any, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      logger.error("Erro ao buscar teams:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/teams", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const { name, description, icon } = req.body;
      const team = await storage.createTeam({ name, description, icon });
      res.status(201).json(team);
    } catch (error) {
      logger.error("Erro ao criar team:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Leads
  app.get("/api/leads", authenticateToken, async (req: any, res) => {
    try {
      const { assignedTo, teamId, status } = req.query;
      const filters: any = {};
      
      if (assignedTo) filters.assignedTo = parseInt(assignedTo as string);
      if (teamId) filters.teamId = parseInt(teamId as string);
      if (status) filters.status = status as string;

      const leads = await storage.getLeads(filters);
      res.json(leads);
    } catch (error) {
      logger.error("Erro ao buscar leads:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/leads", authenticateToken, async (req: any, res) => {
    try {
      const leadData = req.body;
      const lead = await storage.createLead({
        ...leadData,
        assignedTo: leadData.assignedTo || req.user.id
      });
      res.status(201).json(lead);
    } catch (error) {
      logger.error("Erro ao criar lead:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Conversations
  app.get("/api/conversations", authenticateToken, async (req: any, res) => {
    try {
      const { attendantId, status } = req.query;
      const filters: any = {};
      
      if (attendantId) filters.attendantId = parseInt(attendantId as string);
      if (status) filters.status = status as string;

      const conversations = await storage.getConversations(filters);
      res.json(conversations);
    } catch (error) {
      logger.error("Erro ao buscar conversas:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/atendimentos/sync", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado. Apenas administradores podem sincronizar dados." });
      }
      
      // Sincronizar ambas as contas
      await Promise.all([
        botConversaService.syncConversations('SUPORTE'),
        botConversaService.syncConversations('COMERCIAL')
      ]);
      
      res.json({ 
        success: true, 
        message: "Conversas sincronizadas com sucesso",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error("Erro ao sincronizar conversas:", error);
      res.status(500).json({ 
        message: "Erro ao sincronizar conversas",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Atendimentos com paginação
  app.get("/api/atendimentos", authenticateToken, async (req: any, res) => {
    try {
      const { startDate, endDate, status, equipe, page = 1, limit = 20 } = req.query;
      const currentPage = parseInt(page);
      const pageSize = parseInt(limit);
      
      let allConversations = await storage.getConversations();
      
      let conversations = allConversations.filter(conv => {
        // Manter conversas que não têm nomes simulados específicos
        const isSimulated = (
          conv.customerName === 'Ana Costa' || 
          conv.customerName === 'João Santos' || 
          conv.customerName === 'Maria Silva'
        );
        return !isSimulated;
      });
      
      // Buscar informações dos teams
      const teams = await storage.getTeams();
      
      // Transformar conversas em formato de atendimentos
      const atendimentos = await Promise.all(conversations.map(async (conv) => {
        // Buscar mensagens da conversa para calcular duração
        const messages = await storage.getConversationMessages(conv.id, 100, 0);
        
        // Calcular duração baseada nas mensagens
        let duracao = 'Em andamento';
        if (messages.length > 0 && conv.status === 'closed') {
          const firstMessage = messages[messages.length - 1];
          const lastMessage = messages[0];
          const timeDiff = new Date(lastMessage.createdAt).getTime() - new Date(firstMessage.createdAt).getTime();
          const minutes = Math.floor(timeDiff / (1000 * 60));
          duracao = `${minutes}m`;
        }
        
        // Buscar informações do atendente
        let attendantName = 'Não atribuído';
        let equipe = 'Não atribuído';
        
          
          // Determinar equipe baseada no email do manager
            const emailToTeam = {
              // Conta COMERCIAL - Emails reais mapeados para departamentos
              'yasminvitorino.office@gmail.com': 'Comercial',
              'brenodantas28@gmail.com': 'Comercial', 
              'jhonatapimenteljgc38@gmail.com': 'Comercial',
              'amanda.silva@hotmail.com': 'Comercial',
              'tamires.kele@gmail.com': 'Secretaria Pós',
              'elaine.barros@gmail.com': 'Secretaria Pós',
              'brunaalvesreis89@gmail.com': 'Secretaria Segunda',
              'miguel.moura@gmail.com': 'Comercial',
              'camila.aparecida@gmail.com': 'Comercial',
              'julia.oliveira@gmail.com': 'Comercial',
              'carla.araujo@gmail.com': 'Comercial',
              'alana.matos@universidadebrasil.edu.br': 'Suporte',
              'kamilla.videla@gmail.com': 'Financeiro',
              'rhonda.pimentel@gmail.com': 'Cobrança',
              'erick.moreira@gmail.com': 'Suporte',
              'daniela.torres@gmail.com': 'Tutoria',
              'ronan.cleomenti@gmail.com': 'Documentação',
              
              // Conta SUPORTE - Emails reais mapeados para departamentos
              'lailsonmartins22@gmail.com': 'Comercial',
              'leticiamalfarmacia@gmail.com': 'Cobrança',
              'joilsonferreira@gmail.com': 'Suporte',
              'miguelmauraferreira@gmail.com': 'Tutoria',
              'leticiamalfarmacia24@gmail.com': 'Tutoria',
              'erikabrasilsouza@gmail.com': 'Secretaria Pós',
              'erikabrasilsouza68@gmail.com': 'Secretaria Pós',
              'daniselenitorres@gmail.com': 'Secretaria Segunda',
              'cristinarafael@gmail.com': 'Secretaria Segunda',
              'aiaramattos@universidadebusf.edu.br': 'Suporte',
              'kamillabellara@gmail.com': 'Financeiro',
              'wendellacarioca@gmail.com': 'Documentação'
