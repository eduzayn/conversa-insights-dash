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
  academicCourses,
  academicProfessors,
  academicDisciplines,
  courseDisciplines,
  academicStudents,
  academicGrades,
  academicCertificates,
  certificateTemplates,
  negociacoes,
  negociacoesExpirados,

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
  type GoalProgress,
  type InsertGoalProgress,
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
  type AcademicCourse,
  type InsertAcademicCourse,
  type AcademicProfessor,
  type InsertAcademicProfessor,
  type AcademicDiscipline,
  type InsertAcademicDiscipline,
  type CourseDiscipline,
  type InsertCourseDiscipline,
  type AcademicStudent,
  type InsertAcademicStudent,
  type AcademicGrade,
  type InsertAcademicGrade,
  type AcademicCertificate,
  type InsertAcademicCertificate,
  type CertificateTemplate,
  type InsertCertificateTemplate,
  type Negociacao,
  type InsertNegociacao,
  type NegociacaoExpirado,
  type InsertNegociacaoExpirado,
  enviosUnicv,
  type EnvioUnicv,
  type InsertEnvioUnicv
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, like, ilike, count, isNotNull, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByCpf(cpf: string): Promise<User | undefined>;
  createUser(user: InsertUser & { multiCompanyAccess?: any }): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Registration Tokens
  getRegistrationToken(token: string): Promise<RegistrationToken | undefined>;
  getAllRegistrationTokens(): Promise<RegistrationToken[]>;
  createRegistrationToken(token: InsertRegistrationToken): Promise<RegistrationToken>;
  markTokenAsUsed(token: string, usedBy: number): Promise<void>;
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
  getSimplifiedEnrollments(filters?: { status?: string; tenantId?: number; consultantId?: number }): Promise<SimplifiedEnrollment[]>;
  createSimplifiedEnrollment(enrollment: InsertSimplifiedEnrollment): Promise<SimplifiedEnrollment>;
  updateSimplifiedEnrollment(id: number, enrollment: Partial<SimplifiedEnrollment>): Promise<SimplifiedEnrollment>;
  deleteSimplifiedEnrollment(id: number): Promise<void>;
  getSimplifiedEnrollmentById(id: number): Promise<SimplifiedEnrollment | null>;

  // Sistema de Certificados Acadêmicos - Cursos
  getAcademicCourses(filters?: { categoria?: string; status?: string }): Promise<AcademicCourse[]>;
  getAcademicCourseById(id: number): Promise<AcademicCourse | undefined>;
  createAcademicCourse(course: InsertAcademicCourse): Promise<AcademicCourse>;
  updateAcademicCourse(id: number, course: Partial<AcademicCourse>): Promise<AcademicCourse | undefined>;
  deleteAcademicCourse(id: number): Promise<void>;

  // Sistema de Certificados Acadêmicos - Professores
  getAcademicProfessors(): Promise<AcademicProfessor[]>;
  createAcademicProfessor(professor: InsertAcademicProfessor): Promise<AcademicProfessor>;
  updateAcademicProfessor(id: number, professor: Partial<AcademicProfessor>): Promise<AcademicProfessor | undefined>;

  // Sistema de Certificados Acadêmicos - Disciplinas
  getAcademicDisciplines(): Promise<AcademicDiscipline[]>;
  createAcademicDiscipline(discipline: InsertAcademicDiscipline): Promise<AcademicDiscipline>;
  updateAcademicDiscipline(id: number, discipline: Partial<AcademicDiscipline>): Promise<AcademicDiscipline | undefined>;
  deleteAcademicDiscipline(id: number): Promise<void>;
  
  // Sistema de Certificados Acadêmicos - Relacionamento Curso-Disciplina
  getCourseDisciplines(courseId: number): Promise<AcademicDiscipline[]>;
  addCourseDisciplines(courseId: number, disciplineIds: number[]): Promise<void>;
  removeCourseDisciplines(courseId: number, disciplineIds?: number[]): Promise<void>;

  // Sistema de Certificados Acadêmicos - Alunos
  getAcademicStudents(filters?: { courseId?: number; status?: string }): Promise<AcademicStudent[]>;
  getAcademicStudentById(id: number): Promise<AcademicStudent | undefined>;
  getAcademicStudentByNameOrCpf(name: string, cpf: string): Promise<AcademicStudent | undefined>;
  createAcademicStudent(student: InsertAcademicStudent): Promise<AcademicStudent>;
  updateAcademicStudent(id: number, student: Partial<AcademicStudent>): Promise<AcademicStudent | undefined>;

  // Sistema de Certificados Acadêmicos - Notas
  getAcademicGrades(studentId?: number, disciplineId?: number): Promise<AcademicGrade[]>;
  createAcademicGrade(grade: InsertAcademicGrade): Promise<AcademicGrade>;
  updateAcademicGrade(id: number, grade: Partial<AcademicGrade>): Promise<AcademicGrade | undefined>;

  // Sistema de Certificados Acadêmicos - Certificados
  getAcademicCertificates(filters?: { studentId?: number; courseId?: number; status?: string }): Promise<AcademicCertificate[]>;
  getAcademicCertificateById(id: number): Promise<AcademicCertificate | undefined>;
  createAcademicCertificate(certificate: InsertAcademicCertificate): Promise<AcademicCertificate>;
  updateAcademicCertificate(id: number, certificate: Partial<AcademicCertificate>): Promise<AcademicCertificate | undefined>;
  issueAcademicCertificate(id: number, emitidoPor: number): Promise<AcademicCertificate | undefined>;

  // Sistema de Modelos de Certificados
  getCertificateTemplates(filters?: { categoria?: string; tipo?: string; isActive?: boolean }): Promise<CertificateTemplate[]>;
  createCertificateTemplate(template: InsertCertificateTemplate): Promise<CertificateTemplate>;
  updateCertificateTemplate(id: number, template: Partial<CertificateTemplate>): Promise<CertificateTemplate | undefined>;
  deleteCertificateTemplate(id: number): Promise<void>;
  getCertificateTemplateById(id: number): Promise<CertificateTemplate | undefined>;
  
  // Sistema de Envios UNICV
  getEnviosUnicv(filters?: { search?: string; status?: string; categoria?: string }): Promise<EnvioUnicv[]>;
  createEnvioUnicv(envio: InsertEnvioUnicv): Promise<EnvioUnicv>;
  updateEnvioUnicv(id: number, envio: Partial<EnvioUnicv>): Promise<EnvioUnicv | undefined>;
  deleteEnvioUnicv(id: number): Promise<void>;
  getEnvioUnicvById(id: number): Promise<EnvioUnicv | undefined>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.name);
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

  async createUser(insertUser: InsertUser & { multiCompanyAccess?: any }): Promise<User> {
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

  async getAllRegistrationTokens(): Promise<any[]> {
    return await db
      .select({
        id: registrationTokens.id,
        token: registrationTokens.token,
        role: registrationTokens.role,
        createdBy: registrationTokens.createdBy,
        isUsed: registrationTokens.isUsed,
        usedBy: registrationTokens.usedBy,
        expiresAt: registrationTokens.expiresAt,
        createdAt: registrationTokens.createdAt,
        usedAt: registrationTokens.usedAt,
        // Dados do usuário que utilizou o token
        userName: users.name,
        userEmail: users.email,
        userCreatedAt: users.createdAt,
        userIsActive: users.isActive,
      })
      .from(registrationTokens)
      .leftJoin(users, eq(registrationTokens.usedBy, users.id))
      .orderBy(desc(registrationTokens.createdAt));
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
      .select()
      .from(users)
      .innerJoin(teamMembers, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId))
      .then(results => results.map(result => result.users));
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

    // Atualizar progresso das metas de atendimento
    if (newConversation.attendantId) {
      await this.updateGoalProgressForAttendance(newConversation.attendantId);
    }

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

  // Goal Progress
  async getGoalProgress(filters?: { goalId?: number; userId?: number; period?: string }): Promise<GoalProgress[]> {
    const conditions = [];
    
    if (filters?.goalId) {
      conditions.push(eq(goalProgress.goalId, filters.goalId));
    }
    if (filters?.userId) {
      conditions.push(eq(goalProgress.userId, filters.userId));
    }
    if (filters?.period) {
      conditions.push(eq(goalProgress.period, filters.period));
    }
    
    return await db.select().from(goalProgress)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(goalProgress.updatedAt));
  }

  async createGoalProgress(progress: InsertGoalProgress): Promise<GoalProgress> {
    const [newProgress] = await db
      .insert(goalProgress)
      .values({
        ...progress,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newProgress;
  }

  async updateGoalProgress(id: number, progress: Partial<GoalProgress>): Promise<GoalProgress | undefined> {
    const [updatedProgress] = await db
      .update(goalProgress)
      .set({ ...progress, updatedAt: new Date() })
      .where(eq(goalProgress.id, id))
      .returning();
    return updatedProgress || undefined;
  }

  async incrementGoalProgress(goalId: number, userId: number | null, period: string, increment: number = 1): Promise<GoalProgress> {
    // Buscar progresso existente
    const existingProgress = await db
      .select()
      .from(goalProgress)
      .where(
        and(
          eq(goalProgress.goalId, goalId),
          userId ? eq(goalProgress.userId, userId) : isNull(goalProgress.userId),
          eq(goalProgress.period, period)
        )
      )
      .limit(1);

    if (existingProgress.length > 0) {
      // Atualizar progresso existente
      const current = existingProgress[0];
      const newCurrent = current.current + increment;
      
      // Verificar se a meta foi atingida
      const goal = await db
        .select()
        .from(goals)
        .where(eq(goals.id, goalId))
        .limit(1);
      
      const achieved = goal.length > 0 && newCurrent >= goal[0].target;
      
      const [updated] = await db
        .update(goalProgress)
        .set({ 
          current: newCurrent, 
          achieved,
          updatedAt: new Date() 
        })
        .where(eq(goalProgress.id, current.id))
        .returning();
      
      return updated;
    } else {
      // Criar novo progresso
      const goal = await db
        .select()
        .from(goals)
        .where(eq(goals.id, goalId))
        .limit(1);
      
      const achieved = goal.length > 0 && increment >= goal[0].target;
      
      return await this.createGoalProgress({
        goalId,
        userId,
        current: increment,
        achieved,
        period
      });
    }
  }

  async checkGoalAchievements(userId?: number): Promise<any[]> {
    // Buscar metas recém-atingidas (achieved = true e não notificadas ainda)
    const query = db
      .select({
        goalId: goalProgress.goalId,
        userId: goalProgress.userId,
        current: goalProgress.current,
        achieved: goalProgress.achieved,
        period: goalProgress.period,
        goalTitle: goals.title,
        goalType: goals.type,
        goalPeriod: goals.period,
        goalReward: goals.reward,
        teamName: teams.name,
        userName: users.username
      })
      .from(goalProgress)
      .innerJoin(goals, eq(goalProgress.goalId, goals.id))
      .leftJoin(teams, eq(goals.teamId, teams.id))
      .leftJoin(users, eq(goalProgress.userId, users.id))
      .where(
        and(
          eq(goalProgress.achieved, true),
          userId ? eq(goalProgress.userId, userId) : undefined
        )
      );

    return await query;
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
  async getCertifications(filters?: { 
    modalidade?: string; 
    curso?: string; 
    status?: string; 
    categoria?: string; 
    subcategoria?: string;
    search?: string;
    page?: number;
    limit?: number;
    dataInicio?: string;
    dataFim?: string;
  }): Promise<{ data: Certification[], total: number, page: number, limit: number, totalPages: number }> {
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
      
      // Busca por nome, CPF ou curso (case-insensitive)
      if (filters.search && filters.search.trim()) {
        const searchTerm = `%${filters.search.trim().toLowerCase()}%`;
        conditions.push(
          or(
            sql`LOWER(${certifications.aluno}) LIKE ${searchTerm}`,
            sql`LOWER(${certifications.cpf}) LIKE ${searchTerm}`,
            sql`LOWER(${certifications.curso}) LIKE ${searchTerm}`
          )
        );
      }

      // Filtros de data
      if (filters.dataInicio) {
        conditions.push(gte(certifications.dataPrevista, filters.dataInicio));
      }
      if (filters.dataFim) {
        conditions.push(lte(certifications.dataPrevista, filters.dataFim));
      }
    }
    
    // Primeiro, contar o total
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(certifications);
    
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    
    const [countResult] = await countQuery;
    const total = countResult.count;
    
    // Então, buscar os dados paginados
    let query = db
      .select()
      .from(certifications)
      .orderBy(desc(certifications.createdAt));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Aplicar paginação
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    const offset = (page - 1) * limit;
    
    query = query.limit(limit).offset(offset);
    
    const data = await query;
    const totalPages = Math.ceil(total / limit);
    
    return {
      data,
      total,
      page,
      limit,
      totalPages
    };
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
        assignedAt: new Date(),
      })
      .returning();
    return assignment;
  }

  // Portal do Professor - Subject Contents
  async getSubjectContents(subjectId: number, professorId?: number): Promise<SubjectContent[]> {
    const conditions = [eq(subjectContents.subjectId, subjectId)];
    
    if (professorId) {
      conditions.push(eq(subjectContents.professorId, professorId));
    }

    return await db
      .select()
      .from(subjectContents)
      .where(and(...conditions))
      .orderBy(asc(subjectContents.ordem));
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
    const conditions = [eq(professorEvaluations.professorId, professorId)];
    
    if (subjectId) {
      conditions.push(eq(professorEvaluations.subjectId, subjectId));
    }

    return await db
      .select()
      .from(professorEvaluations)
      .where(and(...conditions))
      .orderBy(desc(professorEvaluations.createdAt));
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
      .values(question)
      .returning();
    return newQuestion;
  }

  async updateEvaluationQuestion(id: number, question: Partial<EvaluationQuestion>): Promise<EvaluationQuestion | undefined> {
    const [updatedQuestion] = await db
      .update(evaluationQuestions)
      .set(question)
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
      .values(submission)
      .returning();
    return newSubmission;
  }

  async updateEvaluationSubmission(id: number, submission: Partial<EvaluationSubmission>): Promise<EvaluationSubmission | undefined> {
    const [updatedSubmission] = await db
      .update(evaluationSubmissions)
      .set(submission)
      .where(eq(evaluationSubmissions.id, id))
      .returning();
    return updatedSubmission || undefined;
  }

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
  async getSimplifiedEnrollments(filters?: { status?: string; tenantId?: number; consultantId?: number }): Promise<SimplifiedEnrollment[]> {
    let query = db
      .select()
      .from(simplifiedEnrollments)
      .orderBy(desc(simplifiedEnrollments.createdAt));
    
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(simplifiedEnrollments.status, filters.status));
    }
    
    if (filters?.tenantId) {
      conditions.push(eq(simplifiedEnrollments.tenantId, filters.tenantId));
    }
    
    if (filters?.consultantId) {
      conditions.push(eq(simplifiedEnrollments.consultantId, filters.consultantId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
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
    await db.delete(simplifiedEnrollments).where(eq(simplifiedEnrollments.id, id));
  }

  async getSimplifiedEnrollmentById(id: number): Promise<SimplifiedEnrollment | null> {
    const [enrollment] = await db
      .select()
      .from(simplifiedEnrollments)
      .where(eq(simplifiedEnrollments.id, id))
      .limit(1);
    return enrollment || null;
  }

  // Sistema de Certificados Acadêmicos - Cursos
  async getAcademicCourses(filters?: { categoria?: string; status?: string }): Promise<AcademicCourse[]> {
    const conditions = [];
    
    if (filters?.categoria) {
      conditions.push(eq(academicCourses.categoria, filters.categoria));
    }
    
    if (filters?.status) {
      conditions.push(eq(academicCourses.status, filters.status));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(academicCourses).where(and(...conditions)).orderBy(desc(academicCourses.createdAt));
    }
    
    return await db.select().from(academicCourses).orderBy(desc(academicCourses.createdAt));
  }

  async getAcademicCourseById(id: number): Promise<AcademicCourse | undefined> {
    const [course] = await db
      .select()
      .from(academicCourses)
      .where(eq(academicCourses.id, id));
    return course || undefined;
  }

  async createAcademicCourse(course: InsertAcademicCourse): Promise<AcademicCourse> {
    const [newCourse] = await db
      .insert(academicCourses)
      .values({
        ...course,
        status: course.status || 'ativo',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newCourse;
  }

  async updateAcademicCourse(id: number, course: Partial<AcademicCourse>): Promise<AcademicCourse | undefined> {
    const [updatedCourse] = await db
      .update(academicCourses)
      .set({ ...course, updatedAt: new Date() })
      .where(eq(academicCourses.id, id))
      .returning();
    return updatedCourse || undefined;
  }

  async deleteAcademicCourse(id: number): Promise<void> {
    // Verificar se existem alunos associados ao curso
    const studentsInCourse = await db
      .select({ count: sql<number>`count(*)` })
      .from(academicStudents)
      .where(eq(academicStudents.courseId, id));
    
    const studentCount = Number(studentsInCourse[0]?.count || 0);
    
    if (studentCount > 0) {
      throw new Error(`Não é possível remover este curso pois existem ${studentCount} aluno(s) matriculado(s) nele. Remova ou transfira os alunos antes de deletar o curso.`);
    }
    
    await db.delete(academicCourses).where(eq(academicCourses.id, id));
  }

  // Sistema de Certificados Acadêmicos - Professores
  async getAcademicProfessors(): Promise<AcademicProfessor[]> {
    return await db
      .select()
      .from(academicProfessors)
      .where(eq(academicProfessors.isActive, true))
      .orderBy(asc(academicProfessors.nome));
  }

  async createAcademicProfessor(professor: InsertAcademicProfessor): Promise<AcademicProfessor> {
    const [newProfessor] = await db
      .insert(academicProfessors)
      .values({
        ...professor,
        isActive: professor.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newProfessor;
  }

  async updateAcademicProfessor(id: number, professor: Partial<AcademicProfessor>): Promise<AcademicProfessor | undefined> {
    const [updatedProfessor] = await db
      .update(academicProfessors)
      .set({ ...professor, updatedAt: new Date() })
      .where(eq(academicProfessors.id, id))
      .returning();
    return updatedProfessor || undefined;
  }

  // Sistema de Certificados Acadêmicos - Disciplinas
  async getAcademicDisciplines(): Promise<AcademicDiscipline[]> {
    return await db
      .select()
      .from(academicDisciplines)
      .where(eq(academicDisciplines.isActive, true))
      .orderBy(asc(academicDisciplines.nome));
  }

  async createAcademicDiscipline(discipline: InsertAcademicDiscipline): Promise<AcademicDiscipline> {
    const [newDiscipline] = await db
      .insert(academicDisciplines)
      .values({
        ...discipline,
        isActive: discipline.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    // Gerar código automaticamente baseado no ID
    const codigo = `DISC${newDiscipline.id.toString().padStart(3, '0')}`;
    
    // Atualizar a disciplina com o código gerado
    const [updatedDiscipline] = await db
      .update(academicDisciplines)
      .set({ codigo, updatedAt: new Date() })
      .where(eq(academicDisciplines.id, newDiscipline.id))
      .returning();
    
    return updatedDiscipline;
  }

  async updateAcademicDiscipline(id: number, discipline: Partial<AcademicDiscipline>): Promise<AcademicDiscipline | undefined> {
    const [updatedDiscipline] = await db
      .update(academicDisciplines)
      .set({ ...discipline, updatedAt: new Date() })
      .where(eq(academicDisciplines.id, id))
      .returning();
    return updatedDiscipline || undefined;
  }

  async deleteAcademicDiscipline(id: number): Promise<void> {
    // Primeiro, remove todos os relacionamentos curso-disciplina
    await db.delete(courseDisciplines).where(eq(courseDisciplines.disciplineId, id));
    
    // Depois, remove a disciplina
    await db.delete(academicDisciplines).where(eq(academicDisciplines.id, id));
  }

  // Sistema de Certificados Acadêmicos - Relacionamento Curso-Disciplina
  async getCourseDisciplines(courseId: number): Promise<AcademicDiscipline[]> {
    const result = await db
      .select()
      .from(academicDisciplines)
      .innerJoin(courseDisciplines, eq(courseDisciplines.disciplineId, academicDisciplines.id))
      .where(eq(courseDisciplines.courseId, courseId))
      .orderBy(asc(courseDisciplines.ordem));
    
    // Mapear apenas os campos da disciplina
    return result.map(row => row.academic_disciplines);
  }

  async addCourseDisciplines(courseId: number, disciplineIds: number[]): Promise<void> {
    // Primeiro, remove todas as disciplinas existentes do curso
    await db.delete(courseDisciplines).where(eq(courseDisciplines.courseId, courseId));
    
    // Depois, adiciona as novas disciplinas
    if (disciplineIds.length > 0) {
      const courseDisciplineData = disciplineIds.map((disciplineId, index) => ({
        courseId,
        disciplineId,
        ordem: index + 1,
        periodo: 1, // Padrão
        obrigatoria: true, // Padrão
      }));
      
      await db.insert(courseDisciplines).values(courseDisciplineData);
    }
  }

  async removeCourseDisciplines(courseId: number, disciplineIds?: number[]): Promise<void> {
    if (disciplineIds && disciplineIds.length > 0) {
      // Remove disciplinas específicas
      await db
        .delete(courseDisciplines)
        .where(
          and(
            eq(courseDisciplines.courseId, courseId),
            eq(courseDisciplines.disciplineId, disciplineIds[0]) // Simplificado para uma disciplina por vez
          )
        );
    } else {
      // Remove todas as disciplinas do curso
      await db.delete(courseDisciplines).where(eq(courseDisciplines.courseId, courseId));
    }
  }

  // Sistema de Certificados Acadêmicos - Alunos
  async getAcademicStudents(filters?: { courseId?: number; status?: string }): Promise<AcademicStudent[]> {
    const conditions = [];
    
    if (filters?.courseId) {
      conditions.push(eq(academicStudents.courseId, filters.courseId));
    }
    
    if (filters?.status) {
      conditions.push(eq(academicStudents.status, filters.status));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(academicStudents).where(and(...conditions)).orderBy(asc(academicStudents.nome));
    }
    
    return await db.select().from(academicStudents).orderBy(asc(academicStudents.nome));
  }

  async getAcademicStudentById(id: number): Promise<AcademicStudent | undefined> {
    const [student] = await db
      .select()
      .from(academicStudents)
      .where(eq(academicStudents.id, id));
    return student || undefined;
  }

  async getAcademicStudentByNameOrCpf(name: string, cpf: string): Promise<AcademicStudent | undefined> {
    const conditions = [eq(academicStudents.nome, name)];
    if (cpf && cpf.trim()) {
      conditions.push(eq(academicStudents.cpf, cpf));
    }
    
    const [student] = await db.select()
      .from(academicStudents)
      .where(or(...conditions));
    return student || undefined;
  }

  async createAcademicStudent(student: InsertAcademicStudent): Promise<AcademicStudent> {
    const [newStudent] = await db
      .insert(academicStudents)
      .values({
        ...student,
        status: student.status || 'cursando',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newStudent;
  }

  async updateAcademicStudent(id: number, student: Partial<AcademicStudent>): Promise<AcademicStudent | undefined> {
    const [updatedStudent] = await db
      .update(academicStudents)
      .set({ ...student, updatedAt: new Date() })
      .where(eq(academicStudents.id, id))
      .returning();
    return updatedStudent || undefined;
  }

  // Sistema de Certificados Acadêmicos - Notas
  async getAcademicGrades(studentId?: number, disciplineId?: number): Promise<AcademicGrade[]> {
    const conditions = [];
    
    if (studentId) {
      conditions.push(eq(academicGrades.studentId, studentId));
    }
    
    if (disciplineId) {
      conditions.push(eq(academicGrades.disciplineId, disciplineId));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(academicGrades).where(and(...conditions)).orderBy(desc(academicGrades.createdAt));
    }
    
    return await db.select().from(academicGrades).orderBy(desc(academicGrades.createdAt));
  }

  async createAcademicGrade(grade: InsertAcademicGrade): Promise<AcademicGrade> {
    const [newGrade] = await db
      .insert(academicGrades)
      .values({
        ...grade,
        status: grade.status || 'aprovado',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newGrade;
  }

  async updateAcademicGrade(id: number, grade: Partial<AcademicGrade>): Promise<AcademicGrade | undefined> {
    const [updatedGrade] = await db
      .update(academicGrades)
      .set({ ...grade, updatedAt: new Date() })
      .where(eq(academicGrades.id, id))
      .returning();
    return updatedGrade || undefined;
  }

  // Sistema de Certificados Acadêmicos - Certificados
  async getAcademicCertificates(filters?: { studentId?: number; courseId?: number; status?: string }): Promise<AcademicCertificate[]> {
    const conditions = [];
    
    if (filters?.studentId) {
      conditions.push(eq(academicCertificates.studentId, filters.studentId));
    }
    
    if (filters?.courseId) {
      conditions.push(eq(academicCertificates.courseId, filters.courseId));
    }
    
    if (filters?.status) {
      conditions.push(eq(academicCertificates.status, filters.status));
    }
    
    // Fazer JOIN com as tabelas relacionadas para incluir dados do aluno e curso
    const query = db.select({
      // Campos do certificado
      id: academicCertificates.id,
      studentId: academicCertificates.studentId,
      courseId: academicCertificates.courseId,
      templateId: academicCertificates.templateId,
      numeroRegistro: academicCertificates.numeroRegistro,
      dataEmissao: academicCertificates.dataEmissao,
      dataValidade: academicCertificates.dataValidade,
      dataSolicitacao: academicCertificates.dataSolicitacao,
      status: academicCertificates.status,
      observacoes: academicCertificates.observacoes,
      qrCodeHash: academicCertificates.qrCodeHash,
      linkValidacao: academicCertificates.linkValidacao,
      pdfUrl: academicCertificates.pdfUrl,
      registroId: academicCertificates.registroId,
      livro: academicCertificates.livro,
      folha: academicCertificates.folha,
      solicitadoPor: academicCertificates.solicitadoPor,
      autorizadoPor: academicCertificates.autorizadoPor,
      emitidoPor: academicCertificates.emitidoPor,
      createdAt: academicCertificates.createdAt,
      updatedAt: academicCertificates.updatedAt,
      // Dados do aluno
      student: {
        id: academicStudents.id,
        nome: academicStudents.nome,
        email: academicStudents.email,
        cpf: academicStudents.cpf,
        telefone: academicStudents.telefone,
        courseId: academicStudents.courseId,
        status: academicStudents.status,
        notaFinal: academicStudents.notaFinal,
        dataMatricula: academicStudents.dataMatricula
      },
      // Dados do curso
      course: {
        id: academicCourses.id,
        nome: academicCourses.nome,
        categoria: academicCourses.categoria,
        areaConhecimento: academicCourses.areaConhecimento,
        modalidade: academicCourses.modalidade,
        cargaHoraria: academicCourses.cargaHoraria,
        status: academicCourses.status
      }
    })
    .from(academicCertificates)
    .leftJoin(academicStudents, eq(academicCertificates.studentId, academicStudents.id))
    .leftJoin(academicCourses, eq(academicCertificates.courseId, academicCourses.id))
    .orderBy(desc(academicCertificates.createdAt));
    
    if (conditions.length > 0) {
      return await query.where(and(...conditions));
    }
    
    return await query;
  }

  async getAcademicCertificateById(id: number): Promise<AcademicCertificate | undefined> {
    const [certificate] = await db
      .select()
      .from(academicCertificates)
      .where(eq(academicCertificates.id, id));
    return certificate || undefined;
  }

  async createAcademicCertificate(certificate: InsertAcademicCertificate): Promise<AcademicCertificate> {
    const [newCertificate] = await db
      .insert(academicCertificates)
      .values({
        ...certificate,
        status: certificate.status || 'solicitado',
        qrCodeHash: certificate.qrCodeHash || randomUUID(),
        linkValidacao: certificate.linkValidacao || `https://sistema.edu.br/validar/${randomUUID()}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newCertificate;
  }

  async updateAcademicCertificate(id: number, certificate: Partial<AcademicCertificate>): Promise<AcademicCertificate | undefined> {
    const [updatedCertificate] = await db
      .update(academicCertificates)
      .set({ ...certificate, updatedAt: new Date() })
      .where(eq(academicCertificates.id, id))
      .returning();
    return updatedCertificate || undefined;
  }

  async issueAcademicCertificate(id: number, emitidoPor: number): Promise<AcademicCertificate | undefined> {
    const [updatedCertificate] = await db
      .update(academicCertificates)
      .set({ 
        status: 'emitido',
        emitidoPor,
        dataEmissao: new Date(),
        registroId: `REG-${Date.now()}`,
        pdfUrl: `https://certificados.edu.br/${id}/${randomUUID()}.pdf`,
        updatedAt: new Date()
      })
      .where(eq(academicCertificates.id, id))
      .returning();
    return updatedCertificate || undefined;
  }

  // Sistema de Modelos de Certificados
  async getCertificateTemplates(filters?: { categoria?: string; tipo?: string; isActive?: boolean }): Promise<CertificateTemplate[]> {
    const conditions = [];
    
    if (filters?.categoria) {
      conditions.push(eq(certificateTemplates.categoria, filters.categoria));
    }
    
    if (filters?.tipo) {
      conditions.push(eq(certificateTemplates.tipo, filters.tipo));
    }
    
    if (filters?.isActive !== undefined) {
      conditions.push(eq(certificateTemplates.isActive, filters.isActive));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(certificateTemplates).where(and(...conditions)).orderBy(desc(certificateTemplates.createdAt));
    }
    
    return await db.select().from(certificateTemplates).orderBy(desc(certificateTemplates.createdAt));
  }

  async createCertificateTemplate(template: InsertCertificateTemplate): Promise<CertificateTemplate> {
    const [newTemplate] = await db
      .insert(certificateTemplates)
      .values({
        ...template,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newTemplate;
  }

  async updateCertificateTemplate(id: number, template: Partial<CertificateTemplate>): Promise<CertificateTemplate | undefined> {
    const [updatedTemplate] = await db
      .update(certificateTemplates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(certificateTemplates.id, id))
      .returning();
    return updatedTemplate || undefined;
  }

  async deleteCertificateTemplate(id: number): Promise<void> {
    await db.delete(certificateTemplates).where(eq(certificateTemplates.id, id));
  }

  async getCertificateTemplateById(id: number): Promise<CertificateTemplate | undefined> {
    const [template] = await db.select().from(certificateTemplates).where(eq(certificateTemplates.id, id));
    return template || undefined;
  }

  // Métodos para Negociações
  async getNegociacoes(filters?: { search?: string; status?: string }): Promise<Negociacao[]> {
    const conditions = [];
    
    if (filters?.search) {
      conditions.push(
        or(
          ilike(negociacoes.clienteNome, `%${filters.search}%`),
          ilike(negociacoes.clienteCpf, `%${filters.search}%`)
        )
      );
    }
    
    if (filters?.status) {
      conditions.push(eq(negociacoes.status, filters.status));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(negociacoes).where(and(...conditions)).orderBy(desc(negociacoes.createdAt));
    }
    
    return await db.select().from(negociacoes).orderBy(desc(negociacoes.createdAt));
  }

  async createNegociacao(negociacao: InsertNegociacao): Promise<Negociacao> {
    // Preparar dados para inserção
    const insertData: any = { ...negociacao };
    
    // Converter valorNegociado para string se for number (para o tipo decimal do PostgreSQL)
    if (insertData.valorNegociado !== undefined && insertData.valorNegociado !== null) {
      insertData.valorNegociado = insertData.valorNegociado.toString();
    }
    
    // Para campos do tipo 'date' no Drizzle, garantir que sejam strings no formato YYYY-MM-DD
    if (insertData.dataNegociacao && typeof insertData.dataNegociacao === 'string') {
      insertData.dataNegociacao = insertData.dataNegociacao.split('T')[0];
    }
    if (insertData.previsaoPagamento && typeof insertData.previsaoPagamento === 'string') {
      insertData.previsaoPagamento = insertData.previsaoPagamento.split('T')[0];
    }
    if (insertData.dataVencimentoMaisAntiga && typeof insertData.dataVencimentoMaisAntiga === 'string') {
      insertData.dataVencimentoMaisAntiga = insertData.dataVencimentoMaisAntiga.split('T')[0];
    }
    
    const [newNegociacao] = await db
      .insert(negociacoes)
      .values({
        ...insertData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newNegociacao;
  }

  async updateNegociacao(id: number, negociacao: Partial<Negociacao>): Promise<Negociacao | undefined> {
    // Preparar dados para atualização - apenas campos que podem ser atualizados
    const allowedFields = [
      'clienteNome', 'clienteEmail', 'clienteCpf', 'clienteTelefone',
      'curso', 'categoria', 'dataNegociacao', 'previsaoPagamento',
      'parcelasAtraso', 'dataVencimentoMaisAntiga', 'valorNegociado',
      'gatewayPagamento', 'observacoes', 'colaboradorResponsavel',
      'origem', 'status'
    ];
    
    const updateData: any = {};
    
    // Filtrar apenas campos permitidos
    for (const field of allowedFields) {
      if (negociacao[field as keyof Negociacao] !== undefined) {
        updateData[field] = negociacao[field as keyof Negociacao];
      }
    }
    
    // Converter valorNegociado para string se for number (para o tipo decimal do PostgreSQL)
    if (updateData.valorNegociado !== undefined && updateData.valorNegociado !== null) {
      updateData.valorNegociado = updateData.valorNegociado.toString();
    }
    
    // Para campos do tipo 'date' no Drizzle, garantir que sejam strings no formato YYYY-MM-DD
    if (updateData.dataNegociacao && typeof updateData.dataNegociacao === 'string') {
      updateData.dataNegociacao = updateData.dataNegociacao.split('T')[0];
    }
    if (updateData.previsaoPagamento && typeof updateData.previsaoPagamento === 'string') {
      updateData.previsaoPagamento = updateData.previsaoPagamento.split('T')[0];
    }
    if (updateData.dataVencimentoMaisAntiga && typeof updateData.dataVencimentoMaisAntiga === 'string') {
      updateData.dataVencimentoMaisAntiga = updateData.dataVencimentoMaisAntiga.split('T')[0];
    }
    
    const [updatedNegociacao] = await db
      .update(negociacoes)
      .set(updateData)
      .where(eq(negociacoes.id, id))
      .returning();
    return updatedNegociacao || undefined;
  }

  async deleteNegociacao(id: number): Promise<void> {
    await db.delete(negociacoes).where(eq(negociacoes.id, id));
  }

  // Métodos para Negociações Expirados
  async getNegociacoesExpirados(filters?: { search?: string }): Promise<NegociacaoExpirado[]> {
    const conditions = [];
    
    if (filters?.search) {
      conditions.push(
        or(
          ilike(negociacoesExpirados.clienteNome, `%${filters.search}%`),
          ilike(negociacoesExpirados.curso, `%${filters.search}%`)
        )
      );
    }
    
    if (conditions.length > 0) {
      return await db.select().from(negociacoesExpirados).where(and(...conditions)).orderBy(desc(negociacoesExpirados.createdAt));
    }
    
    return await db.select().from(negociacoesExpirados).orderBy(desc(negociacoesExpirados.createdAt));
  }

  async createNegociacaoExpirado(expirado: InsertNegociacaoExpirado): Promise<NegociacaoExpirado> {
    const [newExpirado] = await db
      .insert(negociacoesExpirados)
      .values({
        ...expirado,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newExpirado;
  }

  async updateNegociacaoExpirado(id: number, expirado: Partial<NegociacaoExpirado>): Promise<NegociacaoExpirado | undefined> {
    const [updatedExpirado] = await db
      .update(negociacoesExpirados)
      .set({ ...expirado, updatedAt: new Date() })
      .where(eq(negociacoesExpirados.id, id))
      .returning();
    return updatedExpirado || undefined;
  }

  async deleteNegociacaoExpirado(id: number): Promise<void> {
    await db.delete(negociacoesExpirados).where(eq(negociacoesExpirados.id, id));
  }

  // Método para sincronizar com dados do Asaas e certificações
  async syncNegociacoesFromAsaasAndCertificacoes(): Promise<{ created: number; updated: number }> {
    let created = 0;
    let updated = 0;
    
    try {
      // Buscar clientes do Asaas com parcelas em atraso (simulação - tabela payments não existe no contexto atual)
      // Esta funcionalidade será implementada quando a integração Asaas estiver completa
      const paymentsWithDelay: any[] = [];
      
      for (const payment of paymentsWithDelay) {
        // Verificar se já existe negociação para este cliente
        const existingNegociacao = await db
          .select()
          .from(negociacoes)
          .where(
            and(
              eq(negociacoes.clienteNome, payment.customerName || ''),
              eq(negociacoes.origem, 'asaas')
            )
          );
        
        if (existingNegociacao.length === 0) {
          // Criar nova negociação
          await this.createNegociacao({
            clienteNome: payment.customerName || '',
            clienteEmail: payment.customerEmail || '',
            dataNegociacao: new Date().toISOString().split('T')[0],
            previsaoPagamento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias a partir de hoje
            parcelasAtraso: 1,
            dataVencimentoMaisAntiga: payment.dueDate?.toISOString().split('T')[0] || '',
            observacoes: `Importado automaticamente do Asaas - Pagamento ID: ${payment.externalId}`,
            colaboradorResponsavel: 'Sistema',
            origem: 'asaas',
            status: 'ativo'
          });
          created++;
        }
      }
      
      // Buscar certificações pendentes/problemas para negociação
      const problematicCertifications = await db
        .select()
        .from(certifications)
        .where(
          or(
            eq(certifications.status, 'pendente'),
            eq(certifications.financeiro, 'Pendente'),
            eq(certifications.financeiro, 'Em atraso')
          )
        );
        
      for (const cert of problematicCertifications) {
        // Verificar se já existe negociação para esta certificação
        const existingNegociacao = await db
          .select()
          .from(negociacoes)
          .where(
            and(
              eq(negociacoes.clienteNome, cert.aluno),
              eq(negociacoes.origem, 'certificacao')
            )
          );
        
        if (existingNegociacao.length === 0) {
          await this.createNegociacao({
            clienteNome: cert.aluno,
            clienteCpf: cert.cpf || '',
            curso: cert.curso || '',
            categoria: cert.categoria,
            dataNegociacao: new Date().toISOString().split('T')[0],
            previsaoPagamento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 dias
            parcelasAtraso: 0,
            observacoes: `Certificação com problemas financeiros - Status: ${cert.financeiro}`,
            colaboradorResponsavel: 'Sistema',
            origem: 'certificacao',
            status: 'ativo'
          });
          created++;
        }
      }
      
    } catch (error) {
      console.error('Erro ao sincronizar negociações:', error);
    }
    
    return { created, updated };
  }

  // Sistema de Envios UNICV
  async getEnviosUnicv(filters?: { search?: string; status?: string; categoria?: string }): Promise<EnvioUnicv[]> {
    const conditions = [];
    
    if (filters?.search) {
      conditions.push(
        or(
          ilike(enviosUnicv.aluno, `%${filters.search}%`),
          ilike(enviosUnicv.cpf, `%${filters.search}%`),
          ilike(enviosUnicv.curso, `%${filters.search}%`)
        )
      );
    }
    
    if (filters?.status) {
      conditions.push(eq(enviosUnicv.statusEnvio, filters.status));
    }
    
    if (filters?.categoria) {
      conditions.push(eq(enviosUnicv.categoria, filters.categoria));
    }
    
    if (conditions.length > 0) {
      return await db.select().from(enviosUnicv).where(and(...conditions)).orderBy(desc(enviosUnicv.createdAt));
    }
    
    return await db.select().from(enviosUnicv).orderBy(desc(enviosUnicv.createdAt));
  }

  async createEnvioUnicv(envio: InsertEnvioUnicv): Promise<EnvioUnicv> {
    const [newEnvio] = await db
      .insert(enviosUnicv)
      .values({
        ...envio,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return newEnvio;
  }

  async updateEnvioUnicv(id: number, envio: Partial<EnvioUnicv>): Promise<EnvioUnicv | undefined> {
    const [updatedEnvio] = await db
      .update(enviosUnicv)
      .set({ ...envio, updatedAt: new Date() })
      .where(eq(enviosUnicv.id, id))
      .returning();
    return updatedEnvio || undefined;
  }

  async deleteEnvioUnicv(id: number): Promise<void> {
    await db.delete(enviosUnicv).where(eq(enviosUnicv.id, id));
  }

  async getEnvioUnicvById(id: number): Promise<EnvioUnicv | undefined> {
    const [envio] = await db.select().from(enviosUnicv).where(eq(enviosUnicv.id, id));
    return envio || undefined;
  }
  // Sistema de monitoramento automático das metas
  async updateGoalProgressForAttendance(userId: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const thisWeek = `${new Date().getFullYear()}-W${Math.ceil((new Date().getDate() - new Date().getDay() + 1) / 7).toString().padStart(2, '0')}`;
    const thisMonth = new Date().toISOString().slice(0, 7);

    // Buscar metas de atendimento para este usuário
    const userGoals = await db
      .select()
      .from(goals)
      .where(
        and(
          eq(goals.isActive, true),
          eq(goals.indicator, 'atendimentos'),
          or(
            eq(goals.userId, userId),
            and(
              eq(goals.type, 'team'),
              sql`${goals.teamId} IN (SELECT team_id FROM team_members WHERE user_id = ${userId})`
            )
          )
        )
      );

    // Atualizar progresso para cada meta
    for (const goal of userGoals) {
      let period = today; // padrão daily
      
      if (goal.period === 'weekly') {
        period = thisWeek;
      } else if (goal.period === 'monthly') {
        period = thisMonth;
      }

      const targetUserId = goal.type === 'individual' ? userId : null;
      
      await this.incrementGoalProgress(goal.id, targetUserId, period, 1);
    }
  }

  async getCurrentPeriod(period: string): Promise<string> {
    const now = new Date();
    
    switch (period) {
      case 'daily':
        return now.toISOString().split('T')[0]; // YYYY-MM-DD
      case 'weekly':
        const year = now.getFullYear();
        const week = Math.ceil((now.getDate() - now.getDay() + 1) / 7);
        return `${year}-W${week.toString().padStart(2, '0')}`;
      case 'monthly':
        return now.toISOString().slice(0, 7); // YYYY-MM
      default:
        return now.toISOString().split('T')[0];
    }
  }
}

export const storage = new DatabaseStorage();
