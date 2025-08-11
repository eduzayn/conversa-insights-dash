import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketServer } from "socket.io";
import { setupVite, serveStatic } from "./config/vite";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "./lib/storage";
import { logger } from "./utils/logger";
import { sql, eq, inArray } from "drizzle-orm";
import { db } from "./config/db";
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
  insertEnvioFamarSchema,
  insertCertificacaoFadycSchema
} from "@shared/schema";
import { z } from "zod";
import { UnifiedAsaasService } from "./services/unified-asaas-service";
import asaasRoutes from "./routes/asaas-routes";
import { v4 as uuidv4 } from 'uuid';
import { PDFService } from './services/pdfService';

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
  cpf: z.string().min(11, "CPF deve ter pelo menos 11 dígitos").max(14, "CPF inválido")
});

// Schema para login do professor
const professorLoginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);
  const io = new SocketServer(server, {
    cors: {
      origin: process.env.NODE_ENV === "development" ? "http://localhost:80" : false,
      methods: ["GET", "POST"]
    }
  });

  // Middlewares globais
  app.use(rateLimiter());

  // Health checks
  app.get('/health', healthCheck);
  app.get('/api/health', healthCheck);

  // ===== ENDPOINTS DE NEGOCIAÇÕES =====
  
  // Buscar negociações
  app.get("/api/negociacoes", async (req, res) => {
    try {
      const { search, status, dataInicio, dataFim } = req.query;
      const filters = {
        search: search as string,
        status: status as string,
        dataInicio: dataInicio as string,
        dataFim: dataFim as string
      };
      
      const negociacoes = await storage.getNegociacoes(filters);
      res.json(negociacoes);
    } catch (error) {
      logger.error("Erro ao buscar negociações:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar negociações expiradas
  app.get("/api/negociacoes-expirados", async (req, res) => {
    try {
      const { search, status, dataInicio, dataFim } = req.query;
      const filters = {
        search: search as string,
        status: status as string,
        dataInicio: dataInicio as string,
        dataFim: dataFim as string
      };
      
      const expirados = await storage.getNegociacoesExpirados(filters);
      res.json(expirados);
    } catch (error) {
      logger.error("Erro ao buscar negociações expiradas:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar quitações
  app.get("/api/quitacoes", async (req, res) => {
    try {
      const { search, status, dataInicio, dataFim } = req.query;
      const filters = {
        search: search as string,
        status: status as string,
        dataInicio: dataInicio as string,
        dataFim: dataFim as string
      };
      
      const quitacoes = await storage.getQuitacoes(filters);
      res.json(quitacoes);
    } catch (error) {
      logger.error("Erro ao buscar quitações:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Buscar certificações FADYC
  app.get("/api/certificacoes-fadyc", async (req, res) => {
    try {
      const { categoria, status, search } = req.query;
      const filters = {
        categoria: categoria as string,
        status: status as string,
        search: search as string
      };
      
      const certificacoes = await storage.getCertificacoesFadyc(filters);
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
      const id = parseInt(req.params.id);
      const certificacao = await storage.updateCertificacaoFadyc(id, req.body);
      
      if (!certificacao) {
        return res.status(404).json({ message: "Certificação não encontrada" });
      }
      
      res.json(certificacao);
    } catch (error) {
      logger.error("Erro ao atualizar certificação FADYC:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Deletar certificação FADYC
  app.delete("/api/certificacoes-fadyc/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteCertificacaoFadyc(id);
      
      if (!success) {
        return res.status(404).json({ message: "Certificação não encontrada" });
      }
      
      res.json({ message: "Certificação deletada com sucesso" });
    } catch (error) {
      logger.error("Erro ao deletar certificação FADYC:", error);
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

      const token = generateToken(user.id.toString());
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
      const token = generateToken(professor.id.toString());
      
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
      const token = generateToken(student.id.toString());
      
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

      const token = generateToken(user.id.toString());
      
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
  app.post("/api/admin/registration-token", authenticateToken, async (req: any, res) => {
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

  // ===== CERTIFICAÇÕES =====
  
  // Endpoint para buscar certificações
  app.get("/api/certificacoes", authenticateToken, async (req: any, res) => {
    try {
      const { 
        categoria, 
        status, 
        search, 
        page = 1, 
        limit = 50,
        dataInicio,
        dataFim,
        tipoData
      } = req.query;
      
      const filters = {
        categoria: categoria !== 'todos' ? categoria : undefined,
        status: status !== 'todos' ? status : undefined, 
        search: search || undefined,
        page: parseInt(page),
        limit: parseInt(limit),
        dataInicio,
        dataFim,
        tipoData
      };
      
      const result = await storage.getCertifications(filters);
      res.json(result);
    } catch (error) {
      logger.error("Erro ao buscar certificações:", error);
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
      const { 
        page = 1, 
        limit = 20, 
        status, 
        atendente, 
        equipe, 
        dataInicio, 
        dataFim 
      } = req.query;
      
      const currentPage = parseInt(page);
      const pageSize = parseInt(limit);
      
      // Buscar conversas do banco
      let conversations = await storage.getConversations();
      
      // Se não há conversas do sistema, retornar dados vazios
      if (conversations.length === 0) {
        return res.json({
          data: [],
          pagination: {
            page: currentPage,
            limit: pageSize,
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
      
      // Filtro por atendente
      if (atendente && atendente !== 'Todos') {
        filteredAtendimentos = filteredAtendimentos.filter(atendimento => 
          atendimento.atendente === atendente
        );
      }
      
      // Filtro por equipe
      if (equipe && equipe !== 'Todos') {
        filteredAtendimentos = filteredAtendimentos.filter(atendimento => 
          atendimento.equipe === equipe
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

  // Socket.io para notificações em tempo real
  io.on('connection', (socket) => {
    console.log('Novo usuário conectado:', socket.id);
    
    // Envio de mensagens entre usuários
    socket.on('send_message', (data) => {
      socket.broadcast.emit('receive_message', data);
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

  // ===== SETUP DO FRONTEND =====
  
  // Adicionar endpoint de teste simples antes do Vite
  app.get('/test', (req, res) => {
    res.json({ message: 'Servidor funcionando!', timestamp: new Date().toISOString() });
  });
  
  // Sempre usar Vite no desenvolvimento do Replit  
  try {
    await setupVite(app, server);
  } catch (error) {
    console.error('Erro ao configurar Vite:', error);
    // Fallback: servir arquivos estáticos se Vite falhar
    app.get('*', (req, res) => {
      res.status(200).send('Sistema temporariamente indisponível. Reiniciando...');
    });
  }

  // ===== HANDLERS DE ERRO =====
  
  // Handler para rotas não encontradas
  app.use(notFoundHandler);

  // Handler global de erros
  app.use(globalErrorHandler);

  return server;
}