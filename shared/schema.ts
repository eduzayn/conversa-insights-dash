import { pgTable, text, serial, integer, boolean, timestamp, json, uuid, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Usuários
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: text("role").notNull().default("agent"), // admin, agent
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tokens de cadastro
export const registrationTokens = pgTable("registration_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  isUsed: boolean("is_used").notNull().default(false),
  usedBy: integer("used_by").references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  usedAt: timestamp("used_at"),
});

// Equipes
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Membros de equipe
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull().default("member"), // leader, member
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Chats
export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // general, team, private
  teamId: integer("team_id").references(() => teams.id),
  createdBy: integer("created_by").notNull().references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Participantes do chat
export const chatParticipants = pgTable("chat_participants", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => chats.id),
  userId: integer("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  leftAt: timestamp("left_at"),
});

// Mensagens
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  chatId: integer("chat_id").notNull().references(() => chats.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  type: text("type").notNull().default("text"), // text, audio, file, image
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  mentions: text("mentions").array(),
  replyToId: integer("reply_to_id"),
  reactions: json("reactions"), // {emoji: [userId]}
  edited: boolean("edited").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Leads/Alunos
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  course: text("course"),
  source: text("source"),
  status: text("status").notNull().default("novo"),
  assignedTo: integer("assigned_to").references(() => users.id),
  teamId: integer("team_id").references(() => teams.id),
  notes: text("notes"),
  lastInteraction: timestamp("last_interaction"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Conversas de atendimento
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  leadId: integer("lead_id").notNull().references(() => leads.id),
  attendantId: integer("attendant_id").references(() => users.id),
  status: text("status").notNull().default("novo"), // novo, em_andamento, finalizado
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Mensagens de atendimento
export const attendanceMessages = pgTable("attendance_messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  senderId: integer("sender_id").references(() => users.id),
  senderType: text("sender_type").notNull(), // student, attendant, system
  content: text("content").notNull(),
  type: text("type").notNull().default("text"), // text, file, audio, system
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  audioDuration: integer("audio_duration"),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notas internas
export const internalNotes = pgTable("internal_notes", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id),
  authorId: integer("author_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Metas
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(), // individual, team
  indicator: text("indicator").notNull(), // atendimentos, vendas, etc
  target: integer("target").notNull(),
  period: text("period").notNull(), // daily, weekly, monthly
  teamId: integer("team_id").references(() => teams.id),
  userId: integer("user_id").references(() => users.id),
  reward: integer("reward").notNull().default(0), // moedas zaynianas
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Progresso das metas
export const goalProgress = pgTable("goal_progress", {
  id: serial("id").primaryKey(),
  goalId: integer("goal_id").notNull().references(() => goals.id),
  userId: integer("user_id").references(() => users.id),
  current: integer("current").notNull().default(0),
  achieved: boolean("achieved").default(false),
  period: text("period").notNull(), // 2024-01-01, 2024-W01, 2024-01
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Presença/Atividade
export const userActivity = pgTable("user_activity", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  loginTime: timestamp("login_time"),
  logoutTime: timestamp("logout_time"),
  totalOnlineTime: integer("total_online_time").default(0), // em minutos
  inactivityCount: integer("inactivity_count").default(0),
  lastActivity: timestamp("last_activity"),
  date: text("date").notNull(), // YYYY-MM-DD
  createdAt: timestamp("created_at").defaultNow(),
});

// Relações
export const usersRelations = relations(users, ({ many, one }) => ({
  teamMemberships: many(teamMembers),
  createdTokens: many(registrationTokens, { relationName: "createdBy" }),
  usedToken: one(registrationTokens, { 
    fields: [users.id], 
    references: [registrationTokens.usedBy],
    relationName: "usedBy"
  }),
  sentMessages: many(messages),
  assignedLeads: many(leads),
  conversations: many(conversations),
  internalNotes: many(internalNotes),
  goals: many(goals),
  goalProgress: many(goalProgress),
  activity: many(userActivity),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(teamMembers),
  chats: many(chats),
  leads: many(leads),
  goals: many(goals),
}));

export const chatsRelations = relations(chats, ({ many, one }) => ({
  messages: many(messages),
  participants: many(chatParticipants),
  team: one(teams, { fields: [chats.teamId], references: [teams.id] }),
  creator: one(users, { fields: [chats.createdBy], references: [users.id] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, { fields: [messages.chatId], references: [chats.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
  replyTo: one(messages, { fields: [messages.replyToId], references: [messages.id] }),
}));

export const leadsRelations = relations(leads, ({ many, one }) => ({
  conversations: many(conversations),
  assignedUser: one(users, { fields: [leads.assignedTo], references: [users.id] }),
  team: one(teams, { fields: [leads.teamId], references: [teams.id] }),
}));

export const conversationsRelations = relations(conversations, ({ many, one }) => ({
  lead: one(leads, { fields: [conversations.leadId], references: [leads.id] }),
  attendant: one(users, { fields: [conversations.attendantId], references: [users.id] }),
  messages: many(attendanceMessages),
  internalNotes: many(internalNotes),
}));

// Schemas de inserção
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  role: true,
});

export const insertRegistrationTokenSchema = createInsertSchema(registrationTokens).pick({
  token: true,
  createdBy: true,
  expiresAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).pick({
  name: true,
  description: true,
  icon: true,
});

export const insertChatSchema = createInsertSchema(chats).pick({
  name: true,
  type: true,
  teamId: true,
  createdBy: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  chatId: true,
  senderId: true,
  content: true,
  type: true,
  fileUrl: true,
  fileName: true,
  mentions: true,
  replyToId: true,
});

export const insertLeadSchema = createInsertSchema(leads).pick({
  name: true,
  email: true,
  phone: true,
  course: true,
  source: true,
  status: true,
  assignedTo: true,
  teamId: true,
  notes: true,
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  leadId: true,
  attendantId: true,
  status: true,
});

export const insertAttendanceMessageSchema = createInsertSchema(attendanceMessages).pick({
  conversationId: true,
  senderId: true,
  senderType: true,
  content: true,
  type: true,
  fileUrl: true,
  fileName: true,
  audioDuration: true,
});

export const insertInternalNoteSchema = createInsertSchema(internalNotes).pick({
  conversationId: true,
  authorId: true,
  content: true,
});

export const insertGoalSchema = createInsertSchema(goals).pick({
  title: true,
  description: true,
  type: true,
  indicator: true,
  target: true,
  period: true,
  teamId: true,
  userId: true,
  reward: true,
});

export const insertUserActivitySchema = createInsertSchema(userActivity).pick({
  userId: true,
  loginTime: true,
  logoutTime: true,
  totalOnlineTime: true,
  inactivityCount: true,
  lastActivity: true,
  date: true,
});

// Tipos
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertRegistrationToken = z.infer<typeof insertRegistrationTokenSchema>;
export type RegistrationToken = typeof registrationTokens.$inferSelect;

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

export type InsertChat = z.infer<typeof insertChatSchema>;
export type Chat = typeof chats.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertLead = z.infer<typeof insertLeadSchema>;
export type Lead = typeof leads.$inferSelect;

export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;

export type InsertAttendanceMessage = z.infer<typeof insertAttendanceMessageSchema>;
export type AttendanceMessage = typeof attendanceMessages.$inferSelect;

export type InsertInternalNote = z.infer<typeof insertInternalNoteSchema>;
export type InternalNote = typeof internalNotes.$inferSelect;

export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;

export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type UserActivity = typeof userActivity.$inferSelect;
