import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketServer } from "socket.io";
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
  insertEnvioUnicvSchema,
  insertEnvioFamarSchema
} from "@shared/schema";
import { z } from "zod";
import { botConversaService, type BotConversaWebhookData } from "./services/botconversa";
import { UnifiedAsaasService } from "./services/unified-asaas-service";
import asaasRoutes from "./routes/asaas-routes";
import { v4 as uuidv4 } from 'uuid';
import { PDFService } from './pdfService';


const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";

// Configuração do serviço Asaas
const asaasService = new UnifiedAsaasService({
  baseURL: 'https://api.asaas.com/v3',
  apiKey: process.env.ASAAS_API_KEY!
});

// Configuração do serviço PDF
const pdfService = new PDFService(storage);

// Middleware para validar JWT
export const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token de acesso requerido' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Usuário não encontrado' });
    }
    if (!user.isActive) {
      return res.status(401).json({ message: 'Conta desativada' });
    }
    req.user = user;
    next();
  } catch (error) {
    logger.error('Erro na validação do token', error);
    return res.status(403).json({ message: 'Token inválido' });
  }
};

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

  // Autenticação e Usuários
  
  // Login
  app.post("/api/auth/login", async (req, res) => {
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
  });

  // Validar token e retornar dados do usuário
  app.get("/api/auth/me", authenticateToken, async (req: any, res) => {
    try {
      res.json({
        user: {
          id: req.user.id,
          username: req.user.username,
          email: req.user.email,
          name: req.user.name,
          role: req.user.role,
          companyAccount: req.user.companyAccount,
          department: req.user.department
        }
      });
    } catch (error) {
      logger.error("Erro ao validar token:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

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
          preco: course.preco,
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
              status: avaliacao.dataFechamento > new Date().toISOString() ? "disponivel" : "expirada",
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

  // Sincronizar conversas do BotConversa
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
      
      // Buscar apenas conversas reais do BotConversa (que tenham dados do BotConversa OU não tenham dados simulados)
      let allConversations = await storage.getConversations();
      
      // Filtrar conversas simuladas - manter apenas as que têm customerPhone real ou são do BotConversa
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
        
        // Priorizar informações do BotConversa se disponíveis
        if (conv.botconversaManagerName) {
          attendantName = conv.botconversaManagerName;
          
          // Determinar equipe baseada no email do manager
          if (conv.botconversaManagerEmail) {
            // Mapear emails para equipes reais do BotConversa
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
            };
            
            equipe = emailToTeam[conv.botconversaManagerEmail] || 'Comercial';
          }
        } else {
          // Fallback para atendente do sistema local
          const attendant = conv.attendantId ? await storage.getUser(conv.attendantId) : null;
          attendantName = attendant ? attendant.name || attendant.username : 'Não atribuído';
          
          if (attendant) {
            const attendantTeam = teams.find(t => t.id === attendant.teamId);
            equipe = attendantTeam ? attendantTeam.name : 'Atendimento';
          }
        }
        
        return {
          id: conv.id,
          lead: conv.customerName || conv.customerPhone || `Cliente ${conv.id}`,
          hora: conv.hora || new Date(conv.createdAt).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          atendente: conv.atendente || attendantName,
          equipe: conv.equipe || equipe,
          duracao: conv.duracao || duracao,
          status: conv.status === 'active' ? 'Em andamento' : 
                 conv.status === 'closed' ? 'Concluído' : 'Pendente',
          resultado: conv.resultado || null,
          assunto: conv.assunto || null
        };
      }));
      
      // Aplicar filtros adicionais
      let filteredAtendimentos = atendimentos;
      
      // Filtro por status
      if (status && status !== 'Todos') {
        filteredAtendimentos = filteredAtendimentos.filter(atendimento => 
          atendimento.status === status
        );
      }
      
      // Filtro por equipe
      if (equipe && equipe !== 'Todas') {
        filteredAtendimentos = filteredAtendimentos.filter(atendimento => 
          atendimento.equipe === equipe
        );
      }
      
      // Filtro por atendente (se fornecido)
      if (req.query.atendente && req.query.atendente !== 'Todos') {
        filteredAtendimentos = filteredAtendimentos.filter(atendimento => 
          atendimento.atendente === req.query.atendente
        );
      }
      

      
      // Filtro por busca de texto (se fornecido)
      if (req.query.search) {
        const searchTerm = req.query.search.toLowerCase();
        filteredAtendimentos = filteredAtendimentos.filter(atendimento => 
          atendimento.lead.toLowerCase().includes(searchTerm) ||
          atendimento.atendente.toLowerCase().includes(searchTerm) ||
          atendimento.equipe.toLowerCase().includes(searchTerm)
        );
      }
      
      // Aplicar filtros de data se fornecidos
      if (startDate || endDate) {
        filteredAtendimentos = filteredAtendimentos.filter(atendimento => {
          const convDate = new Date(atendimento.hora);
          const start = startDate ? new Date(startDate) : new Date(0);
          const end = endDate ? new Date(endDate) : new Date();
          return convDate >= start && convDate <= end;
        });
      }
      
      // Ordenar por data de criação (mais recentes primeiro)
      filteredAtendimentos.sort((a, b) => b.id - a.id);
      
      // Calcular paginação
      const total = filteredAtendimentos.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedAtendimentos = filteredAtendimentos.slice(startIndex, endIndex);
      
      // Resposta com informações de paginação
      res.json({
        data: paginatedAtendimentos,
        pagination: {
          page: currentPage,
          limit: pageSize,
          total,
          totalPages,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1
        }
      });
    } catch (error) {
      logger.error("Erro ao buscar atendimentos:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Endpoint para buscar dados reais de atendentes e equipes do BotConversa
  app.get("/api/atendimentos/filters-data", authenticateToken, async (req: any, res) => {
    try {
      const { BotConversaService } = await import('./services/botconversa');
      const botConversaService = new BotConversaService();
      
      // Buscar managers das duas contas
      const [supporteManagers, comercialManagers] = await Promise.all([
        botConversaService.getManagers('SUPORTE'),
        botConversaService.getManagers('COMERCIAL')
      ]);
      
      // Combinar e processar managers
      const allManagers = [...supporteManagers, ...comercialManagers];
      const atendentes = [...new Set(allManagers.map(m => m.full_name))].filter(Boolean).sort();
      
      // Mapear emails para equipes reais do BotConversa
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
      };
      
      // Usar apenas as equipes reais do BotConversa baseadas nos departamentos identificados
      const equipesReaisBotConversa = [
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
      
      const equipes = equipesReaisBotConversa.sort();
      
      // Buscar status reais das conversas do banco
      const conversations = await storage.getConversations();
      const uniqueStatuses = [...new Set(conversations.map(conv => {
        return conv.status === 'active' ? 'Em andamento' : 
               conv.status === 'closed' ? 'Concluído' : 'Pendente';
      }))];
      
      // Garantir que todos os status possíveis estejam disponíveis
      const allPossibleStatuses = ['Em andamento', 'Concluído', 'Pendente'];
      const statusFromDb = uniqueStatuses.length > 0 ? uniqueStatuses : allPossibleStatuses;
      
      res.json({
        atendentes: [...atendentes, 'Não atribuído'].sort(),
        equipes: equipes,
        status: statusFromDb,
        managersData: allManagers.map(m => ({
          id: m.id,
          name: m.full_name,
          email: m.email,
          equipe: emailToTeam[m.email] || 'Comercial',
          assign_chat: m.assign_chat
        }))
      });
    } catch (error) {
      logger.error("Erro ao buscar dados de filtros do BotConversa:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.patch("/api/atendimentos/:id/status", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      // Mapear status para formato do banco
      const dbStatus = status === 'Em andamento' ? 'active' : 
                      status === 'Concluído' ? 'closed' : 'pending';
      
      const updatedConversation = await storage.updateConversation(parseInt(id), { 
        status: dbStatus 
      });
      
      if (updatedConversation) {
        // Sincronização bidirecional com BotConversa
        if (updatedConversation.customerPhone) {
          // Tentar determinar qual conta do BotConversa usar
          const accountToUse = updatedConversation.botconversaManagerEmail?.includes('comercial') ||
                               updatedConversation.botconversaManagerEmail?.includes('yasmin') ||
                               updatedConversation.botconversaManagerEmail?.includes('breno') ||
                               updatedConversation.botconversaManagerEmail?.includes('jhonata') 
                               ? 'COMERCIAL' : 'SUPORTE';
          
          // Atualizar status no BotConversa (não bloqueia se falhar)
          try {
            await botConversaService.updateConversationStatusInBotConversa(
              updatedConversation.customerPhone,
              status,
              accountToUse
            );
            console.log(`✓ Status sincronizado com BotConversa: ${status} para ${updatedConversation.customerPhone}`);
          } catch (error) {
            logger.error(`⚠️ Erro na sincronização com BotConversa:`, error);
            // Não falha a operação local se houver erro no BotConversa
          }
        }

        const atendimento = {
          id: updatedConversation.id,
          lead: updatedConversation.customerName || `Cliente ${updatedConversation.id}`,
          hora: new Date(updatedConversation.createdAt).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          atendente: updatedConversation.attendantId ? `Atendente ${updatedConversation.attendantId}` : 'Não atribuído',
          equipe: updatedConversation.attendantId ? 'Atendimento' : 'Não atribuído',
          duracao: updatedConversation.status === 'closed' ? '15m' : 'Em andamento',
          status: updatedConversation.status === 'active' ? 'Em andamento' : 
                 updatedConversation.status === 'closed' ? 'Concluído' : 'Pendente'
        };
        
        res.json(atendimento);
      } else {
        res.status(404).json({ message: "Atendimento não encontrado" });
      }
    } catch (error) {
      logger.error("Erro ao atualizar status:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Endpoint para atualizar resultado/classificação CRM
  app.patch("/api/atendimentos/:id/resultado", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { resultado } = req.body;
      
      // Validar o resultado
      const validResultados = ['venda_ganha', 'venda_perdida', 'aluno_satisfeito', 'sem_solucao'];
      if (!validResultados.includes(resultado)) {
        return res.status(400).json({ message: "Resultado inválido" });
      }
      
      // Atualizar no banco de dados
      const updatedConversation = await storage.updateConversation(parseInt(id), { resultado });
      
      if (updatedConversation) {
        const atendimento = {
          id: updatedConversation.id,
          lead: updatedConversation.customerName || `Cliente ${updatedConversation.id}`,
          hora: new Date(updatedConversation.createdAt).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          atendente: updatedConversation.attendantId ? `Atendente ${updatedConversation.attendantId}` : 'Não atribuído',
          equipe: updatedConversation.attendantId ? 'Atendimento' : 'Não atribuído',
          duracao: updatedConversation.status === 'closed' ? '15m' : 'Em andamento',
          status: updatedConversation.status === 'active' ? 'Em andamento' : 
                 updatedConversation.status === 'closed' ? 'Concluído' : 'Pendente',
          resultado: updatedConversation.resultado
        };
        
        res.json(atendimento);
      } else {
        res.status(404).json({ message: "Atendimento não encontrado" });
      }
    } catch (error) {
      logger.error("Erro ao atualizar resultado:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar novo atendimento manual
  app.post("/api/atendimentos", authenticateToken, async (req: any, res) => {
    try {
      const { lead, hora, atendente, equipe, duracao, status, resultado, assunto, observacoes } = req.body;
      
      // Validar dados obrigatórios
      if (!lead || !hora || !atendente || !equipe || !duracao || !status) {
        return res.status(400).json({ message: "Campos obrigatórios: lead, hora, atendente, equipe, duracao, status" });
      }

      // Mapear status para formato do banco
      const dbStatus = status === 'Em andamento' ? 'active' : 
                      status === 'Concluído' ? 'closed' : 'pending';

      // Criar um lead para o atendimento manual
      const leadRecord = await storage.createLead({
        name: lead,
        phone: `+55${Date.now()}`, // Telefone fictício único
        status: 'novo',
        source: 'manual'
      });

      // Criar conversa manual (atendimento)
      const conversation = await storage.createConversation({
        leadId: leadRecord.id,
        status: dbStatus,
        attendantId: req.user.id
      });

      // Atualizar campos específicos diretamente no banco
      await db.update(conversations)
        .set({
          customerName: lead,
          customerPhone: leadRecord.phone,
          resultado: resultado || null,
          companyAccount: 'SUPORTE',
          hora: hora,
          atendente: atendente,
          equipe: equipe,
          duracao: duracao,
          assunto: assunto || null,
          observacoes: observacoes || null
        })
        .where(eq(conversations.id, conversation.id));

      // Retornar no formato de atendimento
      const atendimento = {
        id: conversation.id,
        lead: lead,
        hora: hora,
        atendente: conversation.atendente,
        equipe: conversation.equipe,
        duracao: conversation.duracao,
        status: status,
        resultado: conversation.resultado,
        assunto: assunto || null,
        observacoes: observacoes || null
      };

      res.status(201).json(atendimento);
    } catch (error) {
      logger.error("Erro ao criar atendimento:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Atualizar atendimento completo
  app.put("/api/atendimentos/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const { lead, hora, atendente, equipe, duracao, status, resultado, assunto, observacoes } = req.body;

      console.log('PUT /api/atendimentos/:id - Dados recebidos:', { 
        id, lead, hora, atendente, equipe, duracao, status, resultado, assunto, observacoes 
      });

      // Mapear status para formato do banco
      const dbStatus = status === 'Em andamento' ? 'active' : 
                      status === 'Concluído' ? 'closed' : 'pending';

      // Atualizar conversa com todos os campos de atendimento
      const updatedConversation = await storage.updateConversation(parseInt(id), {
        customerName: lead,
        status: dbStatus,
        resultado: resultado || null,
        hora: hora,
        atendente: atendente,
        equipe: equipe,
        duracao: duracao,
        assunto: assunto || null,
        observacoes: observacoes || null
      });

      console.log('Conversa atualizada:', updatedConversation);

      if (updatedConversation) {
        // Retornar no formato de atendimento
        const atendimento = {
          id: updatedConversation.id,
          lead: updatedConversation.customerName,
          hora: updatedConversation.hora,
          atendente: updatedConversation.atendente,
          equipe: updatedConversation.equipe,
          duracao: updatedConversation.duracao,
          status: status,
          resultado: updatedConversation.resultado,
          assunto: updatedConversation.assunto,
          observacoes: updatedConversation.observacoes
        };

        res.json(atendimento);
      } else {
        res.status(404).json({ message: "Atendimento não encontrado" });
      }
    } catch (error) {
      logger.error("Erro ao atualizar atendimento:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Excluir atendimento
  app.delete("/api/atendimentos/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;

      // Verificar se a conversa existe primeiro
      const existingConversations = await db
        .select()
        .from(conversations)
        .where(eq(conversations.id, parseInt(id)));

      if (existingConversations.length === 0) {
        return res.status(404).json({ message: "Atendimento não encontrado" });
      }

      // Excluir mensagens relacionadas primeiro
      await db
        .delete(attendanceMessages)
        .where(eq(attendanceMessages.conversationId, parseInt(id)));

      // Excluir notas internas relacionadas
      await db
        .delete(internalNotes)
        .where(eq(internalNotes.conversationId, parseInt(id)));

      // Excluir a conversa
      await db
        .delete(conversations)
        .where(eq(conversations.id, parseInt(id)));

      res.json({ message: "Atendimento excluído com sucesso" });
    } catch (error) {
      logger.error("Erro ao excluir atendimento:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Endpoint para buscar dados dos filtros
  app.get("/api/atendimentos/filters-data", authenticateToken, async (req: any, res) => {
    try {
      // Buscar todas as conversas para extrair dados únicos
      const conversations = await storage.getConversations();
      const teams = await storage.getTeams();
      const users = await storage.getAllUsers();

      // Extrair atendentes únicos das conversas
      const atendentesSet = new Set<string>();
      const equipesSet = new Set<string>();
      const companhiasSet = new Set<string>();

      for (const conv of conversations) {
        // Adicionar atendentes
        if (conv.botconversaManagerEmail) {
          // Mapear email para nome do atendente
          const managerNames: { [key: string]: string } = {
            'carolgoncalves.consultoraeducacional@gmail.com': 'Carol Gonçalves',
            'amanda@instituicaoeducacional.com': 'Amanda Santos',
            'yasminvitorino.office@gmail.com': 'Yasmin Vitorino',
            'brenodantas28@gmail.com': 'Breno Dantas',
            'jhonatapimenteljgc38@gmail.com': 'Jhonata Pimentel'
          };
          const attendantName = managerNames[conv.botconversaManagerEmail] || conv.botconversaManagerEmail;
          atendentesSet.add(attendantName);
        } else if (conv.attendantId) {
          const attendant = users.find(u => u.id === conv.attendantId);
          if (attendant) {
            atendentesSet.add(attendant.name || attendant.username);
          }
        }

        // Adicionar companhias
        if (conv.companyAccount) {
          companhiasSet.add(conv.companyAccount);
        }
      }

      // Adicionar equipes do sistema
      teams.forEach(team => equipesSet.add(team.name));

      res.json({
        atendentes: Array.from(atendentesSet).sort(),
        equipes: Array.from(equipesSet).sort(),
        companhias: Array.from(companhiasSet).sort()
      });
    } catch (error) {
      logger.error("Erro ao buscar dados de filtros:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Chat interno
  app.get("/api/chats", authenticateToken, async (req: any, res) => {
    try {
      const chats = await storage.getUserChats(req.user.id);
      res.json(chats);
    } catch (error) {
      logger.error("Erro ao buscar chats:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/chats", authenticateToken, async (req: any, res) => {
    try {
      const { name, type, teamId } = req.body;
      const chat = await storage.createChat({
        name,
        type,
        teamId,
        createdBy: req.user.id
      });

      // Adicionar criador como participante
      await storage.addChatParticipant(chat.id, req.user.id);
      
      res.status(201).json(chat);
    } catch (error) {
      logger.error("Erro ao criar chat:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Messages
  app.get("/api/chats/:chatId/messages", authenticateToken, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      const messages = await storage.getChatMessages(
        parseInt(chatId), 
        parseInt(limit as string), 
        parseInt(offset as string)
      );
      
      res.json(messages);
    } catch (error) {
      logger.error("Erro ao buscar mensagens:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/chats/:chatId/messages", authenticateToken, async (req: any, res) => {
    try {
      const { chatId } = req.params;
      const { content, type = "text", fileUrl, fileName, mentions, replyToId } = req.body;
      
      const message = await storage.createMessage({
        chatId: parseInt(chatId),
        senderId: req.user.id,
        content,
        type,
        fileUrl,
        fileName,
        mentions,
        replyToId
      });

      // Emit via WebSocket
      io.to(`chat_${chatId}`).emit('new_message', message);
      
      res.status(201).json(message);
    } catch (error) {
      logger.error("Erro ao criar mensagem:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Goals
  app.get("/api/goals", authenticateToken, async (req: any, res) => {
    try {
      const { type, teamId, userId } = req.query;
      const filters: any = {};
      
      if (type) filters.type = type as string;
      if (teamId) filters.teamId = parseInt(teamId as string);
      if (userId) filters.userId = parseInt(userId as string);

      const goals = await storage.getGoals(filters);
      res.json(goals);
    } catch (error) {
      logger.error("Erro ao buscar metas:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/goals", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const goalData = req.body;
      const goal = await storage.createGoal(goalData);
      res.status(201).json(goal);
    } catch (error) {
      logger.error("Erro ao criar meta:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Goal Progress endpoints
  app.get("/api/goal-progress", authenticateToken, async (req: any, res) => {
    try {
      const { goalId, userId, period } = req.query;
      const filters: any = {};
      
      if (goalId) filters.goalId = parseInt(goalId as string);
      if (userId) filters.userId = parseInt(userId as string);
      if (period) filters.period = period as string;

      const progress = await storage.getGoalProgress(filters);
      res.json(progress);
    } catch (error) {
      logger.error("Erro ao buscar progresso das metas:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/goal-progress", authenticateToken, async (req: any, res) => {
    try {
      const progressData = req.body;
      const progress = await storage.createGoalProgress(progressData);
      res.status(201).json(progress);
    } catch (error) {
      logger.error("Erro ao criar progresso de meta:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/goal-progress/increment", authenticateToken, async (req: any, res) => {
    try {
      const { goalId, userId, period, increment = 1 } = req.body;
      
      const progress = await storage.incrementGoalProgress(
        goalId, 
        userId || null, 
        period, 
        increment
      );
      
      // Verificar se houve conquista e notificar via WebSocket
      if (progress.achieved) {
        const achievements = await storage.checkGoalAchievements(userId);
        const relevantAchievement = achievements.find(a => 
          a.goalId === goalId && 
          a.userId === userId && 
          a.period === period
        );
        
        if (relevantAchievement) {
          io.emit('goal_achieved', {
            userId: userId || null,
            achievement: relevantAchievement
          });
        }
      }
      
      res.json(progress);
    } catch (error) {
      logger.error("Erro ao incrementar progresso da meta:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/goal-achievements", authenticateToken, async (req: any, res) => {
    try {
      const { userId } = req.query;
      
      const achievements = await storage.checkGoalAchievements(
        userId ? parseInt(userId as string) : undefined
      );
      
      res.json(achievements);
    } catch (error) {
      logger.error("Erro ao buscar conquistas:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });



  // Endpoints para relatórios de presença com dados reais
  app.get("/api/presence/dashboard", authenticateToken, async (req: any, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Buscar todos os usuários ativos
      const allUsers = await storage.getAllUsers();
      const activeUsers = allUsers.filter(user => user.isActive);
      
      // Buscar atividades de todos os usuários para hoje
      const todaysActivities = await Promise.all(
        activeUsers.map(async (user) => {
          const activities = await storage.getUserActivity(user.id, today);
          return { user, activities };
        })
      );

      // Calcular estatísticas
      const totalEmployees = activeUsers.length;
      const usersWithActivity = todaysActivities.filter(ua => ua.activities.length > 0);
      const presentToday = usersWithActivity.length;
      const absentToday = totalEmployees - presentToday;

      // Calcular tempo médio online
      let totalOnlineMinutes = 0;
      const detailedAttendance = usersWithActivity.map(({ user, activities }) => {
        // Agrupar atividades por sessão
        const sessions = activities.reduce((acc, activity) => {
          const sessionKey = activity.sessionId || 'default';
          if (!acc[sessionKey]) {
            acc[sessionKey] = [];
          }
          acc[sessionKey].push(activity);
          return acc;
        }, {} as Record<string, typeof activities>);

        // Calcular tempo online total
        let userOnlineMinutes = 0;
        const sessionSummary = Object.entries(sessions).map(([sessionId, sessionActivities]) => {
          const loginActivity = sessionActivities.find(a => a.action === 'login');
          const logoutActivity = sessionActivities.find(a => a.action === 'logout');
          
          let sessionMinutes = 0;
          if (loginActivity) {
            const endTime = logoutActivity ? new Date(logoutActivity.timestamp) : new Date();
            const startTime = new Date(loginActivity.timestamp);
            sessionMinutes = Math.max(0, (endTime.getTime() - startTime.getTime()) / (1000 * 60));
          }
          
          userOnlineMinutes += sessionMinutes;
          
          return {
            sessionId,
            loginTime: loginActivity?.timestamp,
            logoutTime: logoutActivity?.timestamp,
            minutes: sessionMinutes
          };
        });

        totalOnlineMinutes += userOnlineMinutes;

        // Última atividade
        const lastActivity = activities.length > 0 ? 
          new Date(Math.max(...activities.map(a => new Date(a.timestamp).getTime()))) : null;

        // Contar inatividades (atividades de "heartbeat" ou "activity_check")
        const inactivityCount = activities.filter(a => 
          a.action === 'inactivity_detected' || a.action === 'away'
        ).length;

        // Primeira sessão do dia
        const mainSession = sessionSummary[0] || { loginTime: null, logoutTime: null };

        return {
          name: user.username,
          email: user.email,
          team: user.teamName || 'Sem equipe',
          loginTime: mainSession.loginTime ? 
            new Date(mainSession.loginTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-',
          logoutTime: mainSession.logoutTime ? 
            new Date(mainSession.logoutTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-',
          totalOnlineTime: userOnlineMinutes > 0 ? 
            `${Math.floor(userOnlineMinutes / 60)}h ${Math.floor(userOnlineMinutes % 60)}m` : '0h 0m',
          status: mainSession.logoutTime ? 'Ativo' : (userOnlineMinutes > 0 ? 'Online' : 'Inativo'),
          inactivityCount,
          lastActivity: lastActivity ? 
            lastActivity.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-',
          userId: user.id
        };
      });

      // Adicionar usuários ausentes
      const absentUsers = todaysActivities
        .filter(ua => ua.activities.length === 0)
        .map(({ user }) => ({
          name: user.username,
          email: user.email,
          team: user.teamName || 'Sem equipe',
          loginTime: '-',
          logoutTime: '-',
          totalOnlineTime: '0h 0m',
          status: 'Ausente',
          inactivityCount: 0,
          lastActivity: '-',
          userId: user.id
        }));

      const allAttendance = [...detailedAttendance, ...absentUsers];

      // Calcular tempo médio
      const averageOnlineMinutes = presentToday > 0 ? totalOnlineMinutes / presentToday : 0;
      const averageOnlineTime = `${Math.floor(averageOnlineMinutes / 60)}h ${Math.floor(averageOnlineMinutes % 60)}m`;

      // Estatísticas semanais (últimos 7 dias)
      const weeklyStats = await calculateWeeklyStats(activeUsers, storage);

      res.json({
        summary: {
          totalEmployees,
          presentToday,
          absentToday,
          averageOnlineTime,
          attendanceRate: totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0
        },
        dailyAttendance: allAttendance,
        weeklyStats
      });
    } catch (error) {
      logger.error("Erro ao buscar dados de presença:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Endpoint para relatório detalhado por usuário
  app.get("/api/presence/user/:userId", authenticateToken, async (req: any, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const { startDate, endDate } = req.query;
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Buscar atividades no período
      const activities = await storage.getUserActivity(userId);
      
      // Filtrar por período se especificado
      let filteredActivities = activities;
      if (startDate || endDate) {
        filteredActivities = activities.filter(activity => {
          const activityDate = new Date(activity.timestamp);
          const start = startDate ? new Date(startDate as string) : new Date('1970-01-01');
          const end = endDate ? new Date(endDate as string) : new Date();
          return activityDate >= start && activityDate <= end;
        });
      }

      // Agrupar por data
      const dailyActivities = filteredActivities.reduce((acc, activity) => {
        const date = new Date(activity.timestamp).toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(activity);
        return acc;
      }, {} as Record<string, typeof activities>);

      // Calcular estatísticas diárias
      const dailyStats = Object.entries(dailyActivities).map(([date, dayActivities]) => {
        const loginActivity = dayActivities.find(a => a.action === 'login');
        const logoutActivity = dayActivities.find(a => a.action === 'logout');
        
        let onlineMinutes = 0;
        if (loginActivity) {
          const endTime = logoutActivity ? new Date(logoutActivity.timestamp) : new Date();
          const startTime = new Date(loginActivity.timestamp);
          onlineMinutes = Math.max(0, (endTime.getTime() - startTime.getTime()) / (1000 * 60));
        }

        return {
          date,
          loginTime: loginActivity?.timestamp,
          logoutTime: logoutActivity?.timestamp,
          onlineMinutes,
          totalActivities: dayActivities.length,
          inactivityCount: dayActivities.filter(a => 
            a.action === 'inactivity_detected' || a.action === 'away'
          ).length
        };
      });

      res.json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          team: user.teamName || 'Sem equipe'
        },
        dailyStats: dailyStats.sort((a, b) => b.date.localeCompare(a.date)),
        totalDays: dailyStats.length,
        averageOnlineTime: dailyStats.length > 0 ? 
          dailyStats.reduce((sum, day) => sum + day.onlineMinutes, 0) / dailyStats.length : 0
      });
    } catch (error) {
      logger.error("Erro ao buscar relatório do usuário:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Endpoint para ranking de presença
  app.get("/api/presence/ranking", authenticateToken, async (req: any, res) => {
    try {
      const { period = 'week' } = req.query; // week, month
      
      const allUsers = await storage.getAllUsers();
      const activeUsers = allUsers.filter(user => user.isActive);
      
      // Calcular período
      const endDate = new Date();
      const startDate = new Date();
      if (period === 'week') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(endDate.getMonth() - 1);
      }

      // Calcular estatísticas por usuário
      const userStats = await Promise.all(
        activeUsers.map(async (user) => {
          const activities = await storage.getUserActivity(user.id);
          const periodActivities = activities.filter(activity => {
            const activityDate = new Date(activity.timestamp);
            return activityDate >= startDate && activityDate <= endDate;
          });

          // Calcular tempo online total
          const sessions = periodActivities.reduce((acc, activity) => {
            const sessionKey = activity.sessionId || 'default';
            if (!acc[sessionKey]) {
              acc[sessionKey] = [];
            }
            acc[sessionKey].push(activity);
            return acc;
          }, {} as Record<string, typeof activities>);

          let totalOnlineMinutes = 0;
          let daysPresent = 0;
          const dailyPresence = new Set();

          Object.values(sessions).forEach(sessionActivities => {
            const loginActivity = sessionActivities.find(a => a.action === 'login');
            const logoutActivity = sessionActivities.find(a => a.action === 'logout');
            
            if (loginActivity) {
              const endTime = logoutActivity ? new Date(logoutActivity.timestamp) : new Date();
              const startTime = new Date(loginActivity.timestamp);
              const sessionMinutes = Math.max(0, (endTime.getTime() - startTime.getTime()) / (1000 * 60));
              totalOnlineMinutes += sessionMinutes;
              
              const day = startTime.toISOString().split('T')[0];
              dailyPresence.add(day);
            }
          });

          daysPresent = dailyPresence.size;
          const expectedDays = period === 'week' ? 7 : 30;
          const attendanceRate = expectedDays > 0 ? (daysPresent / expectedDays) * 100 : 0;

          return {
            userId: user.id,
            username: user.username,
            email: user.email,
            team: user.teamName || 'Sem equipe',
            totalOnlineMinutes,
            daysPresent,
            attendanceRate,
            averageDailyMinutes: daysPresent > 0 ? totalOnlineMinutes / daysPresent : 0
          };
        })
      );

      // Ordenar por tempo online total
      const rankingByTime = userStats
        .sort((a, b) => b.totalOnlineMinutes - a.totalOnlineMinutes)
        .map((user, index) => ({ ...user, rank: index + 1 }));

      // Ordenar por taxa de presença
      const rankingByAttendance = userStats
        .sort((a, b) => b.attendanceRate - a.attendanceRate)
        .map((user, index) => ({ ...user, rank: index + 1 }));

      res.json({
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        rankings: {
          byOnlineTime: rankingByTime,
          byAttendanceRate: rankingByAttendance
        },
        summary: {
          totalUsers: activeUsers.length,
          totalOnlineHours: Math.round(userStats.reduce((sum, u) => sum + u.totalOnlineMinutes, 0) / 60),
          averageAttendanceRate: Math.round(
            userStats.reduce((sum, u) => sum + u.attendanceRate, 0) / userStats.length
          )
        }
      });
    } catch (error) {
      logger.error("Erro ao buscar ranking de presença:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // User Activity
  app.get("/api/users/:userId/activity", authenticateToken, async (req: any, res) => {
    try {
      const { userId } = req.params;
      const { date } = req.query;
      
      // Usuários só podem ver sua própria atividade, admins podem ver todas
      if (req.user.role !== 'admin' && req.user.id !== parseInt(userId)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const activity = await storage.getUserActivity(parseInt(userId), date as string);
      res.json(activity);
    } catch (error) {
      logger.error("Erro ao buscar atividade:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/users/:userId/activity", authenticateToken, async (req: any, res) => {
    try {
      const { userId } = req.params;
      
      // Usuários só podem registrar sua própria atividade
      if (req.user.id !== parseInt(userId)) {
        return res.status(403).json({ message: "Acesso negado" });
      }

      const activityData = req.body;
      const activity = await storage.createUserActivity({
        ...activityData,
        userId: parseInt(userId)
      });
      
      res.status(201).json(activity);
    } catch (error) {
      logger.error("Erro ao criar atividade:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Rotas para atendimento ao aluno
  app.post("/api/conversations", authenticateToken, async (req: any, res) => {
    try {
      const conversationData = req.body;
      const conversation = await storage.createConversation({
        ...conversationData,
        attendantId: conversationData.attendantId || req.user.id
      });
      res.status(201).json(conversation);
    } catch (error) {
      logger.error("Erro ao criar conversa:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/conversations/:conversationId/messages", authenticateToken, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const { limit = 50, offset = 0 } = req.query;
      
      const messages = await storage.getConversationMessages(
        parseInt(conversationId), 
        parseInt(limit as string), 
        parseInt(offset as string)
      );
      
      res.json(messages);
    } catch (error) {
      logger.error("Erro ao buscar mensagens da conversa:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/conversations/:conversationId/messages", authenticateToken, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const { content, type = "text", isFromStudent = false } = req.body;
      
      const message = await storage.createAttendanceMessage({
        conversationId: parseInt(conversationId),
        senderId: req.user.id,
        content,
        type,
        isFromStudent
      });

      // Emit via WebSocket para atualização em tempo real
      io.to(`conversation_${conversationId}`).emit('new_attendance_message', message);
      
      res.status(201).json(message);
    } catch (error) {
      logger.error("Erro ao criar mensagem de atendimento:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/conversations/:conversationId/notes", authenticateToken, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const notes = await storage.getConversationNotes(parseInt(conversationId));
      res.json(notes);
    } catch (error) {
      logger.error("Erro ao buscar notas da conversa:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/conversations/:conversationId/notes", authenticateToken, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const { content } = req.body;
      
      const note = await storage.createInternalNote({
        conversationId: parseInt(conversationId),
        authorId: req.user.id,
        content
      });
      
      res.status(201).json(note);
    } catch (error) {
      logger.error("Erro ao criar nota interna:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Rotas para relatórios e dashboards
  app.get("/api/dashboard/stats", authenticateToken, async (req: any, res) => {
    try {
      // Estatísticas básicas do dashboard
      const stats = {
        totalConversations: 0,
        activeAgents: 0,
        avgResponseTime: 0,
        todayConversations: 0
      };

      // Você pode implementar queries específicas aqui
      res.json(stats);
    } catch (error) {
      logger.error("Erro ao buscar estatísticas:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Rotas para produtividade
  app.get("/api/productivity/metrics", authenticateToken, async (req: any, res) => {
    try {
      const { startDate, endDate, userId, teamId } = req.query;
      
      // Implementar métricas de produtividade
      const metrics = {
        conversationsHandled: 0,
        avgResolutionTime: 0,
        customerSatisfaction: 0,
        activityScore: 0
      };

      res.json(metrics);
    } catch (error) {
      logger.error("Erro ao buscar métricas de produtividade:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // WebSocket para tempo real
  io.on('connection', (socket) => {
    console.log('Usuário conectado:', socket.id);

    // Join chat rooms
    socket.on('join_chat', (chatId) => {
      socket.join(`chat_${chatId}`);
      console.log(`Usuário ${socket.id} entrou no chat ${chatId}`);
    });

    // Leave chat rooms
    socket.on('leave_chat', (chatId) => {
      socket.leave(`chat_${chatId}`);
      console.log(`Usuário ${socket.id} saiu do chat ${chatId}`);
    });

    // Join conversation rooms (atendimento ao aluno)
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`Usuário ${socket.id} entrou na conversa ${conversationId}`);
    });

    // Leave conversation rooms
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`Usuário ${socket.id} saiu da conversa ${conversationId}`);
    });

    // Typing indicators para chats internos
    socket.on('typing', (data) => {
      socket.to(`chat_${data.chatId}`).emit('user_typing', {
        userId: data.userId,
        username: data.username
      });
    });

    socket.on('stop_typing', (data) => {
      socket.to(`chat_${data.chatId}`).emit('user_stop_typing', {
        userId: data.userId
      });
    });

    // Typing indicators para conversas de atendimento
    socket.on('conversation_typing', (data) => {
      socket.to(`conversation_${data.conversationId}`).emit('attendant_typing', {
        userId: data.userId,
        username: data.username
      });
    });

    socket.on('conversation_stop_typing', (data) => {
      socket.to(`conversation_${data.conversationId}`).emit('attendant_stop_typing', {
        userId: data.userId
      });
    });

    // Notificações de status de presença
    socket.on('update_presence', (data) => {
      socket.broadcast.emit('user_presence_update', {
        userId: data.userId,
        status: data.status // online, busy, away, offline
      });
    });

    // Notificações de metas alcançadas
    socket.on('goal_achieved', (data) => {
      // Notificar todos os usuários da team sobre meta alcançada
      if (data.teamId) {
        io.emit('team_goal_achieved', data);
      } else {
        io.emit('individual_goal_achieved', data);
      }
    });

    socket.on('disconnect', () => {
      console.log('Usuário desconectado:', socket.id);
    });
  });

  // ===== WEBHOOKS BOTCONVERSA =====
  
  // Webhook para conta de SUPORTE
  app.post("/webhook/botconversa/suporte", async (req, res) => {
    try {
      console.log('Webhook Suporte recebido:', req.body);
      
      const webhookData: BotConversaWebhookData = req.body;
      
      // Validar dados básicos do webhook
      if (!webhookData.subscriber || !webhookData.event_type) {
        return res.status(400).json({ 
          error: "Dados do webhook inválidos - subscriber e event_type são obrigatórios" 
        });
      }
      
      // Processar webhook
      await botConversaService.processWebhook(webhookData, 'SUPORTE');
      
      // Emitir evento via WebSocket para atualizações em tempo real
      io.emit('botconversa_webhook', {
        account: 'SUPORTE',
        event_type: webhookData.event_type,
        subscriber: webhookData.subscriber
      });
      
      res.status(200).json({ 
        success: true, 
        message: "Webhook processado com sucesso",
        account: "SUPORTE",
        event_type: webhookData.event_type
      });
      
    } catch (error) {
      logger.error("Erro ao processar webhook Suporte:", error);
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });
  
  // Webhook para conta COMERCIAL
  app.post("/webhook/botconversa/comercial", async (req, res) => {
    try {
      console.log('Webhook Comercial recebido:', req.body);
      
      const webhookData: BotConversaWebhookData = req.body;
      
      // Validar dados básicos do webhook
      if (!webhookData.subscriber || !webhookData.event_type) {
        return res.status(400).json({ 
          error: "Dados do webhook inválidos - subscriber e event_type são obrigatórios" 
        });
      }
      
      // Processar webhook
      await botConversaService.processWebhook(webhookData, 'COMERCIAL');
      
      // Emitir evento via WebSocket para atualizações em tempo real
      io.emit('botconversa_webhook', {
        account: 'COMERCIAL', 
        event_type: webhookData.event_type,
        subscriber: webhookData.subscriber
      });
      
      res.status(200).json({ 
        success: true, 
        message: "Webhook processado com sucesso",
        account: "COMERCIAL",
        event_type: webhookData.event_type
      });
      
    } catch (error) {
      logger.error("Erro ao processar webhook Comercial:", error);
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });
  
  // Endpoint para testar integração BotConversa
  app.post("/api/botconversa/test", authenticateToken, async (req: any, res) => {
    try {
      const { account, phone } = req.body;
      
      if (!account || !phone) {
        return res.status(400).json({ 
          error: "Parâmetros obrigatórios: account ('SUPORTE' ou 'COMERCIAL') e phone" 
        });
      }
      
      if (account !== 'SUPORTE' && account !== 'COMERCIAL') {
        return res.status(400).json({ 
          error: "Account deve ser 'SUPORTE' ou 'COMERCIAL'" 
        });
      }
      
      // Buscar subscriber no BotConversa
      const subscriber = await botConversaService.getSubscriberByPhone(phone, account);
      
      if (subscriber) {
        res.json({
          success: true,
          message: `Subscriber encontrado na conta ${account}`,
          account,
          phone,
          subscriber: {
            id: subscriber.id,
            phone: subscriber.phone,
            name: subscriber.name || 'Não informado',
            email: subscriber.email || 'Não informado',
            tags: subscriber.tags || [],
            created_at: subscriber.created_at,
            updated_at: subscriber.updated_at
          }
        });
      } else {
        res.json({
          success: false,
          message: `Subscriber não encontrado na conta ${account}. Isso é normal para testes - o telefone ${phone} não existe na base do BotConversa.`,
          account,
          phone,
          suggestion: "Teste com um telefone real que existe na sua conta BotConversa ou use a funcionalidade de criar subscriber."
        });
      }
      
    } catch (error) {
      logger.error("Erro ao testar integração:", error);
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      
      // Analisar tipo de erro para resposta mais útil
      if (errorMessage.includes('403')) {
        res.status(403).json({ 
          success: false,
          error: "Erro de autenticação",
          message: "Chave de API inválida ou sem permissão. Verifique se a chave está correta.",
          details: errorMessage
        });
      } else if (errorMessage.includes('404')) {
        res.json({ 
          success: false,
          message: "Subscriber não encontrado - comportamento normal para testes",
          error: "Recurso não encontrado",
          details: errorMessage
        });
      } else {
        res.status(500).json({ 
          success: false,
          error: "Erro interno do servidor",
          message: errorMessage,
          suggestion: "Verifique a conectividade com a API BotConversa"
        });
      }
    }
  });
  
  // Endpoint para sincronizar dados do BotConversa
  app.post("/api/botconversa/sync", authenticateToken, async (req: any, res) => {
    try {
      const { account } = req.body;
      
      if (!account) {
        return res.status(400).json({ 
          error: "Parâmetro obrigatório: account ('SUPORTE' ou 'COMERCIAL')" 
        });
      }
      
      if (account !== 'SUPORTE' && account !== 'COMERCIAL') {
        return res.status(400).json({ 
          error: "Account deve ser 'SUPORTE' ou 'COMERCIAL'" 
        });
      }
      
      // Executar sincronização
      await botConversaService.syncWithCRM(account);
      
      res.json({
        success: true,
        message: `Sincronização com conta ${account} concluída`
      });
      
    } catch (error) {
      logger.error("Erro na sincronização:", error);
      res.status(500).json({ 
        error: "Erro na sincronização",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });
  
  // Endpoint para diagnóstico da API BotConversa
  app.post("/api/botconversa/diagnose", authenticateToken, async (req: any, res) => {
    try {
      const { account = 'COMERCIAL' } = req.body;
      const apiKey = account === 'SUPORTE' ? 
        process.env.BOTCONVERSA_SUPORTE_KEY : 
        process.env.BOTCONVERSA_COMERCIAL_KEY;
      
      const baseUrl = 'https://backend.botconversa.com.br/api/v1/webhook';
      const results = [];
      
      // Testa diferentes formatos de autenticação
      const testConfigs = [
        { name: 'x-api-key', headers: { 'x-api-key': apiKey } },
        { name: 'Authorization Bearer', headers: { 'Authorization': `Bearer ${apiKey}` } },
        { name: 'Authorization Direct', headers: { 'Authorization': apiKey } },
        { name: 'api-key', headers: { 'api-key': apiKey } }
      ];
      
      for (const config of testConfigs) {
        try {
          const response = await fetch(`${baseUrl}/tags/`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'BotConversa-Analytics/1.0',
              ...config.headers
            }
          });
          
          const responseText = await response.text();
          results.push({
            config: config.name,
            status: response.status,
            success: response.ok,
            response: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
          });
          
        } catch (error) {
          results.push({
            config: config.name,
            status: 'ERROR',
            success: false,
            error: error.message
          });
        }
      }
      
      res.json({
        account,
        apiKey: apiKey ? `${apiKey.substring(0, 8)}...` : 'NÃO CONFIGURADA',
        results
      });
      
    } catch (error) {
      logger.error("Erro no diagnóstico:", error);
      res.status(500).json({ 
        error: "Erro no diagnóstico",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Endpoint para testar roteamento automático
  app.post("/api/routing/test", authenticateToken, async (req: any, res) => {
    try {
      const { account, tags, phone } = req.body;
      
      if (!account) {
        return res.status(400).json({ 
          success: false, 
          error: "Parâmetro obrigatório: account" 
        });
      }

      // Criar subscriber fictício para teste
      const mockSubscriber = {
        id: 'test-123',
        phone: phone || '5531971761350',
        name: 'Teste Roteamento',
        tags: tags || ['Comercial', 'Muito Interesse'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Testar roteamento
      const { routingService } = await import('./services/routing.js');
      const department = await routingService.routeSubscriber(mockSubscriber, account);
      const assignedUser = await routingService.findBestAttendant(department, account);
      const emails = routingService.getDepartmentEmails(department, account);
      
      return res.json({
        success: true,
        message: `Roteamento testado com sucesso para conta ${account}`,
        routing: {
          department,
          assignedUser,
          emails,
          tags: mockSubscriber.tags
        },
        subscriber: mockSubscriber,
        account
      });
    } catch (error) {
      logger.error("Erro ao testar roteamento:", error);
      return res.status(500).json({ 
        success: false, 
        error: "Erro interno do servidor",
        message: "Erro ao processar teste de roteamento",
        details: error.message
      });
    }
  });

  // Endpoint para buscar informações do fluxo de boas vindas
  app.get("/api/botconversa/flows/:account", authenticateToken, async (req: any, res) => {
    try {
      const { account } = req.params;
      
      if (account !== 'SUPORTE' && account !== 'COMERCIAL') {
        return res.status(400).json({ 
          error: "Account deve ser 'SUPORTE' ou 'COMERCIAL'" 
        });
      }
      
      // Buscar informações do fluxo de boas vindas
      const flowInfo = await botConversaService.getWelcomeFlowInfo(account);
      
      res.json({ 
        success: true,
        account,
        flow: flowInfo
      });
      
    } catch (error) {
      logger.error("Erro ao buscar fluxos:", error);
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Endpoint para análise comparativa do fluxo com CRM
  app.get("/api/botconversa/flows/:account/analysis", authenticateToken, async (req: any, res) => {
    try {
      const { account } = req.params;
      
      if (account !== 'SUPORTE' && account !== 'COMERCIAL') {
        return res.status(400).json({ 
          error: "Account deve ser 'SUPORTE' ou 'COMERCIAL'" 
        });
      }
      
      // Buscar informações do fluxo
      const flowInfo = await botConversaService.getWelcomeFlowInfo(account);
      
      // Buscar dados do CRM para comparação
      const teams = await storage.getTeams();
      const leads = await storage.getLeads();
      const conversations = await storage.getConversations();
      
      // Análise comparativa
      const analysis = {
        flowInfo,
        crmData: {
          totalTeams: teams.length,
          totalLeads: leads.length,
          totalConversations: conversations.length,
          leadsByStatus: leads.reduce((acc: any, lead) => {
            acc[lead.status] = (acc[lead.status] || 0) + 1;
            return acc;
          }, {}),
          conversationsByStatus: conversations.reduce((acc: any, conv) => {
            acc[conv.status] = (acc[conv.status] || 0) + 1;
            return acc;
          }, {})
        },
        integration: {
          webhookStatus: "active",
          autoRouting: true,
          departmentCoverage: Object.keys(flowInfo.departments).length,
          routingRules: Object.keys(flowInfo.routingRules).length
        },
        recommendations: [
          {
            type: "improvement",
            priority: "high",
            description: "Expandir menu para incluir todos os 9 departamentos",
            currentCoverage: Object.keys(flowInfo.routingRules).length,
            targetCoverage: Object.keys(flowInfo.departments).length
          },
          {
            type: "performance",
            priority: "medium",
            description: "Implementar balanceamento de carga para departamentos com poucos membros",
            affectedDepartments: Object.entries(flowInfo.departments)
              .filter(([, dept]: [string, any]) => dept.members < 2)
              .map(([name]) => name)
          }
        ]
      };
      
      res.json({ 
        success: true,
        account,
        analysis
      });
      
    } catch (error) {
      logger.error("Erro ao analisar fluxo:", error);
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Rotas para Certificações
  app.get("/api/certificacoes", authenticateToken, async (req: any, res) => {
    try {
      const { 
        modalidade, 
        curso, 
        status, 
        categoria, 
        subcategoria, 
        search, 
        dataInicio,
        dataFim,
        page = 1, 
        limit = 50 
      } = req.query;
      
      // Tratar categoria múltipla (ex: "segunda_licenciatura,formacao_pedagogica")
      let categoriaFilter = categoria;
      if (categoria && typeof categoria === 'string' && categoria.includes(',')) {
        // Para múltiplas categorias, vamos buscar cada uma separadamente e combinar
        const categorias = categoria.split(',').map(c => c.trim());
        const results = [];
        
        for (const cat of categorias) {
          const catResult = await storage.getCertifications({
            modalidade,
            curso,
            status,
            categoria: cat,
            subcategoria,
            search,
            dataInicio,
            dataFim,
            page: parseInt(page as string),
            limit: parseInt(limit as string)
          });
          results.push(...catResult.data);
        }
        
        // Remover duplicatas e ordenar
        const uniqueResults = results.filter((item, index, self) => 
          index === self.findIndex(t => t.id === item.id)
        );
        
        const result = {
          data: uniqueResults,
          total: uniqueResults.length,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(uniqueResults.length / parseInt(limit as string))
        };
        
        return res.json(result);
      }
      
      const result = await storage.getCertifications({
        modalidade,
        curso,
        status,
        categoria: categoriaFilter,
        subcategoria,
        search,
        dataInicio,
        dataFim,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      });
      
      res.json(result);
    } catch (error) {
      logger.error("Erro ao buscar certificações:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/certificacoes", authenticateToken, async (req: any, res) => {
    try {
      const validatedData = insertCertificationSchema.parse(req.body);
      
      const certification = await storage.createCertification(validatedData);
      
      res.status(201).json(certification);
    } catch (error) {
      logger.error("Erro ao criar certificação:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/certificacoes/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertCertificationSchema.partial().parse(req.body);
      
      const certification = await storage.updateCertification(id, validatedData);
      
      if (!certification) {
        return res.status(404).json({ message: "Certificação não encontrada" });
      }
      
      res.json(certification);
    } catch (error) {
      logger.error("Erro ao atualizar certificação:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.delete("/api/certificacoes/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const certification = await storage.getCertificationById(id);
      if (!certification) {
        return res.status(404).json({ message: "Certificação não encontrada" });
      }
      
      await storage.deleteCertification(id);
      
      res.json({ message: "Certificação excluída com sucesso" });
    } catch (error) {
      logger.error("Erro ao excluir certificação:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Rotas para cursos pré-cadastrados
  app.get('/api/cursos-pre-cadastrados', authenticateToken, async (req: any, res) => {
    try {
      const { modalidade, categoria, ativo } = req.query;
      const filters: any = {};
      
      if (modalidade) filters.modalidade = modalidade as string;
      if (categoria) filters.categoria = categoria as string;
      if (ativo !== undefined) filters.ativo = ativo === 'true';
      
      const courses = await storage.getPreRegisteredCourses(filters);
      
      res.json(courses);
    } catch (error) {
      logger.error('Erro ao buscar cursos pré-cadastrados:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  app.post('/api/cursos-pre-cadastrados', authenticateToken, async (req: any, res) => {
    try {
      const courseData = req.body;
      const course = await storage.createPreRegisteredCourse(courseData);
      res.json(course);
    } catch (error) {
      logger.error('Erro ao criar curso pré-cadastrado:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  app.get("/api/certificacoes/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const certification = await storage.getCertificationById(id);
      
      if (!certification) {
        return res.status(404).json({ message: "Certificação não encontrada" });
      }
      
      res.json(certification);
    } catch (error) {
      logger.error("Erro ao buscar certificação:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== MATRÍCULAS SIMPLIFICADAS =====

  // Listar matrículas simplificadas
  app.get("/api/simplified-enrollments", authenticateToken, async (req: any, res) => {
    try {
      const { status, tenantId, consultantId } = req.query;
      const filters: any = {};
      
      if (status) filters.status = status as string;
      if (tenantId) filters.tenantId = parseInt(tenantId as string);
      if (consultantId) filters.consultantId = parseInt(consultantId as string);
      
      const enrollments = await storage.getSimplifiedEnrollments(filters);
      res.json(enrollments);
    } catch (error) {
      logger.error("Erro ao buscar matrículas simplificadas:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar matrícula simplificada com integração Asaas
  app.post("/api/simplified-enrollments", authenticateToken, async (req: any, res) => {
    try {
      const enrollmentData = req.body;
      
      // Validar dados obrigatórios
      if (!enrollmentData.studentName || !enrollmentData.studentEmail || !enrollmentData.studentCpf) {
        return res.status(400).json({ message: "Nome, email e CPF são obrigatórios" });
      }

      // Validar curso
      const course = await storage.getPreRegisteredCourseById(enrollmentData.courseId);
      if (!course) {
        return res.status(400).json({ message: "Curso não encontrado" });
      }

      let asaasCustomerId = null;
      let asaasPaymentId = null;
      let paymentUrl = null;
      let enrollmentStatus = 'pending';

      try {
        // 1. Criar cliente no Asaas
        console.log('Criando cliente no Asaas...');
        const customerData = {
          name: enrollmentData.studentName,
          email: enrollmentData.studentEmail,
          cpfCnpj: enrollmentData.studentCpf.replace(/\D/g, ''),
          phone: enrollmentData.studentPhone || undefined,
          mobilePhone: enrollmentData.studentPhone || undefined,
          observations: `Matrícula no curso: ${course.nome}`
        };

        const asaasCustomer = await asaasService.createCustomer(customerData);
        asaasCustomerId = asaasCustomer.id;
        console.log('Cliente criado no Asaas:', asaasCustomerId);

        // 2. Criar cobrança no Asaas
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7); // Vencimento em 7 dias

        const paymentData = {
          customer: asaasCustomerId,
          billingType: enrollmentData.paymentMethod as 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'DEBIT_CARD',
          value: enrollmentData.amount / 100, // Converter centavos para reais
          dueDate: dueDate.toISOString().split('T')[0],
          description: `Matrícula no curso ${course.nome} - ${course.modalidade}`,
          externalReference: `MATRICULA_${Date.now()}`,
          installmentCount: enrollmentData.installments || 1
        };

        const asaasPayment = await asaasService.createPayment(paymentData);
        asaasPaymentId = asaasPayment.id;
        paymentUrl = asaasPayment.invoiceUrl || asaasPayment.bankSlipUrl;
        enrollmentStatus = 'waiting_payment';
        console.log('Cobrança criada no Asaas:', asaasPaymentId);

      } catch (asaasError) {
        logger.error("Erro na integração com Asaas:", asaasError);
        // Continuar mesmo se falhar no Asaas, mas registrar o erro
      }

      // 3. Criar matrícula no banco local
      const enrollment = await storage.createSimplifiedEnrollment({
        ...enrollmentData,
        asaasCustomerId,
        asaasPaymentId,
        paymentUrl,
        status: enrollmentStatus,
        externalReference: `MATRICULA_${Date.now()}`
      });

      // 4. Criar usuário aluno se integração com Asaas foi bem-sucedida
      if (asaasCustomerId && enrollmentStatus === 'waiting_payment') {
        try {
          const existingUser = await storage.getUserByEmail(enrollment.studentEmail);
          if (!existingUser) {
            // Criar usuário aluno para acesso ao portal
            const hashedPassword = await bcrypt.hash(enrollment.studentCpf.replace(/\D/g, ''), 10);
            const newUser = await storage.createUser({
              username: enrollment.studentEmail,
              email: enrollment.studentEmail,
              password: hashedPassword,
              role: 'aluno',
              name: enrollment.studentName,
              cpf: enrollment.studentCpf,
              telefone: enrollment.studentPhone || '',
              isActive: true
            });

            // Atualizar matrícula com ID do usuário
            await storage.updateSimplifiedEnrollment(enrollment.id, {
              studentId: newUser.id
            });

            // Criar vínculo com o curso para acesso imediato
            if (newUser.id && enrollment.courseId) {
              await storage.createStudentEnrollment({
                userId: newUser.id,
                courseId: enrollment.courseId,
                dataMatricula: new Date(),
                status: 'ativa',
                progresso: 0,
                horasCompletadas: 0
              });
            }

            console.log('Usuário aluno criado:', newUser.id);
          }
        } catch (userError) {
          logger.error("Erro ao criar usuário:", userError);
          // Não bloquear o processo se falhar criação do usuário
        }
      }
      
      res.status(201).json({
        ...enrollment,
        course: {
          nome: course.nome,
          modalidade: course.modalidade,
          categoria: course.categoria,
          preco: course.preco
        },
        message: asaasCustomerId 
          ? "Matrícula criada com sucesso! Link de pagamento gerado." 
          : "Matrícula criada. Integração com Asaas pendente."
      });
    } catch (error) {
      logger.error("Erro ao criar matrícula simplificada:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Atualizar status da matrícula
  app.patch("/api/simplified-enrollments/:id/status", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({ message: "Status é obrigatório" });
      }

      const enrollment = await storage.updateSimplifiedEnrollment(id, { status });
      
      if (!enrollment) {
        return res.status(404).json({ message: "Matrícula não encontrada" });
      }
      
      res.json(enrollment);
    } catch (error) {
      logger.error("Erro ao atualizar status da matrícula:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar matrícula por ID
  app.get("/api/simplified-enrollments/:id", authenticateToken, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const enrollment = await storage.getSimplifiedEnrollmentById(id);
      
      if (!enrollment) {
        return res.status(404).json({ message: "Matrícula não encontrada" });
      }
      
      res.json(enrollment);
    } catch (error) {
      logger.error("Erro ao buscar matrícula:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== PORTAL DO PROFESSOR =====

  // Autenticação do Professor
  app.post("/api/auth/professor-login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      // Verificar se é professor, conteudista ou coordenador
      if (!['professor', 'conteudista', 'coordenador'].includes(user.role)) {
        return res.status(401).json({ message: "Acesso restrito a professores" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Conta desativada" });
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        professor: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department
        }
      });
    } catch (error) {
      logger.error("Erro no login do professor:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Dashboard do Professor
  app.get("/api/professor/dashboard", authenticateToken, async (req: any, res) => {
    try {
      if (!['professor', 'conteudista', 'coordenador'].includes(req.user.role)) {
        return res.status(403).json({ message: "Acesso negado - apenas professores" });
      }

      // Para este exemplo, retornamos dados mock
      // Em produção, buscar dados reais do banco
      const stats = {
        totalDisciplinas: 3,
        totalConteudos: 24,
        totalAvaliacoes: 8,
        totalAlunos: 156,
        avaliacoesPendentes: 5,
        interacoesRecentes: 23,
      };

      const recentActivities = [
        {
          id: 1,
          type: "avaliacao",
          title: "Nova submissão em Algoritmos I",
          student: "Maria Silva",
          time: "há 5 minutos",
          status: "pendente"
        },
        {
          id: 2,
          type: "conteudo",
          title: "Aula sobre Estruturas de Dados visualizada",
          student: "João Santos",
          time: "há 15 minutos",
          status: "visualizado"
        }
      ];

      res.json({ stats, recentActivities });
    } catch (error) {
      logger.error("Erro ao buscar dashboard do professor:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Disciplinas do Professor
  app.get("/api/professor/subjects", authenticateToken, async (req: any, res) => {
    try {
      if (!['professor', 'conteudista', 'coordenador'].includes(req.user.role)) {
        return res.status(403).json({ message: "Acesso negado - apenas professores" });
      }

      const subjects = await storage.getProfessorSubjects(req.user.id);
      res.json(subjects);
    } catch (error) {
      logger.error("Erro ao buscar disciplinas do professor:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar nova disciplina
  app.post("/api/professor/subjects", authenticateToken, async (req: any, res) => {
    try {
      if (!['coordenador'].includes(req.user.role)) {
        return res.status(403).json({ message: "Acesso negado - apenas coordenadores" });
      }

      const { nome, codigo, descricao, cargaHoraria, area } = req.body;
      const subject = await storage.createSubject({
        nome,
        codigo,
        descricao,
        cargaHoraria,
        area
      });

      res.status(201).json(subject);
    } catch (error) {
      logger.error("Erro ao criar disciplina:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Conteúdos de uma disciplina
  app.get("/api/professor/contents", authenticateToken, async (req: any, res) => {
    try {
      if (!['professor', 'conteudista', 'coordenador'].includes(req.user.role)) {
        return res.status(403).json({ message: "Acesso negado - apenas professores" });
      }

      const { subjectId } = req.query;
      if (!subjectId) {
        return res.status(400).json({ message: "ID da disciplina é obrigatório" });
      }

      const contents = await storage.getSubjectContents(parseInt(subjectId as string), req.user.id);
      res.json(contents);
    } catch (error) {
      logger.error("Erro ao buscar conteúdos:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar novo conteúdo
  app.post("/api/professor/contents", authenticateToken, async (req: any, res) => {
    try {
      if (!['professor', 'conteudista', 'coordenador'].includes(req.user.role)) {
        return res.status(403).json({ message: "Acesso negado - apenas professores" });
      }

      const { subjectId, titulo, tipo, conteudo, descricao, ordem } = req.body;
      const content = await storage.createSubjectContent({
        subjectId,
        professorId: req.user.id,
        titulo,
        tipo,
        conteudo,
        descricao,
        ordem
      });

      res.status(201).json(content);
    } catch (error) {
      logger.error("Erro ao criar conteúdo:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Avaliações do Professor
  app.get("/api/professor/evaluations", authenticateToken, async (req: any, res) => {
    try {
      if (!['professor', 'conteudista', 'coordenador'].includes(req.user.role)) {
        return res.status(403).json({ message: "Acesso negado - apenas professores" });
      }

      const { subjectId } = req.query;
      const evaluations = await storage.getProfessorEvaluations(
        req.user.id, 
        subjectId ? parseInt(subjectId as string) : undefined
      );

      res.json(evaluations);
    } catch (error) {
      logger.error("Erro ao buscar avaliações:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar nova avaliação
  app.post("/api/professor/evaluations", authenticateToken, async (req: any, res) => {
    try {
      if (!['professor', 'conteudista', 'coordenador'].includes(req.user.role)) {
        return res.status(403).json({ message: "Acesso negado - apenas professores" });
      }

      const evaluationData = {
        ...req.body,
        professorId: req.user.id
      };

      const evaluation = await storage.createProfessorEvaluation(evaluationData);
      res.status(201).json(evaluation);
    } catch (error) {
      logger.error("Erro ao criar avaliação:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Questões de uma avaliação
  app.get("/api/professor/evaluations/:id/questions", authenticateToken, async (req: any, res) => {
    try {
      if (!['professor', 'conteudista', 'coordenador'].includes(req.user.role)) {
        return res.status(403).json({ message: "Acesso negado - apenas professores" });
      }

      const { id } = req.params;
      const questions = await storage.getEvaluationQuestions(parseInt(id));
      res.json(questions);
    } catch (error) {
      logger.error("Erro ao buscar questões:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Adicionar questão à avaliação
  app.post("/api/professor/evaluations/:id/questions", authenticateToken, async (req: any, res) => {
    try {
      if (!['professor', 'conteudista', 'coordenador'].includes(req.user.role)) {
        return res.status(403).json({ message: "Acesso negado - apenas professores" });
      }

      const { id } = req.params;
      const questionData = {
        ...req.body,
        evaluationId: parseInt(id)
      };

      const question = await storage.createEvaluationQuestion(questionData);
      res.status(201).json(question);
    } catch (error) {
      logger.error("Erro ao criar questão:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Submissões de uma avaliação
  app.get("/api/professor/evaluations/:id/submissions", authenticateToken, async (req: any, res) => {
    try {
      if (!['professor', 'conteudista', 'coordenador'].includes(req.user.role)) {
        return res.status(403).json({ message: "Acesso negado - apenas professores" });
      }

      const { id } = req.params;
      const submissions = await storage.getEvaluationSubmissions(parseInt(id));
      res.json(submissions);
    } catch (error) {
      logger.error("Erro ao buscar submissões:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== SISTEMA ACADÊMICO - CERTIFICADOS PÓS =====

  // Cursos Acadêmicos
  app.get("/api/academic/courses", authenticateToken, async (req: any, res) => {
    try {
      const { categoria, status } = req.query;
      const courses = await storage.getAcademicCourses({ categoria, status });
      res.json(courses);
    } catch (error) {
      logger.error("Erro ao buscar cursos acadêmicos:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/academic/courses", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const courseData = insertAcademicCourseSchema.parse(req.body);
      const course = await storage.createAcademicCourse(courseData);
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      logger.error("Erro ao criar curso acadêmico:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/academic/courses/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const { id } = req.params;
      const course = await storage.updateAcademicCourse(parseInt(id), req.body);
      if (!course) {
        return res.status(404).json({ message: "Curso não encontrado" });
      }
      res.json(course);
    } catch (error) {
      logger.error("Erro ao atualizar curso acadêmico:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.delete("/api/academic/courses/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const { id } = req.params;
      await storage.deleteAcademicCourse(parseInt(id));
      res.status(204).send();
    } catch (error) {
      logger.error("Erro ao deletar curso acadêmico:", error);
      
      // Se o erro contém informação sobre alunos matriculados, retornar erro 400 com mensagem amigável
      if (error instanceof Error && error.message.includes('aluno(s) matriculado(s)')) {
        return res.status(400).json({ message: error.message });
      }
      
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Professores Acadêmicos
  app.get("/api/academic/professors", authenticateToken, async (req: any, res) => {
    try {
      const professors = await storage.getAcademicProfessors();
      res.json(professors);
    } catch (error) {
      logger.error("Erro ao buscar professores acadêmicos:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/academic/professors", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const professorData = insertAcademicProfessorSchema.parse(req.body);
      const professor = await storage.createAcademicProfessor(professorData);
      res.status(201).json(professor);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      logger.error("Erro ao criar professor acadêmico:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/academic/professors/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const { id } = req.params;
      const professor = await storage.updateAcademicProfessor(parseInt(id), req.body);
      if (!professor) {
        return res.status(404).json({ message: "Professor não encontrado" });
      }
      res.json(professor);
    } catch (error) {
      logger.error("Erro ao atualizar professor acadêmico:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Disciplinas Acadêmicas
  app.get("/api/academic/disciplines", authenticateToken, async (req: any, res) => {
    try {
      const disciplines = await storage.getAcademicDisciplines();
      res.json(disciplines);
    } catch (error) {
      logger.error("Erro ao buscar disciplinas acadêmicas:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/academic/disciplines", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const disciplineData = insertAcademicDisciplineSchema.parse(req.body);
      const discipline = await storage.createAcademicDiscipline(disciplineData);
      res.status(201).json(discipline);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      logger.error("Erro ao criar disciplina acadêmica:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/academic/disciplines/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const { id } = req.params;
      const discipline = await storage.updateAcademicDiscipline(parseInt(id), req.body);
      if (!discipline) {
        return res.status(404).json({ message: "Disciplina não encontrada" });
      }
      res.json(discipline);
    } catch (error) {
      logger.error("Erro ao atualizar disciplina acadêmica:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.delete("/api/academic/disciplines/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const { id } = req.params;
      await storage.deleteAcademicDiscipline(parseInt(id));
      res.json({ message: "Disciplina removida com sucesso" });
    } catch (error) {
      logger.error("Erro ao remover disciplina acadêmica:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Relacionamento Curso-Disciplina
  app.get("/api/academic/courses/:courseId/disciplines", authenticateToken, async (req: any, res) => {
    try {
      const { courseId } = req.params;
      const disciplines = await storage.getCourseDisciplines(parseInt(courseId));
      res.json(disciplines);
    } catch (error) {
      logger.error("Erro ao buscar disciplinas do curso:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/academic/courses/:courseId/disciplines", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const { courseId } = req.params;
      const { disciplineIds } = req.body;
      
      if (!Array.isArray(disciplineIds)) {
        return res.status(400).json({ message: "disciplineIds deve ser um array" });
      }

      await storage.addCourseDisciplines(parseInt(courseId), disciplineIds);
      res.json({ message: "Disciplinas adicionadas ao curso com sucesso" });
    } catch (error) {
      logger.error("Erro ao adicionar disciplinas ao curso:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.delete("/api/academic/courses/:courseId/disciplines", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const { courseId } = req.params;
      const { disciplineIds } = req.body;
      
      await storage.removeCourseDisciplines(parseInt(courseId), disciplineIds);
      res.json({ message: "Disciplinas removidas do curso com sucesso" });
    } catch (error) {
      logger.error("Erro ao remover disciplinas do curso:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Alunos Acadêmicos
  app.get("/api/academic/students", authenticateToken, async (req: any, res) => {
    try {
      const { courseId, status } = req.query;
      const students = await storage.getAcademicStudents({ 
        courseId: courseId ? parseInt(courseId as string) : undefined, 
        status: status as string 
      });
      res.json(students);
    } catch (error) {
      logger.error("Erro ao buscar alunos acadêmicos:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/academic/students", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const studentData = insertAcademicStudentSchema.parse(req.body);
      const student = await storage.createAcademicStudent(studentData);
      res.status(201).json(student);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      logger.error("Erro ao criar aluno acadêmico:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/academic/students/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const { id } = req.params;
      const student = await storage.updateAcademicStudent(parseInt(id), req.body);
      if (!student) {
        return res.status(404).json({ message: "Aluno não encontrado" });
      }
      res.json(student);
    } catch (error) {
      logger.error("Erro ao atualizar aluno acadêmico:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Notas Acadêmicas
  app.get("/api/academic/grades", authenticateToken, async (req: any, res) => {
    try {
      const { studentId, disciplineId } = req.query;
      const grades = await storage.getAcademicGrades(
        studentId ? parseInt(studentId as string) : undefined,
        disciplineId ? parseInt(disciplineId as string) : undefined
      );
      res.json(grades);
    } catch (error) {
      logger.error("Erro ao buscar notas acadêmicas:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/academic/grades", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const gradeData = insertAcademicGradeSchema.parse(req.body);
      const grade = await storage.createAcademicGrade(gradeData);
      res.status(201).json(grade);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      logger.error("Erro ao criar nota acadêmica:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/academic/grades/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const { id } = req.params;
      const grade = await storage.updateAcademicGrade(parseInt(id), req.body);
      if (!grade) {
        return res.status(404).json({ message: "Nota não encontrada" });
      }
      res.json(grade);
    } catch (error) {
      logger.error("Erro ao atualizar nota acadêmica:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Certificados Acadêmicos
  app.get("/api/academic/certificates", authenticateToken, async (req: any, res) => {
    try {
      const { studentId, courseId, status } = req.query;
      const certificates = await storage.getAcademicCertificates({
        studentId: studentId ? parseInt(studentId as string) : undefined,
        courseId: courseId ? parseInt(courseId as string) : undefined,
        status: status as string
      });
      res.json(certificates);
    } catch (error) {
      logger.error("Erro ao buscar certificados acadêmicos:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/academic/certificates", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const { studentName, studentCpf, courseId, templateId, observacoes, status = 'solicitado' } = req.body;
      
      if (!studentName || !courseId || !templateId) {
        return res.status(400).json({ 
          message: "Nome do aluno, curso e modelo de certificado são obrigatórios",
          missingFields: {
            studentName: !studentName,
            courseId: !courseId,
            templateId: !templateId
          }
        });
      }

      // 1. Verificar se o curso existe e buscar seus dados completos
      const courseData = await storage.getAcademicCourseById(parseInt(courseId));
      if (!courseData) {
        return res.status(404).json({ message: "Curso não encontrado" });
      }

      // 2. Verificar se o template existe
      const templateData = await storage.getCertificateTemplateById(parseInt(templateId));
      if (!templateData) {
        return res.status(404).json({ message: "Modelo de certificado não encontrado" });
      }

      // 3. Verificar se já existe aluno acadêmico com este nome/CPF
      let existingStudent = await storage.getAcademicStudentByNameOrCpf(studentName, studentCpf);
      
      // 4. Se não existe, criar novo aluno acadêmico
      if (!existingStudent) {
        const newStudentData = {
          nome: studentName,
          email: `${studentName.toLowerCase().replace(/\s+/g, '.')}@temporario.edu.br`,
          cpf: studentCpf || '',
          courseId: parseInt(courseId),
          status: 'cursando'
        };
        existingStudent = await storage.createAcademicStudent(newStudentData);
      }

      // 5. Criar certificado acadêmico com dados completos
      const certificateData = {
        studentId: existingStudent.id,
        courseId: parseInt(courseId),
        templateId: parseInt(templateId),
        observacoes: observacoes || '',
        status: status,
        dataSolicitacao: new Date(),
        solicitadoPor: req.user.id
      };

      const certificate = await storage.createAcademicCertificate(certificateData);
      console.log(`✅ Certificado acadêmico criado: ID ${certificate.id} para ${studentName}`);
      
      res.status(201).json(certificate);
    } catch (error) {
      logger.error("Erro ao criar certificado acadêmico:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor", 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      });
    }
  });

  app.put("/api/academic/certificates/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const { id } = req.params;
      const certificate = await storage.updateAcademicCertificate(parseInt(id), req.body);
      if (!certificate) {
        return res.status(404).json({ message: "Certificado não encontrado" });
      }
      res.json(certificate);
    } catch (error) {
      logger.error("Erro ao atualizar certificado acadêmico:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Emitir certificado acadêmico
  app.post("/api/academic/certificates/:id/issue", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const { id } = req.params;
      const certificate = await storage.issueAcademicCertificate(parseInt(id), req.user.id);
      if (!certificate) {
        return res.status(404).json({ message: "Certificado não encontrado" });
      }
      res.json(certificate);
    } catch (error) {
      logger.error("Erro ao emitir certificado acadêmico:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== MODELOS DE CERTIFICADOS =====
  
  // Buscar modelos de certificados
  app.get("/api/certificate-templates", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const { categoria, tipo, isActive } = req.query;
      const filters: any = {};
      
      if (categoria) filters.categoria = categoria;
      if (tipo) filters.tipo = tipo;
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const templates = await storage.getCertificateTemplates(filters);
      res.json(templates);
    } catch (error) {
      logger.error("Erro ao buscar modelos de certificados:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar modelo específico
  app.get("/api/certificate-templates/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const { id } = req.params;
      const template = await storage.getCertificateTemplateById(parseInt(id));
      if (!template) {
        return res.status(404).json({ message: "Modelo não encontrado" });
      }
      res.json(template);
    } catch (error) {
      logger.error("Erro ao buscar modelo:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar modelo de certificado
  app.post("/api/certificate-templates", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const templateData = insertCertificateTemplateSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const template = await storage.createCertificateTemplate(templateData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      logger.error("Erro ao criar modelo de certificado:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Atualizar modelo de certificado
  app.put("/api/certificate-templates/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const { id } = req.params;
      const template = await storage.updateCertificateTemplate(parseInt(id), req.body);
      if (!template) {
        return res.status(404).json({ message: "Modelo não encontrado" });
      }
      res.json(template);
    } catch (error) {
      logger.error("Erro ao atualizar modelo:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Deletar modelo de certificado
  app.delete("/api/certificate-templates/:id", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const { id } = req.params;
      await storage.deleteCertificateTemplate(parseInt(id));
      res.status(204).send();
    } catch (error) {
      logger.error("Erro ao deletar modelo:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== GERAÇÃO DE CERTIFICADOS PDF =====
  
  // Gerar PDF de certificado com orientação paisagem
  app.post("/api/certificates/:certificateId/generate-pdf/:templateId", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const { certificateId, templateId } = req.params;
      
      console.log(`🎓 Iniciando geração de PDF - Certificado: ${certificateId}, Template: ${templateId}`);
      
      // Gerar PDF usando o PDFService
      const pdfBuffer = await pdfService.generateCertificatePDF(
        parseInt(certificateId), 
        parseInt(templateId)
      );

      // Configurar headers para download do PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="certificado-${certificateId}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      console.log(`✅ PDF gerado com sucesso - Tamanho: ${pdfBuffer.length} bytes`);
      
      res.send(pdfBuffer);
    } catch (error) {
      logger.error("Erro ao gerar PDF do certificado:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor", 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      });
    }
  });

  // Preview de certificado em HTML para visualização antes de gerar PDF
  app.get("/api/certificates/:certificateId/preview/:templateId", authenticateToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Acesso negado - apenas administradores" });
      }

      const { certificateId, templateId } = req.params;
      
      // Buscar dados do certificado
      const certificate = await storage.getAcademicCertificateById(parseInt(certificateId));
      if (!certificate) {
        return res.status(404).json({ message: "Certificado não encontrado" });
      }

      // Buscar template
      const template = await storage.getCertificateTemplateById(parseInt(templateId));
      if (!template) {
        return res.status(404).json({ message: "Template não encontrado" });
      }

      // Buscar dados do aluno e curso
      const student = await storage.getAcademicStudentById(certificate.studentId);
      const course = await storage.getAcademicCourseById(certificate.courseId);

      if (!student || !course) {
        return res.status(404).json({ message: "Dados do aluno ou curso não encontrados" });
      }

      // Preparar dados para substituição
      const certificateData = {
        nomeAluno: student.nome,
        cpfAluno: student.cpf,
        nomeCurso: course.nome,
        areaCurso: course.area || 'Educação',
        cargaHoraria: String(course.cargaHoraria),
        dataInicio: course.dataInicio || new Date().toLocaleDateString('pt-BR'),
        dataConclusao: new Date().toLocaleDateString('pt-BR'),
        dataEmissao: certificate.dataEmissao || new Date().toLocaleDateString('pt-BR'),
        numeroRegistro: certificate.numeroRegistro || `CERT-${Date.now()}`,
        livro: certificate.livro || '001',
        folha: certificate.folha || String(certificate.id).padStart(3, '0'),
        instituicao: template.instituicaoNome,
        instituicaoEndereco: template.instituicaoEndereco || ''
      };

      // Substituir variáveis no HTML da frente
      let htmlFrente = template.htmlTemplate;
      let htmlVerso = template.templateVerso;
      
      // Substituir variáveis básicas
      Object.entries(certificateData).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlFrente = htmlFrente.replace(regex, String(value));
        htmlVerso = htmlVerso.replace(regex, String(value));
      });

      // HTML completo para preview com orientação paisagem
      const htmlCompleto = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Preview - Certificado ${certificateData.nomeAluno}</title>
          <style>
            @page {
              size: A4 landscape;
              margin: 20mm;
            }
            
            body {
              margin: 0;
              padding: 20px;
              font-family: 'Times New Roman', serif;
              background: #f5f5f5;
            }
            
            .preview-controls {
              background: white;
              padding: 15px;
              border-radius: 8px;
              margin-bottom: 20px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              text-align: center;
            }
            
            .preview-controls button {
              background: #1e40af;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              margin: 0 10px;
              font-size: 14px;
            }
            
            .preview-controls button:hover {
              background: #1d4ed8;
            }
            
            .page-container {
              background: white;
              width: 297mm;
              height: 210mm;
              margin: 20px auto;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
              page-break-after: always;
              position: relative;
              overflow: hidden;
            }
            
            .page-title {
              background: #1e40af;
              color: white;
              text-align: center;
              padding: 10px;
              font-weight: bold;
              font-size: 16px;
              margin-bottom: 20px;
            }
            
            .certificate-content {
              padding: 40px;
              height: calc(100% - 60px);
              box-sizing: border-box;
            }
            
            /* Estilos específicos para o certificado */
            .certificate-front, .certificate-back {
              width: 100%;
              height: 100%;
              font-size: 12pt;
              line-height: 1.4;
            }
            
            @media print {
              body { background: white; }
              .preview-controls { display: none; }
              .page-container { 
                box-shadow: none; 
                margin: 0;
                width: 100%;
                height: 100vh;
              }
              .page-title { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="preview-controls">
            <button onclick="window.print()">🖨️ Imprimir Certificado</button>
            <button onclick="downloadPDF()">📄 Download PDF</button>
            <button onclick="window.close()">✖️ Fechar Preview</button>
          </div>
          
          <!-- PÁGINA 1 - FRENTE DO CERTIFICADO -->
          <div class="page-container">
            <div class="page-title">PÁGINA 1 - FRENTE DO CERTIFICADO (FORMATO PAISAGEM)</div>
            <div class="certificate-content">
              <div class="certificate-front">
                ${htmlFrente}
              </div>
            </div>
          </div>
          
          <!-- PÁGINA 2 - VERSO DO CERTIFICADO (HISTÓRICO) -->
          <div class="page-container">
            <div class="page-title">PÁGINA 2 - VERSO DO CERTIFICADO - HISTÓRICO ESCOLAR (FORMATO PAISAGEM)</div>
            <div class="certificate-content">
              <div class="certificate-back">
                ${htmlVerso}
              </div>
            </div>
          </div>

          <script>
            function downloadPDF() {
              window.open('/api/certificates/${certificateId}/generate-pdf/${templateId}', '_blank');
            }
          </script>
        </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(htmlCompleto);
    } catch (error) {
      logger.error("Erro ao gerar preview:", error);
      res.status(500).json({ 
        message: "Erro interno do servidor", 
        error: error instanceof Error ? error.message : "Erro desconhecido" 
      });
    }
  });

  // ===== MÓDULO DE NEGOCIAÇÕES =====
  
  // Negociações
  app.get("/api/negociacoes", authenticateToken, async (req: any, res) => {
    try {
      const { search, status, dataInicio, dataFim } = req.query;
      const negociacoes = await storage.getNegociacoes({ search, status, dataInicio, dataFim });
      res.json(negociacoes);
    } catch (error) {
      logger.error("Erro ao buscar negociações:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/negociacoes", authenticateToken, async (req: any, res) => {
    try {
      const negociacaoData = insertNegociacaoSchema.parse(req.body);
      const negociacao = await storage.createNegociacao(negociacaoData);
      res.status(201).json(negociacao);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Formatação específica dos erros de validação em português
        const fieldErrors = error.errors.map(err => {
          const field = err.path[0];
          return `${err.message}`;
        });
        
        return res.status(400).json({ 
          message: fieldErrors.length === 1 ? fieldErrors[0] : "Campos obrigatórios em falta",
          details: fieldErrors,
          validation: true
        });
      }
      logger.error("Erro ao criar negociação:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/negociacoes/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const negociacao = await storage.updateNegociacao(parseInt(id), req.body);
      if (!negociacao) {
        return res.status(404).json({ message: "Negociação não encontrada" });
      }
      res.json(negociacao);
    } catch (error) {
      logger.error("Erro ao atualizar negociação:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.delete("/api/negociacoes/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNegociacao(parseInt(id));
      res.status(204).send();
    } catch (error) {
      logger.error("Erro ao deletar negociação:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Negociações Expirados
  app.get("/api/negociacoes-expirados", authenticateToken, async (req: any, res) => {
    try {
      const { search, status, dataInicio, dataFim } = req.query;
      const expirados = await storage.getNegociacoesExpirados({ search, status, dataInicio, dataFim });
      res.json(expirados);
    } catch (error) {
      logger.error("Erro ao buscar negociações expirados:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/negociacoes-expirados", authenticateToken, async (req: any, res) => {
    try {
      // Preencher automaticamente a data da proposta com a data atual
      const dataAtual = new Date().toISOString().split('T')[0];
      const bodyWithDefaults = {
        ...req.body,
        dataProposta: dataAtual
      };
      
      const expiradoData = insertNegociacaoExpiradoSchema.parse(bodyWithDefaults);
      const expirado = await storage.createNegociacaoExpirado(expiradoData);
      res.status(201).json(expirado);
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Formatação específica dos erros de validação em português
        const fieldErrors = error.errors.map(err => {
          const field = err.path[0];
          return `${err.message}`;
        });
        
        return res.status(400).json({ 
          message: fieldErrors.length === 1 ? fieldErrors[0] : "Campos obrigatórios em falta",
          details: fieldErrors,
          validation: true
        });
      }
      logger.error("Erro ao criar negociação expirado:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.put("/api/negociacoes-expirados/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const expirado = await storage.updateNegociacaoExpirado(parseInt(id), req.body);
      if (!expirado) {
        return res.status(404).json({ message: "Negociação expirado não encontrada" });
      }
      res.json(expirado);
    } catch (error) {
      logger.error("Erro ao atualizar negociação expirado:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.delete("/api/negociacoes-expirados/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      await storage.deleteNegociacaoExpirado(parseInt(id));
      res.status(204).send();
    } catch (error) {
      logger.error("Erro ao deletar negociação expirado:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Sincronização automática com Asaas e Certificações
  app.post("/api/negociacoes/sync", authenticateToken, async (req: any, res) => {
    try {
      const result = await storage.syncNegociacoesFromAsaasAndCertificacoes();
      res.json({ 
        message: "Sincronização concluída com sucesso", 
        created: result.created, 
        updated: result.updated 
      });
    } catch (error) {
      logger.error("Erro ao sincronizar negociações:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ENVIOS UNICV =====

  // Buscar envios UNICV
  app.get("/api/envios-unicv", authenticateToken, async (req: any, res) => {
    try {
      const { search, status, categoria } = req.query;
      const envios = await storage.getEnviosUnicv({ search, status, categoria });
      res.json(envios);
    } catch (error) {
      logger.error("Erro ao buscar envios UNICV:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar novo envio UNICV
  app.post("/api/envios-unicv", authenticateToken, async (req: any, res) => {
    try {
      const envioData = insertEnvioUnicvSchema.parse(req.body);
      
      // Corrigir data de envio para evitar problemas de timezone
      if (envioData.dataEnvio) {
        // Garantir que a data seja interpretada como local, não UTC
        const localDate = new Date(envioData.dataEnvio + 'T12:00:00');
        envioData.dataEnvio = localDate.toISOString().split('T')[0];
      }
      
      const envio = await storage.createEnvioUnicv(envioData);
      res.status(201).json(envio);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      logger.error("Erro ao criar envio UNICV:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Atualizar envio UNICV
  app.put("/api/envios-unicv/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Corrigir data de envio para evitar problemas de timezone
      if (updateData.dataEnvio) {
        // Garantir que a data seja interpretada como local, não UTC
        const localDate = new Date(updateData.dataEnvio + 'T12:00:00');
        updateData.dataEnvio = localDate.toISOString().split('T')[0];
      }
      
      const envio = await storage.updateEnvioUnicv(parseInt(id), updateData);
      if (!envio) {
        return res.status(404).json({ message: "Envio UNICV não encontrado" });
      }
      res.json(envio);
    } catch (error) {
      logger.error("Erro ao atualizar envio UNICV:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Deletar envio UNICV
  app.delete("/api/envios-unicv/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteEnvioUnicv(parseInt(id));
      
      if (!deleted) {
        return res.status(404).json({ message: "Envio UNICV não encontrado" });
      }
      
      res.status(204).send();
    } catch (error) {
      logger.error("Erro ao deletar envio UNICV:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar envio UNICV por ID
  app.get("/api/envios-unicv/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const envio = await storage.getEnvioUnicvById(parseInt(id));
      if (!envio) {
        return res.status(404).json({ message: "Envio UNICV não encontrado" });
      }
      res.json(envio);
    } catch (error) {
      logger.error("Erro ao buscar envio UNICV:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // ===== ENVIOS FAMAR =====

  // Buscar envios FAMAR
  app.get("/api/envios-famar", authenticateToken, async (req: any, res) => {
    try {
      const { search, status, categoria } = req.query;
      const envios = await storage.getEnviosFamar({ search, status, categoria });
      res.json(envios);
    } catch (error) {
      logger.error("Erro ao buscar envios FAMAR:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Criar novo envio FAMAR
  app.post("/api/envios-famar", authenticateToken, async (req: any, res) => {
    try {
      const envioData = insertEnvioFamarSchema.parse(req.body);
      
      // Corrigir data de envio para evitar problemas de timezone
      if (envioData.dataEnvio) {
        // Garantir que a data seja interpretada como local, não UTC
        const localDate = new Date(envioData.dataEnvio + 'T12:00:00');
        envioData.dataEnvio = localDate.toISOString().split('T')[0];
      }
      
      const envio = await storage.createEnvioFamar(envioData);
      res.status(201).json(envio);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      logger.error("Erro ao criar envio FAMAR:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Atualizar envio FAMAR
  app.put("/api/envios-famar/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Corrigir data de envio para evitar problemas de timezone
      if (updateData.dataEnvio) {
        // Garantir que a data seja interpretada como local, não UTC
        const localDate = new Date(updateData.dataEnvio + 'T12:00:00');
        updateData.dataEnvio = localDate.toISOString().split('T')[0];
      }
      
      const envio = await storage.updateEnvioFamar(parseInt(id), updateData);
      if (!envio) {
        return res.status(404).json({ message: "Envio FAMAR não encontrado" });
      }
      res.json(envio);
    } catch (error) {
      logger.error("Erro ao atualizar envio FAMAR:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Deletar envio FAMAR
  app.delete("/api/envios-famar/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteEnvioFamar(parseInt(id));
      
      if (!deleted) {
        return res.status(404).json({ message: "Envio FAMAR não encontrado" });
      }
      
      res.status(204).send();
    } catch (error) {
      logger.error("Erro ao deletar envio FAMAR:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar envio FAMAR por ID
  app.get("/api/envios-famar/:id", authenticateToken, async (req: any, res) => {
    try {
      const { id } = req.params;
      const envio = await storage.getEnvioFamarById(parseInt(id));
      if (!envio) {
        return res.status(404).json({ message: "Envio FAMAR não encontrado" });
      }
      res.json(envio);
    } catch (error) {
      logger.error("Erro ao buscar envio FAMAR:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Integração com Asaas
  app.use("/api/asaas", asaasRoutes);

  // Rotas de debug/teste
  app.get("/api/health", (req, res) => {
    res.json({ status: "OK", timestamp: new Date().toISOString() });
  });

  app.get("/api/ping", (req, res) => {
    res.json({ message: "pong", server: "running" });
  });

  return httpServer; // return the HTTP server instance
}

// Função auxiliar para cálculos de estatísticas semanais
async function calculateWeeklyStats(activeUsers: any[], storage: any) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);

  let totalPresenceDays = 0;
  let totalPossibleDays = activeUsers.length * 7;
  let totalInactivityCount = 0;

  for (const user of activeUsers) {
    const activities = await storage.getUserActivity(user.id);
    const weekActivities = activities.filter((activity: any) => {
      const activityDate = new Date(activity.timestamp);
      return activityDate >= startDate && activityDate <= endDate;
    });

    // Contar dias únicos com atividade
    const activeDays = new Set(
      weekActivities.map((activity: any) => 
        new Date(activity.timestamp).toISOString().split('T')[0]
      )
    );
    
    totalPresenceDays += activeDays.size;
    
    // Contar inatividades
    totalInactivityCount += weekActivities.filter((activity: any) => 
      activity.action === 'inactivity_detected' || activity.action === 'away'
    ).length;
  }

  const attendanceRate = totalPossibleDays > 0 ? Math.round((totalPresenceDays / totalPossibleDays) * 100) : 0;
  
  // Calcular tempo médio diário da semana
  let totalWeekMinutes = 0;
  let daysWithActivity = 0;

  for (const user of activeUsers) {
    const activities = await storage.getUserActivity(user.id);
    const weekActivities = activities.filter((activity: any) => {
      const activityDate = new Date(activity.timestamp);
      return activityDate >= startDate && activityDate <= endDate;
    });

    // Agrupar por data
    const dailyActivities = weekActivities.reduce((acc: any, activity: any) => {
      const date = new Date(activity.timestamp).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(activity);
      return acc;
    }, {});

    // Calcular tempo online por dia
    Object.values(dailyActivities).forEach((dayActivities: any) => {
      const loginActivity = dayActivities.find((a: any) => a.action === 'login');
      const logoutActivity = dayActivities.find((a: any) => a.action === 'logout');
      
      if (loginActivity) {
        const endTime = logoutActivity ? new Date(logoutActivity.timestamp) : new Date();
        const startTime = new Date(loginActivity.timestamp);
        const minutes = Math.max(0, (endTime.getTime() - startTime.getTime()) / (1000 * 60));
        totalWeekMinutes += minutes;
        daysWithActivity++;
      }
    });
  }

  const averageDailyMinutes = daysWithActivity > 0 ? totalWeekMinutes / daysWithActivity : 0;
  const averageDailyTime = `${Math.floor(averageDailyMinutes / 60)}h ${Math.floor(averageDailyMinutes % 60)}m`;

  return {
    attendanceRate,
    averageDailyTime,
    totalInactivityCount
  };
}

