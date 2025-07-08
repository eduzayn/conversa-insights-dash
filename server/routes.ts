import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketServer } from "socket.io";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { insertUserSchema, insertRegistrationTokenSchema } from "@shared/schema";
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

// Schema para registro
const registerSchema = insertUserSchema.extend({
  token: z.string().min(1, "Token de registro é obrigatório"),
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
          role: user.role
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
      const { username, password, email, name, role, token } = registerSchema.parse(req.body);
      
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
        role: role || "agent"
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
          role: newUser.role
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
        role: req.user.role
      }
    });
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

  return httpServer;
}
