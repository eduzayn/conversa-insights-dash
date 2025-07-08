import { 
  users, 
  registrationTokens,
  teams,
  teamMembers,
  chats,
  chatParticipants,
  messages,
  leads,
  conversations,
  attendanceMessages,
  internalNotes,
  goals,
  goalProgress,
  userActivity,
  certifications,
  type User, 
  type InsertUser,
  type RegistrationToken,
  type InsertRegistrationToken,
  type Team,
  type InsertTeam,
  type Chat,
  type InsertChat,
  type Message,
  type InsertMessage,
  type Lead,
  type InsertLead,
  type Conversation,
  type InsertConversation,
  type AttendanceMessage,
  type InsertAttendanceMessage,
  type InternalNote,
  type InsertInternalNote,
  type Goal,
  type InsertGoal,
  type UserActivity,
  type InsertUserActivity,
  type Certification,
  type InsertCertification
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, like, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Registration Tokens
  getRegistrationToken(token: string): Promise<RegistrationToken | undefined>;
  createRegistrationToken(token: InsertRegistrationToken): Promise<RegistrationToken>;
  markTokenAsUsed(token: string, userId: number): Promise<void>;
  
  // Teams
  getTeams(): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  getTeamMembers(teamId: number): Promise<User[]>;
  addTeamMember(teamId: number, userId: number, role?: string): Promise<void>;
  
  // Chats
  getUserChats(userId: number): Promise<Chat[]>;
  createChat(chat: InsertChat): Promise<Chat>;
  getChatMessages(chatId: number, limit?: number, offset?: number): Promise<Message[]>;
  addChatParticipant(chatId: number, userId: number): Promise<void>;
  
  // Messages
  createMessage(message: InsertMessage): Promise<Message>;
  updateMessage(id: number, content: string): Promise<Message | undefined>;
  deleteMessage(id: number): Promise<void>;
  
  // Leads
  getLeads(filters?: { assignedTo?: number; teamId?: number; status?: string }): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<Lead>): Promise<Lead | undefined>;
  
  // Conversations
  getConversations(filters?: { attendantId?: number; status?: string }): Promise<Conversation[]>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, conversation: Partial<Conversation>): Promise<Conversation | undefined>;
  
  // Attendance Messages
  getConversationMessages(conversationId: number, limit?: number, offset?: number): Promise<AttendanceMessage[]>;
  createAttendanceMessage(message: InsertAttendanceMessage): Promise<AttendanceMessage>;
  markMessagesAsRead(conversationId: number, userId: number): Promise<void>;
  
  // Internal Notes
  getConversationNotes(conversationId: number): Promise<InternalNote[]>;
  createInternalNote(note: InsertInternalNote): Promise<InternalNote>;
  
  // Goals
  getGoals(filters?: { type?: string; teamId?: number; userId?: number }): Promise<Goal[]>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goal: Partial<Goal>): Promise<Goal | undefined>;
  
  // User Activity
  getUserActivity(userId: number, date?: string): Promise<UserActivity[]>;
  createUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
  updateUserActivity(id: number, activity: Partial<UserActivity>): Promise<UserActivity | undefined>;
  
  // Certifications
  getCertifications(filters?: { modalidade?: string; curso?: string; status?: string; categoria?: string }): Promise<Certification[]>;
  createCertification(certification: InsertCertification): Promise<Certification>;
  updateCertification(id: number, certification: Partial<Certification>): Promise<Certification | undefined>;
  deleteCertification(id: number): Promise<void>;
  getCertificationById(id: number): Promise<Certification | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return user;
  }

  async updateUser(id: number, user: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  // Registration Tokens
  async getRegistrationToken(token: string): Promise<RegistrationToken | undefined> {
    const [regToken] = await db
      .select()
      .from(registrationTokens)
      .where(eq(registrationTokens.token, token));
    return regToken || undefined;
  }

  async createRegistrationToken(token: InsertRegistrationToken): Promise<RegistrationToken> {
    const [regToken] = await db
      .insert(registrationTokens)
      .values({
        ...token,
        createdAt: new Date(),
      })
      .returning();
    return regToken;
  }

  async markTokenAsUsed(token: string, userId: number): Promise<void> {
    await db
      .update(registrationTokens)
      .set({ 
        isUsed: true, 
        usedBy: userId, 
        usedAt: new Date() 
      })
      .where(eq(registrationTokens.token, token));
  }

  // Teams
  async getTeams(): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.isActive, true));
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db
      .insert(teams)
      .values({
        ...team,
        createdAt: new Date(),
      })
      .returning();
    return newTeam;
  }

  async getTeamMembers(teamId: number): Promise<User[]> {
    return await db
      .select({
        id: users.id,
        username: users.username,
        password: users.password,
        email: users.email,
        name: users.name,
        role: users.role,
        companyAccount: users.companyAccount,
        department: users.department,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(teamMembers)
      .innerJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId));
  }

  async addTeamMember(teamId: number, userId: number, role: string = "member"): Promise<void> {
    await db
      .insert(teamMembers)
      .values({
        teamId,
        userId,
        role,
        joinedAt: new Date(),
      });
  }

  // Chats
  async getUserChats(userId: number): Promise<Chat[]> {
    const result = await db
      .select({
        id: chats.id,
        name: chats.name,
        type: chats.type,
        teamId: chats.teamId,
        createdBy: chats.createdBy,
        isActive: chats.isActive,
        createdAt: chats.createdAt,
      })
      .from(chats)
      .innerJoin(chatParticipants, eq(chats.id, chatParticipants.chatId))
      .where(
        and(
          eq(chatParticipants.userId, userId),
          eq(chats.isActive, true)
        )
      );
    return result;
  }

  async createChat(chat: InsertChat): Promise<Chat> {
    const [newChat] = await db
      .insert(chats)
      .values({
        ...chat,
        createdAt: new Date(),
      })
      .returning();
    return newChat;
  }

  async getChatMessages(chatId: number, limit: number = 50, offset: number = 0): Promise<Message[]> {
    const result = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);
    return result;
  }

  async addChatParticipant(chatId: number, userId: number): Promise<void> {
    await db
      .insert(chatParticipants)
      .values({
        chatId,
        userId,
        joinedAt: new Date(),
      });
  }

  // Messages
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values({
        ...message,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newMessage;
  }

  async updateMessage(id: number, content: string): Promise<Message | undefined> {
    const [updatedMessage] = await db
      .update(messages)
      .set({ 
        content, 
        edited: true,
        updatedAt: new Date()
      })
      .where(eq(messages.id, id))
      .returning();
    return updatedMessage || undefined;
  }

  async deleteMessage(id: number): Promise<void> {
    await db.delete(messages).where(eq(messages.id, id));
  }

  // Leads
  async getLeads(filters?: { assignedTo?: number; teamId?: number; status?: string }): Promise<Lead[]> {
    const conditions = [];
    
    if (filters?.assignedTo) {
      conditions.push(eq(leads.assignedTo, filters.assignedTo));
    }
    if (filters?.teamId) {
      conditions.push(eq(leads.teamId, filters.teamId));
    }
    if (filters?.status) {
      conditions.push(eq(leads.status, filters.status));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(leads).where(and(...conditions)).orderBy(desc(leads.createdAt));
    }
    
    return await db.select().from(leads).orderBy(desc(leads.createdAt));
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [newLead] = await db
      .insert(leads)
      .values({
        ...lead,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newLead;
  }

  async updateLead(id: number, lead: Partial<Lead>): Promise<Lead | undefined> {
    const [updatedLead] = await db
      .update(leads)
      .set({ ...lead, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return updatedLead || undefined;
  }

  // Conversations
  async getConversations(filters?: { attendantId?: number; status?: string }): Promise<Conversation[]> {
    const conditions = [];
    
    if (filters?.attendantId) {
      conditions.push(eq(conversations.attendantId, filters.attendantId));
    }
    if (filters?.status) {
      conditions.push(eq(conversations.status, filters.status));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(conversations).where(and(...conditions)).orderBy(desc(conversations.lastMessageAt));
    }
    
    return await db.select().from(conversations).orderBy(desc(conversations.lastMessageAt));
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values({
        ...conversation,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newConversation;
  }

  async updateConversation(id: number, conversation: Partial<Conversation>): Promise<Conversation | undefined> {
    const [updatedConversation] = await db
      .update(conversations)
      .set({ ...conversation, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return updatedConversation || undefined;
  }

  // Attendance Messages
  async getConversationMessages(conversationId: number, limit: number = 50, offset: number = 0): Promise<AttendanceMessage[]> {
    return await db
      .select()
      .from(attendanceMessages)
      .where(eq(attendanceMessages.conversationId, conversationId))
      .orderBy(desc(attendanceMessages.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async createAttendanceMessage(message: InsertAttendanceMessage): Promise<AttendanceMessage> {
    const [newMessage] = await db
      .insert(attendanceMessages)
      .values({
        ...message,
        createdAt: new Date(),
      })
      .returning();
    return newMessage;
  }

  async markMessagesAsRead(conversationId: number, userId: number): Promise<void> {
    await db
      .update(attendanceMessages)
      .set({ read: true })
      .where(
        and(
          eq(attendanceMessages.conversationId, conversationId),
          eq(attendanceMessages.senderId, userId)
        )
      );
  }

  // Internal Notes
  async getConversationNotes(conversationId: number): Promise<InternalNote[]> {
    return await db
      .select()
      .from(internalNotes)
      .where(eq(internalNotes.conversationId, conversationId))
      .orderBy(desc(internalNotes.createdAt));
  }

  async createInternalNote(note: InsertInternalNote): Promise<InternalNote> {
    const [newNote] = await db
      .insert(internalNotes)
      .values({
        ...note,
        createdAt: new Date(),
      })
      .returning();
    return newNote;
  }

  // Goals
  async getGoals(filters?: { type?: string; teamId?: number; userId?: number }): Promise<Goal[]> {
    const conditions = [eq(goals.isActive, true)];
    
    if (filters?.type) {
      conditions.push(eq(goals.type, filters.type));
    }
    if (filters?.teamId) {
      conditions.push(eq(goals.teamId, filters.teamId));
    }
    if (filters?.userId) {
      conditions.push(eq(goals.userId, filters.userId));
    }
    
    return await db.select().from(goals)
      .where(and(...conditions))
      .orderBy(desc(goals.createdAt));
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    const [newGoal] = await db
      .insert(goals)
      .values({
        ...goal,
        createdAt: new Date(),
      })
      .returning();
    return newGoal;
  }

  async updateGoal(id: number, goal: Partial<Goal>): Promise<Goal | undefined> {
    const [updatedGoal] = await db
      .update(goals)
      .set(goal)
      .where(eq(goals.id, id))
      .returning();
    return updatedGoal || undefined;
  }

  // User Activity
  async getUserActivity(userId: number, date?: string): Promise<UserActivity[]> {
    const conditions = [eq(userActivity.userId, userId)];
    
    if (date) {
      conditions.push(eq(userActivity.date, date));
    }
    
    return await db.select().from(userActivity)
      .where(and(...conditions))
      .orderBy(desc(userActivity.createdAt));
  }

  async createUserActivity(activity: InsertUserActivity): Promise<UserActivity> {
    const [newActivity] = await db
      .insert(userActivity)
      .values({
        ...activity,
        createdAt: new Date(),
      })
      .returning();
    return newActivity;
  }

  async updateUserActivity(id: number, activity: Partial<UserActivity>): Promise<UserActivity | undefined> {
    const [updatedActivity] = await db
      .update(userActivity)
      .set(activity)
      .where(eq(userActivity.id, id))
      .returning();
    return updatedActivity || undefined;
  }

  // Certificações
  async getCertifications(filters?: { modalidade?: string; curso?: string; status?: string; categoria?: string }): Promise<Certification[]> {
    let conditions = [];
    
    if (filters) {
      if (filters.modalidade) {
        conditions.push(eq(certifications.modalidade, filters.modalidade));
      }
      if (filters.curso) {
        conditions.push(like(certifications.curso, `%${filters.curso}%`));
      }
      if (filters.status) {
        conditions.push(eq(certifications.status, filters.status));
      }
      if (filters.categoria) {
        conditions.push(eq(certifications.categoria, filters.categoria));
      }
    }
    
    if (conditions.length > 0) {
      return await db
        .select()
        .from(certifications)
        .where(and(...conditions))
        .orderBy(desc(certifications.createdAt));
    } else {
      return await db
        .select()
        .from(certifications)
        .orderBy(desc(certifications.createdAt));
    }
  }

  async createCertification(certification: InsertCertification): Promise<Certification> {
    const [newCertification] = await db
      .insert(certifications)
      .values({
        ...certification,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newCertification;
  }

  async updateCertification(id: number, certification: Partial<Certification>): Promise<Certification | undefined> {
    const [updatedCertification] = await db
      .update(certifications)
      .set({
        ...certification,
        updatedAt: new Date(),
      })
      .where(eq(certifications.id, id))
      .returning();
    return updatedCertification || undefined;
  }

  async deleteCertification(id: number): Promise<void> {
    await db.delete(certifications).where(eq(certifications.id, id));
  }

  async getCertificationById(id: number): Promise<Certification | undefined> {
    const [certification] = await db
      .select()
      .from(certifications)
      .where(eq(certifications.id, id));
    return certification || undefined;
  }
}

export const storage = new DatabaseStorage();
