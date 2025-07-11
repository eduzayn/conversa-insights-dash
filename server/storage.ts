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
  type InsertCertificateTemplate
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, asc, like, count, isNotNull } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
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

  async getAllRegistrationTokens(): Promise<RegistrationToken[]> {
    return await db
      .select()
      .from(registrationTokens)
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
  async getCertifications(filters?: { 
    modalidade?: string; 
    curso?: string; 
    status?: string; 
    categoria?: string; 
    subcategoria?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<Certification[]> {
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
      
      // Busca por nome, CPF ou curso
      if (filters.search && filters.search.trim()) {
        const searchTerm = `%${filters.search.trim()}%`;
        conditions.push(
          or(
            like(certifications.aluno, searchTerm),
            like(certifications.cpf, searchTerm),
            like(certifications.curso, searchTerm)
          )
        );
      }
    }
    
    let query = db
      .select()
      .from(certifications)
      .orderBy(desc(certifications.createdAt));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Aplicar paginação
    if (filters?.page && filters?.limit) {
      const offset = (filters.page - 1) * filters.limit;
      query = query.limit(filters.limit).offset(offset);
    }
    
    return await query;
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
    return newDiscipline;
  }

  async updateAcademicDiscipline(id: number, discipline: Partial<AcademicDiscipline>): Promise<AcademicDiscipline | undefined> {
    const [updatedDiscipline] = await db
      .update(academicDisciplines)
      .set({ ...discipline, updatedAt: new Date() })
      .where(eq(academicDisciplines.id, id))
      .returning();
    return updatedDiscipline || undefined;
  }

  // Sistema de Certificados Acadêmicos - Relacionamento Curso-Disciplina
  async getCourseDisciplines(courseId: number): Promise<AcademicDiscipline[]> {
    const result = await db
      .select({
        id: academicDisciplines.id,
        nome: academicDisciplines.nome,
        codigo: academicDisciplines.codigo,
        professorId: academicDisciplines.professorId,
        cargaHoraria: academicDisciplines.cargaHoraria,
        ementa: academicDisciplines.ementa,
        objetivos: academicDisciplines.objetivos,
        courseId: academicDisciplines.courseId,
        ordem: academicDisciplines.ordem,
        isActive: academicDisciplines.isActive,
        createdAt: academicDisciplines.createdAt,
        updatedAt: academicDisciplines.updatedAt,
      })
      .from(academicDisciplines)
      .innerJoin(courseDisciplines, eq(courseDisciplines.disciplineId, academicDisciplines.id))
      .where(eq(courseDisciplines.courseId, courseId))
      .orderBy(asc(courseDisciplines.ordem));
    
    return result;
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
    
    if (conditions.length > 0) {
      return await db.select().from(academicCertificates).where(and(...conditions)).orderBy(desc(academicCertificates.createdAt));
    }
    
    return await db.select().from(academicCertificates).orderBy(desc(academicCertificates.createdAt));
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
}

export const storage = new DatabaseStorage();
