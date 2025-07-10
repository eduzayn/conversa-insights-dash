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
  preRegisteredCourses,
  studentEnrollments,
  studentEvaluations,
  studentDocuments,
  studentPayments,
  studentCertificates,
  studentCards,
  payments,
  simplifiedEnrollments,
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
  type InsertCertification,
  type PreRegisteredCourse,
  type InsertPreRegisteredCourse,
  type StudentEnrollment,
  type InsertStudentEnrollment,
  type StudentEvaluation,
  type InsertStudentEvaluation,
  type StudentDocument,
  type InsertStudentDocument,
  type StudentPayment,
  type InsertStudentPayment,
  type StudentCertificate,
  type InsertStudentCertificate,
  type StudentCard,
  type InsertStudentCard,
  type Payment,
  type InsertPayment,
  type SimplifiedEnrollment,
  type InsertSimplifiedEnrollment,
  subjects,
  professorSubjects,
  subjectContents,
  professorEvaluations,
  evaluationQuestions,
  evaluationSubmissions,
  type Subject,
  type InsertSubject,
  type ProfessorSubject,
  type InsertProfessorSubject,
  type SubjectContent,
  type InsertSubjectContent,
  type ProfessorEvaluation,
  type InsertProfessorEvaluation,
  type EvaluationQuestion,
  type InsertEvaluationQuestion,
  type EvaluationSubmission,
  type InsertEvaluationSubmission,
  asaasPayments,
  asaasSyncControl,
  type AsaasPayment,
  type InsertAsaasPayment,
  type AsaasSyncControl,
  type InsertAsaasSyncControl
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, like, count, sql } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByCpf(cpf: string): Promise<User | undefined>;
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
  getCertifications(filters?: { modalidade?: string; curso?: string; status?: string; categoria?: string; subcategoria?: string }): Promise<Certification[]>;
  createCertification(certification: InsertCertification): Promise<Certification>;
  updateCertification(id: number, certification: Partial<Certification>): Promise<Certification | undefined>;
  deleteCertification(id: number): Promise<void>;
  getCertificationById(id: number): Promise<Certification | undefined>;

  // Payments (Asaas Integration)
  getPayments(filters?: { userId?: number; status?: string; tenantId?: number }): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: number, payment: Partial<Payment>): Promise<Payment | undefined>;
  getPaymentByExternalId(externalId: string): Promise<Payment | undefined>;
  getUserPayments(userId: number): Promise<Payment[]>;
  
  // Pre-registered Courses
  getPreRegisteredCourses(filters?: { modalidade?: string; categoria?: string; ativo?: boolean }): Promise<PreRegisteredCourse[]>;
  createPreRegisteredCourse(course: InsertPreRegisteredCourse): Promise<PreRegisteredCourse>;
  updatePreRegisteredCourse(id: number, course: Partial<PreRegisteredCourse>): Promise<PreRegisteredCourse | undefined>;
  deletePreRegisteredCourse(id: number): Promise<void>;

  // Portal do Aluno - Student Enrollments
  getStudentEnrollments(studentId: number): Promise<StudentEnrollment[]>;
  createStudentEnrollment(enrollment: InsertStudentEnrollment): Promise<StudentEnrollment>;
  updateStudentEnrollment(id: number, enrollment: Partial<StudentEnrollment>): Promise<StudentEnrollment | undefined>;

  // Portal do Aluno - Student Evaluations
  getStudentEvaluations(enrollmentId: number): Promise<StudentEvaluation[]>;
  createStudentEvaluation(evaluation: InsertStudentEvaluation): Promise<StudentEvaluation>;
  updateStudentEvaluation(id: number, evaluation: Partial<StudentEvaluation>): Promise<StudentEvaluation | undefined>;

  // Portal do Aluno - Student Documents
  getStudentDocuments(studentId: number): Promise<StudentDocument[]>;
  createStudentDocument(document: InsertStudentDocument): Promise<StudentDocument>;
  updateStudentDocument(id: number, document: Partial<StudentDocument>): Promise<StudentDocument | undefined>;

  // Portal do Aluno - Student Payments
  getStudentPayments(studentId: number): Promise<StudentPayment[]>;
  createStudentPayment(payment: InsertStudentPayment): Promise<StudentPayment>;
  updateStudentPayment(id: number, payment: Partial<StudentPayment>): Promise<StudentPayment | undefined>;

  // Portal do Aluno - Student Certificates
  getStudentCertificates(studentId: number): Promise<StudentCertificate[]>;
  createStudentCertificate(certificate: InsertStudentCertificate): Promise<StudentCertificate>;
  updateStudentCertificate(id: number, certificate: Partial<StudentCertificate>): Promise<StudentCertificate | undefined>;

  // Portal do Aluno - Student Card
  getStudentCard(studentId: number): Promise<StudentCard | undefined>;
  createStudentCard(card: InsertStudentCard): Promise<StudentCard>;
  updateStudentCard(id: number, card: Partial<StudentCard>): Promise<StudentCard | undefined>;
  validateStudentCard(tokenValidacao: string): Promise<StudentCard | undefined>;

  // Portal do Professor - Subjects
  getProfessorSubjects(professorId: number): Promise<Subject[]>;
  getAllSubjects(): Promise<Subject[]>;
  createSubject(subject: InsertSubject): Promise<Subject>;
  updateSubject(id: number, subject: Partial<Subject>): Promise<Subject | undefined>;
  assignProfessorToSubject(professorId: number, subjectId: number, canEdit: boolean): Promise<ProfessorSubject>;

  // Portal do Professor - Subject Contents
  getSubjectContents(subjectId: number, professorId?: number): Promise<SubjectContent[]>;
  createSubjectContent(content: InsertSubjectContent): Promise<SubjectContent>;
  updateSubjectContent(id: number, content: Partial<SubjectContent>): Promise<SubjectContent | undefined>;
  deleteSubjectContent(id: number): Promise<void>;
  
  // Integração Portal Professor-Aluno
  getStudentsBySubject(subjectId: number): Promise<number[]>;
  markContentAsViewed(studentId: number, contentId: number): Promise<void>;
  createNotification(notification: any): Promise<void>;

  // Portal do Professor - Evaluations
  getProfessorEvaluations(professorId: number, subjectId?: number): Promise<ProfessorEvaluation[]>;
  createProfessorEvaluation(evaluation: InsertProfessorEvaluation): Promise<ProfessorEvaluation>;
  updateProfessorEvaluation(id: number, evaluation: Partial<ProfessorEvaluation>): Promise<ProfessorEvaluation | undefined>;
  
  // Portal do Professor - Evaluation Questions
  getEvaluationQuestions(evaluationId: number): Promise<EvaluationQuestion[]>;
  createEvaluationQuestion(question: InsertEvaluationQuestion): Promise<EvaluationQuestion>;
  updateEvaluationQuestion(id: number, question: Partial<EvaluationQuestion>): Promise<EvaluationQuestion | undefined>;

  // Portal do Professor - Evaluation Submissions
  getEvaluationSubmissions(evaluationId: number): Promise<EvaluationSubmission[]>;
  createEvaluationSubmission(submission: InsertEvaluationSubmission): Promise<EvaluationSubmission>;
  updateEvaluationSubmission(id: number, submission: Partial<EvaluationSubmission>): Promise<EvaluationSubmission | undefined>;

  // Sistema de Matrícula Simplificada
  getSimplifiedEnrollments(tenantId?: number): Promise<SimplifiedEnrollment[]>;
  createSimplifiedEnrollment(enrollment: InsertSimplifiedEnrollment): Promise<SimplifiedEnrollment>;
  updateSimplifiedEnrollment(id: number, enrollment: Partial<SimplifiedEnrollment>): Promise<SimplifiedEnrollment>;
  deleteSimplifiedEnrollment(id: number): Promise<void>;
  getSimplifiedEnrollmentById(id: number): Promise<SimplifiedEnrollment | null>;

  // Cache de Cobranças Asaas com Paginação
  getCachedAsaasPayments(filters?: {
    status?: string;
    customerName?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ payments: AsaasPayment[]; total: number }>;
  cacheAsaasPayment(payment: InsertAsaasPayment): Promise<AsaasPayment>;
  updateCachedAsaasPayment(asaasId: string, payment: Partial<AsaasPayment>): Promise<AsaasPayment | undefined>;
  getLastSyncDate(): Promise<Date | null>;
  createSyncControl(syncData: InsertAsaasSyncControl): Promise<AsaasSyncControl>;
  updateSyncControl(id: number, syncData: Partial<AsaasSyncControl>): Promise<AsaasSyncControl | undefined>;
  bulkUpsertAsaasPayments(payments: InsertAsaasPayment[]): Promise<void>;
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

  async getUserByCpf(cpf: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.cpf, cpf));
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
  async getCertifications(filters?: { modalidade?: string; curso?: string; status?: string; categoria?: string; subcategoria?: string }): Promise<Certification[]> {
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
      if (filters.subcategoria) {
        conditions.push(eq(certifications.subcategoria, filters.subcategoria));
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
      .values(certification)
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

  // Pre-registered Courses
  async getPreRegisteredCourses(filters?: { modalidade?: string; categoria?: string; ativo?: boolean }): Promise<PreRegisteredCourse[]> {
    const conditions = [];
    
    if (filters?.modalidade) {
      conditions.push(eq(preRegisteredCourses.modalidade, filters.modalidade));
    }
    
    if (filters?.categoria) {
      conditions.push(eq(preRegisteredCourses.categoria, filters.categoria));
    }
    
    if (filters?.ativo !== undefined) {
      conditions.push(eq(preRegisteredCourses.ativo, filters.ativo));
    }
    
    if (conditions.length > 0) {
      const courses = await db
        .select()
        .from(preRegisteredCourses)
        .where(and(...conditions))
        .orderBy(asc(preRegisteredCourses.nome));
      return courses;
    } else {
      const courses = await db
        .select()
        .from(preRegisteredCourses)
        .orderBy(asc(preRegisteredCourses.nome));
      return courses;
    }
  }

  async createPreRegisteredCourse(course: InsertPreRegisteredCourse): Promise<PreRegisteredCourse> {
    const [newCourse] = await db
      .insert(preRegisteredCourses)
      .values({
        ...course,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newCourse;
  }

  async updatePreRegisteredCourse(id: number, course: Partial<PreRegisteredCourse>): Promise<PreRegisteredCourse | undefined> {
    const [updatedCourse] = await db
      .update(preRegisteredCourses)
      .set({ ...course, updatedAt: new Date() })
      .where(eq(preRegisteredCourses.id, id))
      .returning();
    return updatedCourse || undefined;
  }

  async deletePreRegisteredCourse(id: number): Promise<void> {
    await db.delete(preRegisteredCourses).where(eq(preRegisteredCourses.id, id));
  }

  // Portal do Aluno - Student Enrollments
  async getStudentEnrollments(studentId: number): Promise<StudentEnrollment[]> {
    return await db
      .select()
      .from(studentEnrollments)
      .where(eq(studentEnrollments.studentId, studentId))
      .orderBy(desc(studentEnrollments.dataMatricula));
  }

  async createStudentEnrollment(enrollment: InsertStudentEnrollment): Promise<StudentEnrollment> {
    const [newEnrollment] = await db
      .insert(studentEnrollments)
      .values({
        ...enrollment,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    // Integração automática com Asaas - criar cobrança na matrícula
    try {
      await this.createEnrollmentPayment(newEnrollment);
    } catch (error) {
      console.error('Erro ao criar cobrança automática na matrícula:', error);
      // Não falha a matrícula se a cobrança falhar
    }
    
    return newEnrollment;
  }

  async updateStudentEnrollment(id: number, enrollment: Partial<StudentEnrollment>): Promise<StudentEnrollment | undefined> {
    const [updatedEnrollment] = await db
      .update(studentEnrollments)
      .set({ ...enrollment, updatedAt: new Date() })
      .where(eq(studentEnrollments.id, id))
      .returning();
    return updatedEnrollment || undefined;
  }

  // Portal do Aluno - Student Evaluations
  async getStudentEvaluations(enrollmentId: number): Promise<StudentEvaluation[]> {
    return await db
      .select()
      .from(studentEvaluations)
      .where(eq(studentEvaluations.enrollmentId, enrollmentId))
      .orderBy(desc(studentEvaluations.dataAplicacao));
  }

  async createStudentEvaluation(evaluation: InsertStudentEvaluation): Promise<StudentEvaluation> {
    const [newEvaluation] = await db
      .insert(studentEvaluations)
      .values({
        ...evaluation,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newEvaluation;
  }

  async updateStudentEvaluation(id: number, evaluation: Partial<StudentEvaluation>): Promise<StudentEvaluation | undefined> {
    const [updatedEvaluation] = await db
      .update(studentEvaluations)
      .set({ ...evaluation, updatedAt: new Date() })
      .where(eq(studentEvaluations.id, id))
      .returning();
    return updatedEvaluation || undefined;
  }

  // Portal do Aluno - Student Documents
  async getStudentDocuments(studentId: number): Promise<StudentDocument[]> {
    return await db
      .select()
      .from(studentDocuments)
      .where(eq(studentDocuments.studentId, studentId))
      .orderBy(desc(studentDocuments.dataEnvio));
  }

  async createStudentDocument(document: InsertStudentDocument): Promise<StudentDocument> {
    const [newDocument] = await db
      .insert(studentDocuments)
      .values({
        ...document,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newDocument;
  }

  async updateStudentDocument(id: number, document: Partial<StudentDocument>): Promise<StudentDocument | undefined> {
    const [updatedDocument] = await db
      .update(studentDocuments)
      .set({ ...document, updatedAt: new Date() })
      .where(eq(studentDocuments.id, id))
      .returning();
    return updatedDocument || undefined;
  }

  // Portal do Aluno - Student Payments
  async getStudentPayments(studentId: number): Promise<StudentPayment[]> {
    return await db
      .select()
      .from(studentPayments)
      .where(eq(studentPayments.studentId, studentId))
      .orderBy(desc(studentPayments.dataVencimento));
  }

  async createStudentPayment(payment: InsertStudentPayment): Promise<StudentPayment> {
    const [newPayment] = await db
      .insert(studentPayments)
      .values({
        ...payment,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newPayment;
  }

  async updateStudentPayment(id: number, payment: Partial<StudentPayment>): Promise<StudentPayment | undefined> {
    const [updatedPayment] = await db
      .update(studentPayments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(studentPayments.id, id))
      .returning();
    return updatedPayment || undefined;
  }

  // Portal do Aluno - Student Certificates
  async getStudentCertificates(studentId: number): Promise<StudentCertificate[]> {
    return await db
      .select()
      .from(studentCertificates)
      .where(eq(studentCertificates.studentId, studentId))
      .orderBy(desc(studentCertificates.dataEmissao));
  }

  async createStudentCertificate(certificate: InsertStudentCertificate): Promise<StudentCertificate> {
    const [newCertificate] = await db
      .insert(studentCertificates)
      .values({
        ...certificate,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newCertificate;
  }

  async updateStudentCertificate(id: number, certificate: Partial<StudentCertificate>): Promise<StudentCertificate | undefined> {
    const [updatedCertificate] = await db
      .update(studentCertificates)
      .set({ ...certificate, updatedAt: new Date() })
      .where(eq(studentCertificates.id, id))
      .returning();
    return updatedCertificate || undefined;
  }

  // Portal do Aluno - Student Card
  async getStudentCard(studentId: number): Promise<StudentCard | undefined> {
    const [card] = await db
      .select()
      .from(studentCards)
      .where(eq(studentCards.studentId, studentId));
    return card || undefined;
  }

  async createStudentCard(card: InsertStudentCard): Promise<StudentCard> {
    const [newCard] = await db
      .insert(studentCards)
      .values({
        ...card,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newCard;
  }

  async updateStudentCard(id: number, card: Partial<StudentCard>): Promise<StudentCard | undefined> {
    const [updatedCard] = await db
      .update(studentCards)
      .set({ ...card, updatedAt: new Date() })
      .where(eq(studentCards.id, id))
      .returning();
    return updatedCard || undefined;
  }

  async validateStudentCard(tokenValidacao: string): Promise<StudentCard | undefined> {
    const [card] = await db
      .select()
      .from(studentCards)
      .where(eq(studentCards.tokenValidacao, tokenValidacao));
    return card || undefined;
  }

  // Portal do Professor - Subjects
  async getProfessorSubjects(professorId: number): Promise<Subject[]> {
    return await db
      .select({
        id: subjects.id,
        nome: subjects.nome,
        codigo: subjects.codigo,
        descricao: subjects.descricao,
        cargaHoraria: subjects.cargaHoraria,
        area: subjects.area,
        isActive: subjects.isActive,
        createdAt: subjects.createdAt,
        updatedAt: subjects.updatedAt,
      })
      .from(subjects)
      .innerJoin(professorSubjects, eq(subjects.id, professorSubjects.subjectId))
      .where(and(
        eq(professorSubjects.professorId, professorId),
        eq(subjects.isActive, true)
      ))
      .orderBy(asc(subjects.nome));
  }

  async getAllSubjects(): Promise<Subject[]> {
    return await db
      .select()
      .from(subjects)
      .where(eq(subjects.isActive, true))
      .orderBy(asc(subjects.nome));
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [newSubject] = await db
      .insert(subjects)
      .values({
        ...subject,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newSubject;
  }

  async updateSubject(id: number, subject: Partial<Subject>): Promise<Subject | undefined> {
    const [updatedSubject] = await db
      .update(subjects)
      .set({ ...subject, updatedAt: new Date() })
      .where(eq(subjects.id, id))
      .returning();
    return updatedSubject || undefined;
  }

  async assignProfessorToSubject(professorId: number, subjectId: number, canEdit: boolean = true): Promise<ProfessorSubject> {
    const [assignment] = await db
      .insert(professorSubjects)
      .values({
        professorId,
        subjectId,
        canEdit,
        createdAt: new Date(),
      })
      .returning();
    return assignment;
  }

  // Portal do Professor - Subject Contents
  async getSubjectContents(subjectId: number, professorId?: number): Promise<SubjectContent[]> {
    let query = db
      .select()
      .from(subjectContents)
      .where(eq(subjectContents.subjectId, subjectId));

    if (professorId) {
      query = query.where(eq(subjectContents.professorId, professorId));
    }

    return await query.orderBy(asc(subjectContents.ordem));
  }

  async createSubjectContent(content: InsertSubjectContent): Promise<SubjectContent> {
    const [newContent] = await db
      .insert(subjectContents)
      .values({
        ...content,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newContent;
  }

  async updateSubjectContent(id: number, content: Partial<SubjectContent>): Promise<SubjectContent | undefined> {
    const [updatedContent] = await db
      .update(subjectContents)
      .set({ ...content, updatedAt: new Date() })
      .where(eq(subjectContents.id, id))
      .returning();
    return updatedContent || undefined;
  }

  async deleteSubjectContent(id: number): Promise<void> {
    await db
      .delete(subjectContents)
      .where(eq(subjectContents.id, id));
  }

  // Portal do Professor - Evaluations
  async getProfessorEvaluations(professorId: number, subjectId?: number): Promise<ProfessorEvaluation[]> {
    let query = db
      .select()
      .from(professorEvaluations)
      .where(eq(professorEvaluations.professorId, professorId));

    if (subjectId) {
      query = query.where(eq(professorEvaluations.subjectId, subjectId));
    }

    return await query.orderBy(desc(professorEvaluations.createdAt));
  }

  async createProfessorEvaluation(evaluation: InsertProfessorEvaluation): Promise<ProfessorEvaluation> {
    const [newEvaluation] = await db
      .insert(professorEvaluations)
      .values({
        ...evaluation,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newEvaluation;
  }

  async updateProfessorEvaluation(id: number, evaluation: Partial<ProfessorEvaluation>): Promise<ProfessorEvaluation | undefined> {
    const [updatedEvaluation] = await db
      .update(professorEvaluations)
      .set({ ...evaluation, updatedAt: new Date() })
      .where(eq(professorEvaluations.id, id))
      .returning();
    return updatedEvaluation || undefined;
  }
  
  // Portal do Professor - Evaluation Questions
  async getEvaluationQuestions(evaluationId: number): Promise<EvaluationQuestion[]> {
    return await db
      .select()
      .from(evaluationQuestions)
      .where(eq(evaluationQuestions.evaluationId, evaluationId))
      .orderBy(asc(evaluationQuestions.ordem));
  }

  async createEvaluationQuestion(question: InsertEvaluationQuestion): Promise<EvaluationQuestion> {
    const [newQuestion] = await db
      .insert(evaluationQuestions)
      .values({
        ...question,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newQuestion;
  }

  async updateEvaluationQuestion(id: number, question: Partial<EvaluationQuestion>): Promise<EvaluationQuestion | undefined> {
    const [updatedQuestion] = await db
      .update(evaluationQuestions)
      .set({ ...question, updatedAt: new Date() })
      .where(eq(evaluationQuestions.id, id))
      .returning();
    return updatedQuestion || undefined;
  }

  // Portal do Professor - Evaluation Submissions
  async getEvaluationSubmissions(evaluationId: number): Promise<EvaluationSubmission[]> {
    return await db
      .select()
      .from(evaluationSubmissions)
      .where(eq(evaluationSubmissions.evaluationId, evaluationId))
      .orderBy(desc(evaluationSubmissions.createdAt));
  }

  async createEvaluationSubmission(submission: InsertEvaluationSubmission): Promise<EvaluationSubmission> {
    const [newSubmission] = await db
      .insert(evaluationSubmissions)
      .values({
        ...submission,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newSubmission;
  }

  async updateEvaluationSubmission(id: number, submission: Partial<EvaluationSubmission>): Promise<EvaluationSubmission | undefined> {
    const [updatedSubmission] = await db
      .update(evaluationSubmissions)
      .set({ ...submission, updatedAt: new Date() })
      .where(eq(evaluationSubmissions.id, id))
      .returning();
    return updatedSubmission || undefined;
  }

  // Payments (Asaas Integration)
  async getPayments(filters?: { userId?: number; status?: string; tenantId?: number }): Promise<Payment[]> {
    let query = db.select().from(payments);
    
    const conditions = [];
    if (filters?.userId) {
      conditions.push(eq(payments.userId, filters.userId));
    }
    if (filters?.status) {
      conditions.push(eq(payments.status, filters.status));
    }
    if (filters?.tenantId) {
      conditions.push(eq(payments.tenantId, filters.tenantId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(payments.createdAt));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values({
        ...payment,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newPayment;
  }

  async updatePayment(id: number, payment: Partial<Payment>): Promise<Payment | undefined> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ ...payment, updatedAt: new Date() })
      .where(eq(payments.id, id))
      .returning();
    return updatedPayment || undefined;
  }

  async getPaymentByExternalId(externalId: string): Promise<Payment | undefined> {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.externalId, externalId))
      .limit(1);
    return payment || undefined;
  }

  async getUserPayments(userId: number): Promise<Payment[]> {
    return await db
      .select()
      .from(payments)
      .where(eq(payments.userId, userId))
      .orderBy(desc(payments.createdAt));
  }

  // Integração Portal Professor-Aluno
  async getStudentsBySubject(subjectId: number): Promise<number[]> {
    // Mock: retornar IDs de alunos matriculados na disciplina
    return [1, 2, 3]; // Simular 3 alunos matriculados
  }

  async markContentAsViewed(studentId: number, contentId: number): Promise<void> {
    // Mock: implementar lógica para marcar conteúdo como visualizado
    console.log(`Conteúdo ${contentId} marcado como visualizado pelo aluno ${studentId}`);
  }

  async createNotification(notification: any): Promise<void> {
    // Mock: criar notificação
    console.log("Notificação criada:", notification);
  }

  // Integração automática com Asaas para matrícula
  async createEnrollmentPayment(enrollment: StudentEnrollment): Promise<void> {
    try {
      // Buscar dados do usuário
      const user = await this.getUser(enrollment.studentId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Buscar dados do curso (se courseId estiver disponível)
      let courseInfo = null;
      if (enrollment.courseId) {
        courseInfo = await this.getPreRegisteredCourseById(enrollment.courseId);
      }

      // Configurar valores padrão para cobrança
      const amount = courseInfo?.preco || 299.00; // Valor padrão se não encontrar o curso
      const courseName = courseInfo?.nome || 'Curso não especificado';
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // Vencimento em 7 dias

      // Criar cobrança no sistema local
      const paymentData = {
        userId: enrollment.studentId,
        courseId: enrollment.courseId || null,
        amount: amount,
        description: `Matrícula em ${courseName}`,
        status: 'pending' as const,
        paymentMethod: 'boleto' as const,
        dueDate: dueDate,
        tenantId: 1 // Tenant padrão
      };

      const payment = await this.createPayment(paymentData);
      
      // Tentar criar cobrança no Asaas
      try {
        const asaasService = (await import('./services/asaas')).default;
        const asaasPayment = await asaasService.createPayment({
          customer: {
            name: user.username,
            email: user.email,
            cpfCnpj: user.cpf || '', // Assumindo que CPF pode estar no usuário
          },
          billingType: 'BOLETO',
          dueDate: dueDate.toISOString().split('T')[0],
          value: amount,
          description: `Matrícula em ${courseName}`,
          externalReference: `enrollment_${enrollment.id}`,
        });

        // Atualizar pagamento com dados do Asaas
        await this.updatePayment(payment.id, {
          externalId: asaasPayment.id,
          paymentUrl: asaasPayment.invoiceUrl,
          status: 'pending'
        });

        console.log(`Cobrança criada automaticamente no Asaas para matrícula ${enrollment.id}: ${asaasPayment.id}`);
      } catch (asaasError) {
        console.error('Erro ao criar cobrança no Asaas:', asaasError);
        // Mantém o pagamento local mesmo se falhar no Asaas
      }
    } catch (error) {
      console.error('Erro na criação automática de cobrança:', error);
      throw error;
    }
  }

  // Função auxiliar para buscar curso pré-cadastrado
  async getPreRegisteredCourseById(courseId: number): Promise<PreRegisteredCourse | undefined> {
    const [course] = await db
      .select()
      .from(preRegisteredCourses)
      .where(eq(preRegisteredCourses.id, courseId))
      .limit(1);
    return course || undefined;
  }

  // Sistema de Matrícula Simplificada
  async getSimplifiedEnrollments(tenantId?: number): Promise<SimplifiedEnrollment[]> {
    const query = db
      .select()
      .from(simplifiedEnrollments)
      .orderBy(simplifiedEnrollments.createdAt);
    
    if (tenantId) {
      query.where(eq(simplifiedEnrollments.tenantId, tenantId));
    }
    
    return await query;
  }

  async createSimplifiedEnrollment(enrollment: InsertSimplifiedEnrollment): Promise<SimplifiedEnrollment> {
    const [newEnrollment] = await db
      .insert(simplifiedEnrollments)
      .values({
        ...enrollment,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newEnrollment;
  }

  async updateSimplifiedEnrollment(id: number, enrollment: Partial<SimplifiedEnrollment>): Promise<SimplifiedEnrollment> {
    const [updatedEnrollment] = await db
      .update(simplifiedEnrollments)
      .set({
        ...enrollment,
        updatedAt: new Date(),
      })
      .where(eq(simplifiedEnrollments.id, id))
      .returning();
    
    if (!updatedEnrollment) {
      throw new Error('Simplified enrollment not found');
    }
    
    return updatedEnrollment;
  }

  async deleteSimplifiedEnrollment(id: number): Promise<void> {
    await db
      .delete(simplifiedEnrollments)
      .where(eq(simplifiedEnrollments.id, id));
  }

  async getSimplifiedEnrollmentById(id: number): Promise<SimplifiedEnrollment | null> {
    const [enrollment] = await db
      .select()
      .from(simplifiedEnrollments)
      .where(eq(simplifiedEnrollments.id, id))
      .limit(1);
    return enrollment || null;
  }

  // Cache de Cobranças Asaas com Paginação
  async getCachedAsaasPayments(filters?: {
    status?: string;
    customerName?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ payments: AsaasPayment[]; total: number }> {
    const { status, customerName, limit = 50, offset = 0 } = filters || {};
    
    // Construir condições de filtro
    const conditions = [];
    if (status && status !== 'all') {
      conditions.push(eq(asaasPayments.status, status));
    }
    if (customerName) {
      conditions.push(like(asaasPayments.customerName, `%${customerName}%`));
    }
    
    // Query para buscar dados
    let paymentsQuery = db.select().from(asaasPayments);
    if (conditions.length > 0) {
      paymentsQuery = paymentsQuery.where(and(...conditions));
    }
    
    // Query para contar total
    let countQuery = db.select({ count: count() }).from(asaasPayments);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    
    // Buscar dados com paginação
    const [payments, totalResult] = await Promise.all([
      paymentsQuery.orderBy(desc(asaasPayments.dateCreated)).limit(limit).offset(offset),
      countQuery
    ]);
    
    return {
      payments,
      total: totalResult[0]?.count || 0
    };
  }

  async cacheAsaasPayment(payment: InsertAsaasPayment): Promise<AsaasPayment> {
    const [cachedPayment] = await db
      .insert(asaasPayments)
      .values({
        ...payment,
        lastSyncAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: asaasPayments.asaasId,
        set: {
          ...payment,
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();
    return cachedPayment;
  }

  async updateCachedAsaasPayment(asaasId: string, payment: Partial<AsaasPayment>): Promise<AsaasPayment | undefined> {
    const [updatedPayment] = await db
      .update(asaasPayments)
      .set({
        ...payment,
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(asaasPayments.asaasId, asaasId))
      .returning();
    return updatedPayment || undefined;
  }

  async getLastSyncDate(): Promise<Date | null> {
    const [lastSync] = await db
      .select({ lastSyncDate: asaasSyncControl.lastSyncDate })
      .from(asaasSyncControl)
      .orderBy(desc(asaasSyncControl.createdAt))
      .limit(1);
    return lastSync?.lastSyncDate || null;
  }

  async createSyncControl(syncData: InsertAsaasSyncControl): Promise<AsaasSyncControl> {
    const [newSync] = await db
      .insert(asaasSyncControl)
      .values({
        ...syncData,
        createdAt: new Date(),
      })
      .returning();
    return newSync;
  }

  async updateSyncControl(id: number, syncData: Partial<AsaasSyncControl>): Promise<AsaasSyncControl | undefined> {
    const [updatedSync] = await db
      .update(asaasSyncControl)
      .set(syncData)
      .where(eq(asaasSyncControl.id, id))
      .returning();
    return updatedSync || undefined;
  }

  async bulkUpsertAsaasPayments(payments: InsertAsaasPayment[]): Promise<void> {
    if (payments.length === 0) return;
    
    const now = new Date();
    const paymentsWithTimestamps = payments.map(payment => ({
      ...payment,
      lastSyncAt: now,
      createdAt: now,
      updatedAt: now,
    }));

    await db
      .insert(asaasPayments)
      .values(paymentsWithTimestamps)
      .onConflictDoUpdate({
        target: asaasPayments.asaasId,
        set: {
          value: sql`excluded.value`,
          status: sql`excluded.status`,
          confirmedDate: sql`excluded.confirmed_date`,
          paymentDate: sql`excluded.payment_date`,
          clientPaymentDate: sql`excluded.client_payment_date`,
          customerName: sql`excluded.customer_name`,
          customerEmail: sql`excluded.customer_email`,
          customerCpfCnpj: sql`excluded.customer_cpf_cnpj`,
          customerPhone: sql`excluded.customer_phone`,
          customerMobilePhone: sql`excluded.customer_mobile_phone`,
          lastSyncAt: now,
          updatedAt: now,
        },
      });
  }
}

export const storage = new DatabaseStorage();
