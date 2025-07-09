import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketServer } from "socket.io";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { insertUserSchema, insertRegistrationTokenSchema, insertCertificationSchema, insertStudentEnrollmentSchema, insertStudentDocumentSchema, insertStudentPaymentSchema } from "@shared/schema";
import { z } from "zod";
import { botConversaService, type BotConversaWebhookData } from "./services/botconversa";

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";

// Middleware para validar JWT
const authenticateToken = async (req: any, res: any, next: any) => {
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
    req.user = user;
    next();
  } catch (error) {
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
  cpf: z.string().min(11, "CPF é obrigatório").max(14, "CPF inválido"),
  dataNascimento: z.string().min(1, "Data de nascimento é obrigatória"),
});

// Schema para registro
const registerSchema = insertUserSchema.extend({
  token: z.string().min(1, "Token de registro é obrigatório"),
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
      console.error("Erro no login:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Registro
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, email, name, role, token, companyAccount, department } = registerSchema.parse(req.body);
      
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
        role: role || "agent",
        companyAccount,
        department
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
      console.error("Erro no registro:", error);
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

  // Login para Portal do Aluno (usando CPF e data de nascimento)
  app.post("/api/auth/student-login", async (req, res) => {
    try {
      const { cpf, dataNascimento } = studentLoginSchema.parse(req.body);
      
      // Buscar aluno por CPF
      const student = await storage.getUserByCpf(cpf);
      if (!student || student.role !== 'aluno') {
        return res.status(401).json({ message: "Credenciais inválidas ou aluno não encontrado" });
      }

      // Validar data de nascimento (comparar como string no formato YYYY-MM-DD)
      const studentBirthDate = student.dataNascimento?.toISOString().split('T')[0];
      if (studentBirthDate !== dataNascimento) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      if (!student.isActive || !student.matriculaAtiva) {
        return res.status(401).json({ message: "Matrícula inativa ou conta desativada" });
      }

      const token = jwt.sign(
        { userId: student.id, cpf: student.cpf, role: student.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

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
      console.error("Erro no login do aluno:", error);
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
      console.error("Erro ao criar token:", error);
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
      console.error("Erro ao buscar matrículas:", error);
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
      console.error("Erro ao buscar avaliações:", error);
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
      console.error("Erro ao buscar documentos:", error);
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
      console.error("Erro ao enviar documento:", error);
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
      console.error("Erro ao buscar pagamentos:", error);
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
      console.error("Erro ao buscar certificados:", error);
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
      console.error("Erro ao solicitar certificado:", error);
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
      console.error("Erro ao buscar carteirinha:", error);
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
      console.error("Erro ao gerar carteirinha:", error);
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
      console.error("Erro ao validar carteirinha:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Teams
  app.get("/api/teams", authenticateToken, async (req: any, res) => {
    try {
      const teams = await storage.getTeams();
      res.json(teams);
    } catch (error) {
      console.error("Erro ao buscar teams:", error);
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
      console.error("Erro ao criar team:", error);
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
      console.error("Erro ao buscar leads:", error);
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
      console.error("Erro ao criar lead:", error);
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
      console.error("Erro ao buscar conversas:", error);
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
      console.error("Erro ao sincronizar conversas:", error);
      res.status(500).json({ 
        message: "Erro ao sincronizar conversas",
        error: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Atendimentos com paginação
  app.get("/api/atendimentos", authenticateToken, async (req: any, res) => {
    try {
      const { startDate, endDate, status, equipe, companhia, page = 1, limit = 20 } = req.query;
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
        
        // Determinar companhia baseada no campo companyAccount da conversa
        let companhiaAtendimento = conv.companyAccount || 'SUPORTE'; // Default para SUPORTE se não definido
        
        return {
          id: conv.id,
          lead: conv.customerName || conv.customerPhone || `Cliente ${conv.id}`,
          hora: new Date(conv.createdAt).toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          atendente: attendantName,
          equipe: equipe,
          duracao: duracao,
          status: conv.status === 'active' ? 'Em andamento' : 
                 conv.status === 'closed' ? 'Concluído' : 'Pendente',
          resultado: conv.resultado || null,
          companhia: companhiaAtendimento
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
      
      // Filtro por companhia (se fornecido)
      if (companhia && companhia !== 'Todas') {
        filteredAtendimentos = filteredAtendimentos.filter(atendimento => 
          atendimento.companhia === companhia
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
      console.error("Erro ao buscar atendimentos:", error);
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
      console.error("Erro ao buscar dados de filtros do BotConversa:", error);
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
            console.error(`⚠️ Erro na sincronização com BotConversa:`, error);
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
      console.error("Erro ao atualizar status:", error);
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
      console.error("Erro ao atualizar resultado:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Chat interno
  app.get("/api/chats", authenticateToken, async (req: any, res) => {
    try {
      const chats = await storage.getUserChats(req.user.id);
      res.json(chats);
    } catch (error) {
      console.error("Erro ao buscar chats:", error);
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
      console.error("Erro ao criar chat:", error);
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
      console.error("Erro ao buscar mensagens:", error);
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
      console.error("Erro ao criar mensagem:", error);
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
      console.error("Erro ao buscar metas:", error);
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
      console.error("Erro ao criar meta:", error);
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
      console.error("Erro ao buscar atividade:", error);
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
      console.error("Erro ao criar atividade:", error);
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
      console.error("Erro ao criar conversa:", error);
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
      console.error("Erro ao buscar mensagens da conversa:", error);
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
      console.error("Erro ao criar mensagem de atendimento:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/conversations/:conversationId/notes", authenticateToken, async (req: any, res) => {
    try {
      const { conversationId } = req.params;
      const notes = await storage.getConversationNotes(parseInt(conversationId));
      res.json(notes);
    } catch (error) {
      console.error("Erro ao buscar notas da conversa:", error);
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
      console.error("Erro ao criar nota interna:", error);
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
      console.error("Erro ao buscar estatísticas:", error);
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
      console.error("Erro ao buscar métricas de produtividade:", error);
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
      console.error("Erro ao processar webhook Suporte:", error);
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
      console.error("Erro ao processar webhook Comercial:", error);
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
      console.error("Erro ao testar integração:", error);
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
      console.error("Erro na sincronização:", error);
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
      console.error("Erro no diagnóstico:", error);
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
      console.error("Erro ao testar roteamento:", error);
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
      console.error("Erro ao buscar fluxos:", error);
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
      console.error("Erro ao analisar fluxo:", error);
      res.status(500).json({ 
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Rotas para Certificações
  app.get("/api/certificacoes", authenticateToken, async (req: any, res) => {
    try {
      const { modalidade, curso, status, categoria, subcategoria } = req.query;
      
      const certifications = await storage.getCertifications({
        modalidade,
        curso,
        status,
        categoria,
        subcategoria
      });
      
      res.json(certifications);
    } catch (error) {
      console.error("Erro ao buscar certificações:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/certificacoes", authenticateToken, async (req: any, res) => {
    try {
      const validatedData = insertCertificationSchema.parse(req.body);
      
      const certification = await storage.createCertification(validatedData);
      
      res.status(201).json(certification);
    } catch (error) {
      console.error("Erro ao criar certificação:", error);
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
      console.error("Erro ao atualizar certificação:", error);
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
      console.error("Erro ao excluir certificação:", error);
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
      console.error('Erro ao buscar cursos pré-cadastrados:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  app.post('/api/cursos-pre-cadastrados', authenticateToken, async (req: any, res) => {
    try {
      const courseData = req.body;
      const course = await storage.createPreRegisteredCourse(courseData);
      res.json(course);
    } catch (error) {
      console.error('Erro ao criar curso pré-cadastrado:', error);
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
      console.error("Erro ao buscar certificação:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  return httpServer;
}
