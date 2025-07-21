import { pgTable, text, serial, integer, boolean, timestamp, json, uuid, varchar, date, decimal } from "drizzle-orm/pg-core";
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
  role: text("role").notNull().default("agent"), // admin, agent, aluno, professor, conteudista, coordenador
  companyAccount: text("company_account"), // COMERCIAL, SUPORTE (mantido para compatibilidade)
  department: text("department"), // Comercial, Cobrança, Suporte, etc. (mantido para compatibilidade)
  multiCompanyAccess: json("multi_company_access"), // {"COMERCIAL": {"active": true, "departments": ["comercial"]}, "SUPORTE": {"active": true, "departments": ["tutoria"]}}
  isActive: boolean("is_active").notNull().default(true),
  // Campos específicos para alunos
  cpf: text("cpf"),
  telefone: text("telefone"),
  dataNascimento: date("data_nascimento"),
  endereco: text("endereco"),
  cidade: text("cidade"),
  estado: text("estado"),
  cep: text("cep"),
  fotoUrl: text("foto_url"),
  matriculaAtiva: boolean("matricula_ativa").default(true),
  documentacaoStatus: text("documentacao_status").default("pendente"), // pendente, deferida, indeferida
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tokens de cadastro
export const registrationTokens = pgTable("registration_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  role: text("role").notNull().default("agent"), // admin, agent
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
  companyAccount: text("company_account").notNull().default("COMERCIAL"), // COMERCIAL ou SUPORTE
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
  // Classificação CRM do resultado
  resultado: text("resultado"), // venda_ganha, venda_perdida, aluno_satisfeito, sem_solucao, resolvido
  customerName: text("customer_name"), // Nome do cliente
  customerPhone: text("customer_phone"), // Telefone do cliente
  // Informações do atendente BotConversa
  botconversaManagerId: integer("botconversa_manager_id"), // ID do manager no BotConversa
  botconversaManagerName: text("botconversa_manager_name"), // Nome do manager no BotConversa
  botconversaManagerEmail: text("botconversa_manager_email"), // Email do manager no BotConversa
  companyAccount: text("company_account"), // COMERCIAL (182301) ou SUPORTE (182331)
  // Campos específicos de atendimento
  hora: text("hora"), // Horário do atendimento
  atendente: text("atendente"), // Nome do atendente
  equipe: text("equipe"), // Equipe responsável
  duracao: text("duracao"), // Duração do atendimento
  assunto: text("assunto"), // Assunto do atendimento
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
  externalId: text("external_id"), // ID da mensagem no BotConversa
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

// Certificações
export const certifications = pgTable("certifications", {
  id: serial("id").primaryKey(),
  inicio: text("inicio"), // Coluna Início (prioridade)
  aluno: text("aluno").notNull(),
  cpf: text("cpf"),
  modalidade: text("modalidade"), // Segunda Licenciatura, Pós-Graduação, etc.
  curso: text("curso"),
  financeiro: text("financeiro"),
  documentacao: text("documentacao"),
  plataforma: text("plataforma"),
  tutoria: text("tutoria"),
  observacao: text("observacao"),
  inicioCertificacao: text("inicio_certificacao"),
  dataPrevista: text("data_prevista"),
  dataEntrega: text("data_entrega"),
  diploma: text("diploma"),
  status: text("status").notNull().default("pendente"), // pendente, em_analise, concluida, entregue
  categoria: text("categoria").notNull().default("geral"), // geral, pos_graduacao, segunda_licenciatura, formacao_livre, eja, graduacao, diplomacao_competencia, capacitacao, sequencial
  prioridade: text("prioridade").default("mediana"), // urgente, mediana, normal
  situacaoAnalise: text("situacao_analise"), // Status da análise completa
  dataInicio: date("data_inicio"),
  dataExpiracao: date("data_expiracao"),
  extensaoContratada: boolean("extensao_contratada").default(false),
  extensaoData: date("extensao_data"),
  disciplinasRestantes: integer("disciplinas_restantes"),
  telefone: text("telefone"),
  cargaHoraria: integer("carga_horaria"), // Campo para carga horária do curso
  tcc: text("tcc").default("nao_possui"), // nao_possui, aprovado, reprovado, em_correcao
  praticasPedagogicas: text("praticas_pedagogicas").default("nao_possui"), // nao_possui, aprovado, reprovado, em_correcao
  estagio: text("estagio").default("nao_possui"), // nao_possui, aprovado, reprovado, em_correcao
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para histórico de alterações
export const certificationHistory = pgTable("certification_history", {
  id: serial("id").primaryKey(),
  certificationId: integer("certification_id").references(() => certifications.id).notNull(),
  campo: text("campo").notNull(),
  valorAnterior: text("valor_anterior"),
  valorNovo: text("valor_novo"),
  usuarioId: integer("usuario_id").references(() => users.id),
  alteradoEm: timestamp("alterado_em").defaultNow(),
});

// Tabela para documentos relacionados
export const certificationDocuments = pgTable("certification_documents", {
  id: serial("id").primaryKey(),
  certificationId: integer("certification_id").references(() => certifications.id).notNull(),
  tipoDocumento: text("tipo_documento").notNull(),
  nomeArquivo: text("nome_arquivo"),
  status: text("status").default("pendente"), // pendente, enviado, aprovado, rejeitado
  dataEnvio: timestamp("data_envio"),
  dataAprovacao: timestamp("data_aprovacao"),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela para cursos pré-cadastrados
export const preRegisteredCourses = pgTable("pre_registered_courses", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  modalidade: text("modalidade").notNull(), // Pós-graduação, etc.
  categoria: text("categoria").notNull(), // pos_graduacao, segunda_licenciatura, etc.
  cargaHoraria: integer("carga_horaria").notNull(),
  area: text("area"), // Gestão Escolar, Saúde Mental, etc.
  ativo: boolean("ativo").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para negociações
export const negociacoes = pgTable("negociacoes", {
  id: serial("id").primaryKey(),
  clienteNome: text("cliente_nome").notNull(),
  clienteEmail: text("cliente_email"),
  clienteCpf: text("cliente_cpf"),
  clienteTelefone: text("cliente_telefone"),
  curso: text("curso"),
  categoria: text("categoria"),
  dataNegociacao: date("data_negociacao").notNull(),
  previsaoPagamento: date("previsao_pagamento").notNull(),
  parcelasAtraso: integer("parcelas_atraso").notNull().default(0),
  dataVencimentoMaisAntiga: date("data_vencimento_mais_antiga"),
  valorNegociado: decimal("valor_negociado", { precision: 10, scale: 2 }),
  gatewayPagamento: text("gateway_pagamento"),
  observacoes: text("observacoes"),
  colaboradorResponsavel: text("colaborador_responsavel").notNull(),
  origem: text("origem").notNull().default("certificacao"), // asaas, certificacao
  status: text("status").notNull().default("aguardando_pagamento"), // aguardando_pagamento, recebido, acordo_quebrado
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para cursos expirados
export const negociacoesExpirados = pgTable("negociacoes_expirados", {
  id: serial("id").primaryKey(),
  clienteNome: text("cliente_nome").notNull(),
  clienteEmail: text("cliente_email"),
  clienteCpf: text("cliente_cpf"),
  curso: text("curso").notNull(),
  categoria: text("categoria").notNull(),
  dataExpiracao: date("data_expiracao").notNull(),
  dataProposta: date("data_proposta"),
  dataPrevisaPagamento: date("data_previsa_pagamento"),
  propostaReativacao: text("proposta_reativacao"),
  valorProposta: decimal("valor_proposta", { precision: 10, scale: 2 }),
  statusProposta: text("status_proposta").notNull().default("pendente"), // pendente, enviada, aceita, rejeitada
  observacoes: text("observacoes"),
  colaboradorResponsavel: text("colaborador_responsavel").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para envios UNICV
export const enviosUnicv = pgTable("envios_unicv", {
  id: serial("id").primaryKey(),
  certificationId: integer("certification_id").notNull().references(() => certifications.id),
  aluno: text("aluno").notNull(),
  cpf: text("cpf").notNull(),
  curso: text("curso").notNull(),
  categoria: text("categoria").notNull(),
  statusEnvio: text("status_envio").notNull().default("nao_enviado"), // nao_enviado, enviado, concluido, retornado_pendencia
  numeroOficio: text("numero_oficio"),
  dataEnvio: date("data_envio"),
  observacoes: text("observacoes"),
  colaboradorResponsavel: text("colaborador_responsavel").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schemas Zod para envios UNICV
export const insertEnvioUnicvSchema = createInsertSchema(enviosUnicv)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export type EnvioUnicv = typeof enviosUnicv.$inferSelect;
export type InsertEnvioUnicv = z.infer<typeof insertEnvioUnicvSchema>;

// Tabela para envios FAMAR
export const enviosFamar = pgTable("envios_famar", {
  id: serial("id").primaryKey(),
  certificationId: integer("certification_id").notNull().references(() => certifications.id),
  aluno: text("aluno").notNull(),
  cpf: text("cpf").notNull(),
  curso: text("curso").notNull(),
  categoria: text("categoria").notNull(),
  statusEnvio: text("status_envio").notNull().default("nao_enviado"), // nao_enviado, enviado, concluido, retornado_pendencia
  numeroOficio: text("numero_oficio"),
  dataEnvio: date("data_envio"),
  observacoes: text("observacoes"),
  colaboradorResponsavel: text("colaborador_responsavel").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schemas Zod para envios FAMAR
export const insertEnvioFamarSchema = createInsertSchema(enviosFamar)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export type EnvioFamar = typeof enviosFamar.$inferSelect;
export type InsertEnvioFamar = z.infer<typeof insertEnvioFamarSchema>;

// Tabela para matrículas dos alunos
export const studentEnrollments = pgTable("student_enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  courseId: integer("course_id").notNull().references(() => preRegisteredCourses.id),
  certificationId: integer("certification_id").references(() => certifications.id),
  status: text("status").notNull().default("ativo"), // ativo, concluido, trancado, cancelado
  progresso: integer("progresso").default(0), // 0-100%
  dataMatricula: timestamp("data_matricula").defaultNow(),
  dataInicio: timestamp("data_inicio"),
  dataConclusao: timestamp("data_conclusao"),
  notaFinal: integer("nota_final"), // 0-100
  linkPlataforma: text("link_plataforma"),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para avaliações dos alunos
export const studentEvaluations = pgTable("student_evaluations", {
  id: serial("id").primaryKey(),
  enrollmentId: integer("enrollment_id").notNull().references(() => studentEnrollments.id),
  tipoAvaliacao: text("tipo_avaliacao").notNull(), // prova, trabalho, tcc, praticas_pedagogicas, estagio
  titulo: text("titulo").notNull(),
  nota: integer("nota"), // 0-100
  status: text("status").notNull().default("pendente"), // pendente, aprovado, reprovado, em_correcao
  dataAplicacao: timestamp("data_aplicacao"),
  dataCorrecao: timestamp("data_correcao"),
  feedbackTutor: text("feedback_tutor"),
  tentativas: integer("tentativas").default(1),
  peso: integer("peso").default(1), // peso da avaliação na nota final
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para documentos do aluno
export const studentDocuments = pgTable("student_documents", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  tipoDocumento: text("tipo_documento").notNull(), // rg, cpf, historico_escolar, diploma, certificado
  nomeArquivo: text("nome_arquivo").notNull(),
  urlArquivo: text("url_arquivo").notNull(),
  status: text("status").default("pendente"), // pendente, deferido, indeferido
  dataEnvio: timestamp("data_envio").defaultNow(),
  dataAnalise: timestamp("data_analise"),
  observacoes: text("observacoes"),
  analisadoPor: integer("analisado_por").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para pagamentos do aluno
export const studentPayments = pgTable("student_payments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  enrollmentId: integer("enrollment_id").references(() => studentEnrollments.id),
  valor: integer("valor").notNull(), // valor em centavos
  descricao: text("descricao").notNull(),
  status: text("status").notNull().default("pendente"), // pendente, pago, vencido, cancelado
  dataVencimento: timestamp("data_vencimento").notNull(),
  dataPagamento: timestamp("data_pagamento"),
  metodoPagamento: text("metodo_pagamento"), // boleto, cartao, pix
  referencia: text("referencia"), // número do boleto, referência do pagamento
  urlBoleto: text("url_boleto"),
  isRecorrente: boolean("is_recorrente").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para modelos de certificados acadêmicos
export const certificateTemplates = pgTable("certificate_templates", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  categoria: text("categoria").notNull(), // pos_graduacao, segunda_licenciatura, formacao_pedagogica
  tipo: text("tipo").notNull().default("completo"), // completo, frente, verso
  htmlTemplate: text("html_template").notNull(), // Template HTML/CSS da frente
  templateVerso: text("template_verso").notNull(), // Template HTML/CSS do verso (histórico escolar)
  variaveis: json("variaveis").notNull().default([]), // Array de variáveis disponíveis
  instituicaoNome: text("instituicao_nome").notNull().default("Instituição de Ensino Superior"),
  instituicaoEndereco: text("instituicao_endereco"),
  instituicaoLogo: text("instituicao_logo"),
  assinaturaDigital1: text("assinatura_digital_1"),
  assinaturaDigital2: text("assinatura_digital_2"),
  textoLegal: text("texto_legal").notNull(),
  qrCodePosition: text("qr_code_position").notNull().default("bottom-right"), // bottom-right, bottom-left, bottom-center
  orientation: text("orientation").notNull().default("portrait"), // portrait, landscape
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para certificados dos alunos
export const studentCertificates = pgTable("student_certificates", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  enrollmentId: integer("enrollment_id").notNull().references(() => studentEnrollments.id),
  tipoCertificado: text("tipo_certificado").notNull(), // certificado, diploma, declaracao
  titulo: text("titulo").notNull(),
  status: text("status").notNull().default("processando"), // processando, disponivel, solicitado
  urlDownload: text("url_download"),
  codigoVerificacao: text("codigo_verificacao").unique(),
  dataEmissao: timestamp("data_emissao"),
  dataSolicitacao: timestamp("data_solicitacao").defaultNow(),
  validoAte: timestamp("valido_ate"),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para carteirinha do aluno (QR Code)
export const studentCards = pgTable("student_cards", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => users.id),
  numeroCarteirinha: text("numero_carteirinha").notNull().unique(),
  tokenValidacao: text("token_validacao").notNull().unique(),
  qrCodeData: text("qr_code_data").notNull(),
  status: text("status").notNull().default("ativa"), // ativa, inativa, expirada
  validoAte: timestamp("valido_ate").notNull(),
  fotoUrl: text("foto_url"),
  cursoAtual: text("curso_atual"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===== SISTEMA DE EMISSÃO DE CERTIFICADOS ACADÊMICOS =====

// Cursos acadêmicos (diferentes dos cursos pré-cadastrados)
export const academicCourses = pgTable("academic_courses", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  categoria: text("categoria").notNull(), // Pós-Graduação, Segunda Licenciatura, etc.
  areaConhecimento: text("areaconhecimento").notNull(), // Saúde Mental, Educação, etc.
  modalidade: text("modalidade").notNull(), // EAD, Presencial, Híbrido
  cargaHoraria: integer("cargahoraria"),
  duracao: text("duracao"),
  preco: integer("preco"), // em centavos
  status: text("status").notNull().default("ativo"),
  coordenadorId: integer("coordenadorid"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Professores/Corpo Docente
export const academicProfessors = pgTable("academic_professors", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  titulacao: text("titulacao"),
  especializacao: text("especializacao"),
  biografia: text("biografia"),
  isActive: boolean("isactive").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Disciplinas acadêmicas (independentes de curso)
export const academicDisciplines = pgTable("academic_disciplines", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  codigo: text("codigo"),
  professorId: integer("professorid").references(() => academicProfessors.id),
  cargaHoraria: integer("cargahoraria"),
  ementa: text("ementa"),
  prerequeisitos: text("prerequeisitos").array(), // array de strings com pré-requisitos
  status: text("status").default("ativo"), // ativo, inativo, em_desenvolvimento
  isActive: boolean("isactive").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela de junção - Relacionamento muitos-para-muitos entre cursos e disciplinas
export const courseDisciplines = pgTable("course_disciplines", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => academicCourses.id),
  disciplineId: integer("discipline_id").notNull().references(() => academicDisciplines.id),
  ordem: integer("ordem").default(1), // ordem da disciplina no curso
  periodo: integer("periodo").default(1), // em qual período a disciplina é oferecida
  obrigatoria: boolean("obrigatoria").default(true), // se é obrigatória ou optativa para este curso
  createdAt: timestamp("created_at").defaultNow(),
});

// Alunos dos cursos acadêmicos
export const academicStudents = pgTable("academic_students", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  email: text("email").notNull(),
  cpf: text("cpf").notNull(),
  telefone: text("telefone"),
  dataNascimento: date("datanascimento"),
  endereco: text("endereco"),
  courseId: integer("courseid").notNull().references(() => academicCourses.id),
  dataMatricula: date("datamatricula"),
  status: text("status").notNull().default("cursando"), // cursando, concluido, evadido, trancado
  notaFinal: integer("notafinal"), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notas por disciplina
export const academicGrades = pgTable("academic_grades", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => academicStudents.id),
  disciplineId: integer("discipline_id").notNull().references(() => academicDisciplines.id),
  nota: integer("nota").notNull(), // 0-100
  frequencia: integer("frequencia").notNull(), // 0-100
  status: text("status").notNull().default("aprovado"), // aprovado, reprovado, cursando
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Certificados acadêmicos emitidos
export const academicCertificates = pgTable("academic_certificates", {
  id: serial("id").primaryKey(),
  studentId: integer("studentid").notNull().references(() => academicStudents.id),
  courseId: integer("courseid").notNull().references(() => academicCourses.id),
  templateId: integer("templateid").references(() => certificateTemplates.id),
  numeroRegistro: text("numeroregistro"),
  dataEmissao: date("dataemissao"),
  dataValidade: date("datavalidade"),
  dataSolicitacao: date("datasolicitacao").defaultNow(),
  status: text("status").notNull().default("solicitado"), // solicitado, autorizado, emitido, revogado
  observacoes: text("observacoes"),
  qrCodeHash: text("qrcodehash"),
  linkValidacao: text("linkvalidacao"),
  pdfUrl: text("pdfurl"),
  registroId: text("registroid"),
  livro: text("livro"), // Livro de registro
  folha: text("folha"), // Folha de registro
  solicitadoPor: integer("solicitadopor").references(() => users.id), // Quem solicitou
  autorizadoPor: integer("autorizadopor").references(() => users.id), // Quem autorizou
  emitidoPor: integer("emitidopor").references(() => users.id), // Quem emitiu
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ===== TABELAS DO PORTAL DO PROFESSOR =====

// Disciplinas que os professores podem ministrar
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  codigo: text("codigo").notNull().unique(),
  descricao: text("descricao"),
  cargaHoraria: integer("carga_horaria").notNull(),
  area: text("area").notNull(), // Exatas, Humanas, Biologicas, etc.
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relacionamento professor-disciplina
export const professorSubjects = pgTable("professor_subjects", {
  id: serial("id").primaryKey(),
  professorId: integer("professor_id").notNull().references(() => users.id),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  canEdit: boolean("can_edit").notNull().default(true),
  assignedAt: timestamp("assigned_at").defaultNow(),
});

// Conteúdos das disciplinas (vídeos, e-books, links)
export const subjectContents = pgTable("subject_contents", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  professorId: integer("professor_id").notNull().references(() => users.id),
  titulo: text("titulo").notNull(),
  tipo: text("tipo").notNull(), // video, ebook, link, pdf
  conteudo: text("conteudo").notNull(), // URL do YouTube, Google Drive, etc.
  descricao: text("descricao"),
  ordem: integer("ordem").default(0),
  isActive: boolean("is_active").notNull().default(true),
  visualizacoes: integer("visualizacoes").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Avaliações criadas pelos professores
export const professorEvaluations = pgTable("professor_evaluations", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  professorId: integer("professor_id").notNull().references(() => users.id),
  titulo: text("titulo").notNull(),
  tipo: text("tipo").notNull(), // avaliacao, simulado, tarefa
  descricao: text("descricao"),
  tempoLimite: integer("tempo_limite"), // em minutos
  tentativasPermitidas: integer("tentativas_permitidas").default(1),
  notaMinima: integer("nota_minima").default(60),
  embaralharQuestoes: boolean("embaralhar_questoes").default(true),
  mostrarResultado: boolean("mostrar_resultado").default(true),
  isActive: boolean("is_active").notNull().default(true),
  dataAbertura: timestamp("data_abertura"),
  dataFechamento: timestamp("data_fechamento"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Questões das avaliações
export const evaluationQuestions = pgTable("evaluation_questions", {
  id: serial("id").primaryKey(),
  evaluationId: integer("evaluation_id").notNull().references(() => professorEvaluations.id),
  enunciado: text("enunciado").notNull(),
  tipo: text("tipo").notNull().default("multipla_escolha"), // multipla_escolha, verdadeiro_falso, texto_livre
  alternativas: json("alternativas"), // Array de alternativas para múltipla escolha
  gabarito: text("gabarito").notNull(), // Resposta correta
  explicacao: text("explicacao"), // Explicação do gabarito
  peso: integer("peso").default(1),
  ordem: integer("ordem").default(0),
  imagemUrl: text("imagem_url"), // Imagem da questão
  createdAt: timestamp("created_at").defaultNow(),
});

// Submissões de alunos nas avaliações
export const evaluationSubmissions = pgTable("evaluation_submissions", {
  id: serial("id").primaryKey(),
  evaluationId: integer("evaluation_id").notNull().references(() => professorEvaluations.id),
  studentId: integer("student_id").notNull().references(() => users.id),
  respostas: json("respostas").notNull(), // {questionId: resposta}
  nota: integer("nota"),
  tempoGasto: integer("tempo_gasto"), // em minutos
  tentativa: integer("tentativa").default(1),
  status: text("status").notNull().default("pendente"), // pendente, corrigida, revisao
  iniciadaEm: timestamp("iniciada_em").defaultNow(),
  finalizadaEm: timestamp("finalizada_em"),
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
  // Relações para alunos
  enrollments: many(studentEnrollments),
  documents: many(studentDocuments),
  payments: many(studentPayments),
  certificates: many(studentCertificates),
  card: one(studentCards, { fields: [users.id], references: [studentCards.studentId] }),
  // Relações para professores
  professorSubjects: many(professorSubjects),
  subjectContents: many(subjectContents),
  evaluations: many(professorEvaluations),
  evaluationSubmissions: many(evaluationSubmissions),
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

// Relações para as novas tabelas do Portal do Aluno
export const studentEnrollmentsRelations = relations(studentEnrollments, ({ many, one }) => ({
  student: one(users, { fields: [studentEnrollments.studentId], references: [users.id] }),
  course: one(preRegisteredCourses, { fields: [studentEnrollments.courseId], references: [preRegisteredCourses.id] }),
  certification: one(certifications, { fields: [studentEnrollments.certificationId], references: [certifications.id] }),
  evaluations: many(studentEvaluations),
  payments: many(studentPayments),
  certificates: many(studentCertificates),
}));

export const studentEvaluationsRelations = relations(studentEvaluations, ({ one }) => ({
  enrollment: one(studentEnrollments, { fields: [studentEvaluations.enrollmentId], references: [studentEnrollments.id] }),
}));

export const studentDocumentsRelations = relations(studentDocuments, ({ one }) => ({
  student: one(users, { fields: [studentDocuments.studentId], references: [users.id] }),
  analyzer: one(users, { fields: [studentDocuments.analisadoPor], references: [users.id] }),
}));

export const studentPaymentsRelations = relations(studentPayments, ({ one }) => ({
  student: one(users, { fields: [studentPayments.studentId], references: [users.id] }),
  enrollment: one(studentEnrollments, { fields: [studentPayments.enrollmentId], references: [studentEnrollments.id] }),
}));



export const studentCertificatesRelations = relations(studentCertificates, ({ one }) => ({
  student: one(users, { fields: [studentCertificates.studentId], references: [users.id] }),
  enrollment: one(studentEnrollments, { fields: [studentCertificates.enrollmentId], references: [studentEnrollments.id] }),
}));

export const studentCardsRelations = relations(studentCards, ({ one }) => ({
  student: one(users, { fields: [studentCards.studentId], references: [users.id] }),
}));

export const preRegisteredCoursesRelations = relations(preRegisteredCourses, ({ many }) => ({
  enrollments: many(studentEnrollments),
}));

// Sistema de Matrícula Simplificada
export const simplifiedEnrollments = pgTable('simplified_enrollments', {
  id: serial('id').primaryKey(),
  tenantId: integer('tenant_id').references(() => teams.id).notNull(), // Usando teams como tenants
  courseId: integer('course_id').references(() => preRegisteredCourses.id).notNull(),
  studentId: integer('student_id').references(() => users.id), // Nullable até criar usuário
  studentName: text('student_name').notNull(),
  studentEmail: text('student_email').notNull(),
  studentCpf: text('student_cpf').notNull(),
  studentPhone: text('student_phone'),
  consultantId: integer('consultant_id').references(() => users.id).notNull(),
  amount: integer('amount').notNull(), // Valor em centavos
  installments: integer('installments').default(1).notNull(),
  paymentMethod: text('payment_method').default('BOLETO').notNull(),
  externalReference: text('external_reference'),
  paymentUrl: text('payment_url'),
  asaasCustomerId: text('asaas_customer_id'),
  asaasPaymentId: text('asaas_payment_id'),
  status: text('status').default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
});

// Relações da matrícula simplificada
export const simplifiedEnrollmentsRelations = relations(simplifiedEnrollments, ({ one }) => ({
  tenant: one(teams, { fields: [simplifiedEnrollments.tenantId], references: [teams.id] }),
  course: one(preRegisteredCourses, { fields: [simplifiedEnrollments.courseId], references: [preRegisteredCourses.id] }),
  student: one(users, { fields: [simplifiedEnrollments.studentId], references: [users.id] }),
  consultant: one(users, { fields: [simplifiedEnrollments.consultantId], references: [users.id] }),
}));

// Schemas Zod para validação
export const insertSimplifiedEnrollmentSchema = createInsertSchema(simplifiedEnrollments)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    completedAt: true,
    cancelledAt: true,
    studentId: true,
    asaasCustomerId: true,
    asaasPaymentId: true,
    paymentUrl: true,
    externalReference: true,
  });

export type SimplifiedEnrollment = typeof simplifiedEnrollments.$inferSelect;
export type InsertSimplifiedEnrollment = z.infer<typeof insertSimplifiedEnrollmentSchema>;

// Relações do Portal do Professor
export const subjectsRelations = relations(subjects, ({ many }) => ({
  professorSubjects: many(professorSubjects),
  contents: many(subjectContents),
  evaluations: many(professorEvaluations),
}));

export const professorSubjectsRelations = relations(professorSubjects, ({ one }) => ({
  professor: one(users, { fields: [professorSubjects.professorId], references: [users.id] }),
  subject: one(subjects, { fields: [professorSubjects.subjectId], references: [subjects.id] }),
}));

export const subjectContentsRelations = relations(subjectContents, ({ one }) => ({
  subject: one(subjects, { fields: [subjectContents.subjectId], references: [subjects.id] }),
  professor: one(users, { fields: [subjectContents.professorId], references: [users.id] }),
}));

export const professorEvaluationsRelations = relations(professorEvaluations, ({ one, many }) => ({
  subject: one(subjects, { fields: [professorEvaluations.subjectId], references: [subjects.id] }),
  professor: one(users, { fields: [professorEvaluations.professorId], references: [users.id] }),
  questions: many(evaluationQuestions),
  submissions: many(evaluationSubmissions),
}));

export const evaluationQuestionsRelations = relations(evaluationQuestions, ({ one }) => ({
  evaluation: one(professorEvaluations, { fields: [evaluationQuestions.evaluationId], references: [professorEvaluations.id] }),
}));

export const evaluationSubmissionsRelations = relations(evaluationSubmissions, ({ one }) => ({
  evaluation: one(professorEvaluations, { fields: [evaluationSubmissions.evaluationId], references: [professorEvaluations.id] }),
  student: one(users, { fields: [evaluationSubmissions.studentId], references: [users.id] }),
}));

// Relações para as tabelas acadêmicas
export const academicCoursesRelations = relations(academicCourses, ({ many }) => ({
  students: many(academicStudents),
  certificates: many(academicCertificates),
  courseDisciplines: many(courseDisciplines),
}));

export const academicDisciplinesRelations = relations(academicDisciplines, ({ many, one }) => ({
  professor: one(academicProfessors, { fields: [academicDisciplines.professorId], references: [academicProfessors.id] }),
  courseDisciplines: many(courseDisciplines),
  grades: many(academicGrades),
}));

export const courseDisciplinesRelations = relations(courseDisciplines, ({ one }) => ({
  course: one(academicCourses, { fields: [courseDisciplines.courseId], references: [academicCourses.id] }),
  discipline: one(academicDisciplines, { fields: [courseDisciplines.disciplineId], references: [academicDisciplines.id] }),
}));

export const academicProfessorsRelations = relations(academicProfessors, ({ many }) => ({
  disciplines: many(academicDisciplines),
}));

export const academicStudentsRelations = relations(academicStudents, ({ many, one }) => ({
  course: one(academicCourses, { fields: [academicStudents.courseId], references: [academicCourses.id] }),
  grades: many(academicGrades),
  certificates: many(academicCertificates),
}));

export const academicGradesRelations = relations(academicGrades, ({ one }) => ({
  student: one(academicStudents, { fields: [academicGrades.studentId], references: [academicStudents.id] }),
  discipline: one(academicDisciplines, { fields: [academicGrades.disciplineId], references: [academicDisciplines.id] }),
}));

export const academicCertificatesRelations = relations(academicCertificates, ({ one }) => ({
  student: one(academicStudents, { fields: [academicCertificates.studentId], references: [academicStudents.id] }),
  course: one(academicCourses, { fields: [academicCertificates.courseId], references: [academicCourses.id] }),
  requestedBy: one(users, { fields: [academicCertificates.solicitadoPor], references: [users.id] }),
  authorizedBy: one(users, { fields: [academicCertificates.autorizadoPor], references: [users.id] }),
  issuedBy: one(users, { fields: [academicCertificates.emitidoPor], references: [users.id] }),
}));

export const certificateTemplatesRelations = relations(certificateTemplates, ({ one }) => ({
  createdBy: one(users, { fields: [certificateTemplates.createdBy], references: [users.id] }),
}));

// Schemas de inserção
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  role: true,
  companyAccount: true,
  department: true,
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
  externalId: true,
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

export const insertGoalProgressSchema = createInsertSchema(goalProgress).pick({
  goalId: true,
  userId: true,
  current: true,
  achieved: true,
  period: true,
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

export const insertCertificationSchema = createInsertSchema(certifications).pick({
  inicio: true,
  aluno: true,
  cpf: true,
  modalidade: true,
  curso: true,
  financeiro: true,
  documentacao: true,
  plataforma: true,
  tutoria: true,
  observacao: true,
  inicioCertificacao: true,
  dataPrevista: true,
  dataEntrega: true,
  diploma: true,
  status: true,
  categoria: true,
  prioridade: true,
  situacaoAnalise: true,
  dataInicio: true,
  dataExpiracao: true,
  extensaoContratada: true,
  extensaoData: true,
  disciplinasRestantes: true,
  telefone: true,
  cargaHoraria: true,
});

export const insertCertificationHistorySchema = createInsertSchema(certificationHistory).pick({
  certificationId: true,
  campo: true,
  valorAnterior: true,
  valorNovo: true,
  usuarioId: true,
});

export const insertCertificationDocumentSchema = createInsertSchema(certificationDocuments).pick({
  certificationId: true,
  tipoDocumento: true,
  nomeArquivo: true,
  status: true,
  dataEnvio: true,
  dataAprovacao: true,
  observacoes: true,
});

export const insertPreRegisteredCourseSchema = createInsertSchema(preRegisteredCourses).pick({
  nome: true,
  modalidade: true,
  categoria: true,
  cargaHoraria: true,
  area: true,
  ativo: true,
});

// Schemas de inserção para Portal do Aluno
export const insertStudentEnrollmentSchema = createInsertSchema(studentEnrollments).pick({
  studentId: true,
  courseId: true,
  certificationId: true,
  status: true,
  progresso: true,
  dataMatricula: true,
  dataInicio: true,
  dataConclusao: true,
  notaFinal: true,
  linkPlataforma: true,
  observacoes: true,
});

export const insertStudentEvaluationSchema = createInsertSchema(studentEvaluations).pick({
  enrollmentId: true,
  tipoAvaliacao: true,
  titulo: true,
  nota: true,
  status: true,
  dataAplicacao: true,
  dataCorrecao: true,
  feedbackTutor: true,
  tentativas: true,
  peso: true,
});

export const insertStudentDocumentSchema = createInsertSchema(studentDocuments).pick({
  studentId: true,
  tipoDocumento: true,
  nomeArquivo: true,
  urlArquivo: true,
  status: true,
  dataEnvio: true,
  dataAnalise: true,
  observacoes: true,
  analisadoPor: true,
});

export const insertStudentPaymentSchema = createInsertSchema(studentPayments).pick({
  studentId: true,
  enrollmentId: true,
  valor: true,
  descricao: true,
  status: true,
  dataVencimento: true,
  dataPagamento: true,
  metodoPagamento: true,
  referencia: true,
  urlBoleto: true,
  isRecorrente: true,
});

export const insertStudentCertificateSchema = createInsertSchema(studentCertificates).pick({
  studentId: true,
  enrollmentId: true,
  tipoCertificado: true,
  titulo: true,
  status: true,
  urlDownload: true,
  codigoVerificacao: true,
  dataEmissao: true,
  dataSolicitacao: true,
  validoAte: true,
  observacoes: true,
});

export const insertStudentCardSchema = createInsertSchema(studentCards).pick({
  studentId: true,
  numeroCarteirinha: true,
  tokenValidacao: true,
  qrCodeData: true,
  status: true,
  validoAte: true,
  fotoUrl: true,
  cursoAtual: true,
});

// Schemas de inserção para Sistema de Certificados Acadêmicos
export const insertAcademicCourseSchema = createInsertSchema(academicCourses).pick({
  nome: true,
  descricao: true,
  categoria: true,
  areaConhecimento: true,
  modalidade: true,
  cargaHoraria: true,
  duracao: true,
  preco: true,
  status: true,
  coordenadorId: true,
});

export const insertAcademicProfessorSchema = createInsertSchema(academicProfessors).pick({
  nome: true,
  email: true,
  titulacao: true,
  especializacao: true,
  biografia: true,
  isActive: true,
});

export const insertAcademicDisciplineSchema = createInsertSchema(academicDisciplines).pick({
  nome: true,
  professorId: true,
  cargaHoraria: true,
  ementa: true,
  prerequeisitos: true,
  status: true,
});

export const insertCourseDisciplineSchema = createInsertSchema(courseDisciplines).pick({
  courseId: true,
  disciplineId: true,
  ordem: true,
  periodo: true,
  obrigatoria: true,
});

export const insertAcademicStudentSchema = createInsertSchema(academicStudents).pick({
  nome: true,
  email: true,
  cpf: true,
  telefone: true,
  dataNascimento: true,
  endereco: true,
  courseId: true,
  dataMatricula: true,
  status: true,
  notaFinal: true,
});

export const insertAcademicGradeSchema = createInsertSchema(academicGrades).pick({
  studentId: true,
  disciplineId: true,
  nota: true,
  frequencia: true,
  status: true,
  observacoes: true,
});

export const insertAcademicCertificateSchema = createInsertSchema(academicCertificates).pick({
  studentId: true,
  courseId: true,
  numeroRegistro: true,
  dataEmissao: true,
  dataValidade: true,
  dataSolicitacao: true,
  status: true,
  observacoes: true,
  qrCodeHash: true,
  linkValidacao: true,
  pdfUrl: true,
  registroId: true,
  livro: true,
  folha: true,
  solicitadoPor: true,
  autorizadoPor: true,
  emitidoPor: true,
});

export const insertCertificateTemplateSchema = createInsertSchema(certificateTemplates).pick({
  nome: true,
  categoria: true,
  tipo: true,
  htmlTemplate: true,
  templateVerso: true,
  variaveis: true,
  instituicaoNome: true,
  instituicaoEndereco: true,
  instituicaoLogo: true,
  assinaturaDigital1: true,
  assinaturaDigital2: true,
  textoLegal: true,
  qrCodePosition: true,
  isActive: true,
  createdBy: true,
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

export type InsertGoalProgress = z.infer<typeof insertGoalProgressSchema>;
export type GoalProgress = typeof goalProgress.$inferSelect;

export type InsertUserActivity = z.infer<typeof insertUserActivitySchema>;
export type UserActivity = typeof userActivity.$inferSelect;

export type InsertCertification = z.infer<typeof insertCertificationSchema>;
export type Certification = typeof certifications.$inferSelect;

export type InsertCertificationHistory = z.infer<typeof insertCertificationHistorySchema>;
export type CertificationHistory = typeof certificationHistory.$inferSelect;

export type InsertCertificationDocument = z.infer<typeof insertCertificationDocumentSchema>;
export type CertificationDocument = typeof certificationDocuments.$inferSelect;

export type InsertPreRegisteredCourse = z.infer<typeof insertPreRegisteredCourseSchema>;
export type PreRegisteredCourse = typeof preRegisteredCourses.$inferSelect;

// Schemas para negociações com validação em português
export const insertNegociacaoSchema = z.object({
  clienteNome: z.string({
    required_error: "Nome do cliente é obrigatório",
    invalid_type_error: "Nome do cliente deve ser um texto"
  }).min(1, "Nome do cliente é obrigatório"),
  clienteEmail: z.string().optional().nullable(),
  clienteCpf: z.string().optional().nullable(),
  clienteTelefone: z.string().optional().nullable(),
  curso: z.string().optional().nullable(),
  categoria: z.string().optional().nullable(),
  dataNegociacao: z.string({
    required_error: "Data da negociação é obrigatória",
    invalid_type_error: "Data da negociação deve ser um texto"
  }).min(1, "Data da negociação não pode estar vazia"),
  previsaoPagamento: z.string({
    required_error: "Previsão de pagamento é obrigatória", 
    invalid_type_error: "Previsão de pagamento deve ser um texto"
  }).min(1, "Previsão de pagamento não pode estar vazia")
    .refine((date) => {
      // Converte as datas para objetos Date para comparação mais robusta
      const inputDate = new Date(date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Remove horas para comparar apenas a data
      return inputDate >= today;
    }, "Previsão de pagamento não pode ser anterior à data atual"),
  parcelasAtraso: z.number({
    required_error: "Número de parcelas em atraso é obrigatório",
    invalid_type_error: "Parcelas em atraso deve ser um número"
  }).min(0, "Número de parcelas em atraso deve ser maior ou igual a zero"),
  dataVencimentoMaisAntiga: z.string().optional().nullable(),
  valorNegociado: z.union([z.string(), z.number()]).optional().nullable(),
  gatewayPagamento: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  colaboradorResponsavel: z.string({
    required_error: "Colaborador responsável é obrigatório",
    invalid_type_error: "Colaborador responsável deve ser um texto"
  }).min(1, "Colaborador responsável não pode estar vazio"),
  origem: z.string().default("certificacao"),
  status: z.string().default("aguardando_pagamento")
});

export const insertNegociacaoExpiradoSchema = z.object({
  clienteNome: z.string({
    required_error: "Nome do cliente é obrigatório",
    invalid_type_error: "Nome do cliente deve ser um texto"
  }).min(1, "Nome do cliente é obrigatório"),
  clienteEmail: z.string().optional().nullable(),
  clienteCpf: z.string().optional().nullable(),
  curso: z.string({
    required_error: "Curso é obrigatório",
    invalid_type_error: "Curso deve ser um texto"
  }).min(1, "Curso é obrigatório"),
  categoria: z.string({
    required_error: "Categoria é obrigatória",
    invalid_type_error: "Categoria deve ser um texto"
  }).min(1, "Categoria é obrigatória"),
  dataExpiracao: z.string({
    required_error: "Data de expiração é obrigatória",
    invalid_type_error: "Data de expiração deve ser um texto"
  }).min(1, "Data de expiração não pode estar vazia"),
  dataProposta: z.string().optional().nullable(),
  dataPrevisaPagamento: z.string({
    required_error: "Data prevista de pagamento é obrigatória",
    invalid_type_error: "Data prevista de pagamento deve ser um texto"
  }).min(1, "Data prevista de pagamento não pode estar vazia")
    .refine((date) => {
      // Converte as datas para objetos Date para comparação mais robusta
      const inputDate = new Date(date + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Remove horas para comparar apenas a data
      return inputDate >= today;
    }, "Data prevista de pagamento não pode ser anterior à data atual"),
  propostaReativacao: z.string().optional().nullable(),
  valorProposta: z.union([z.string(), z.number()]).optional().nullable(),
  statusProposta: z.string().default("pendente"),
  observacoes: z.string().optional().nullable(),
  colaboradorResponsavel: z.string({
    required_error: "Colaborador responsável é obrigatório",
    invalid_type_error: "Colaborador responsável deve ser um texto"
  }).min(1, "Colaborador responsável não pode estar vazio"),
});

export type InsertNegociacao = z.infer<typeof insertNegociacaoSchema>;
export type Negociacao = typeof negociacoes.$inferSelect;

export type InsertNegociacaoExpirado = z.infer<typeof insertNegociacaoExpiradoSchema>;
export type NegociacaoExpirado = typeof negociacoesExpirados.$inferSelect;

// Tipos para Portal do Aluno
export type InsertStudentEnrollment = z.infer<typeof insertStudentEnrollmentSchema>;
export type StudentEnrollment = typeof studentEnrollments.$inferSelect;

export type InsertStudentEvaluation = z.infer<typeof insertStudentEvaluationSchema>;
export type StudentEvaluation = typeof studentEvaluations.$inferSelect;

export type InsertStudentDocument = z.infer<typeof insertStudentDocumentSchema>;
export type StudentDocument = typeof studentDocuments.$inferSelect;

export type InsertStudentPayment = z.infer<typeof insertStudentPaymentSchema>;
export type StudentPayment = typeof studentPayments.$inferSelect;

export type InsertStudentCertificate = z.infer<typeof insertStudentCertificateSchema>;
export type StudentCertificate = typeof studentCertificates.$inferSelect;

export type InsertStudentCard = z.infer<typeof insertStudentCardSchema>;
export type StudentCard = typeof studentCards.$inferSelect;



// Schemas de inserção para Portal do Professor
export const insertSubjectSchema = createInsertSchema(subjects).pick({
  nome: true,
  codigo: true,
  descricao: true,
  cargaHoraria: true,
  area: true,
});

export const insertProfessorSubjectSchema = createInsertSchema(professorSubjects).pick({
  professorId: true,
  subjectId: true,
  canEdit: true,
});

export const insertSubjectContentSchema = createInsertSchema(subjectContents).pick({
  subjectId: true,
  professorId: true,
  titulo: true,
  tipo: true,
  conteudo: true,
  descricao: true,
  ordem: true,
});

export const insertProfessorEvaluationSchema = createInsertSchema(professorEvaluations).pick({
  subjectId: true,
  professorId: true,
  titulo: true,
  tipo: true,
  descricao: true,
  tempoLimite: true,
  tentativasPermitidas: true,
  notaMinima: true,
  embaralharQuestoes: true,
  mostrarResultado: true,
  dataAbertura: true,
  dataFechamento: true,
});

export const insertEvaluationQuestionSchema = createInsertSchema(evaluationQuestions).pick({
  evaluationId: true,
  enunciado: true,
  tipo: true,
  alternativas: true,
  gabarito: true,
  explicacao: true,
  peso: true,
  ordem: true,
  imagemUrl: true,
});

export const insertEvaluationSubmissionSchema = createInsertSchema(evaluationSubmissions).pick({
  evaluationId: true,
  studentId: true,
  respostas: true,
  tentativa: true,
});

// Schema de login para professores
export const professorLoginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// Tipos para Portal do Professor
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjects.$inferSelect;

export type InsertProfessorSubject = z.infer<typeof insertProfessorSubjectSchema>;
export type ProfessorSubject = typeof professorSubjects.$inferSelect;

export type InsertSubjectContent = z.infer<typeof insertSubjectContentSchema>;
export type SubjectContent = typeof subjectContents.$inferSelect;

export type InsertProfessorEvaluation = z.infer<typeof insertProfessorEvaluationSchema>;
export type ProfessorEvaluation = typeof professorEvaluations.$inferSelect;

export type InsertEvaluationQuestion = z.infer<typeof insertEvaluationQuestionSchema>;
export type EvaluationQuestion = typeof evaluationQuestions.$inferSelect;

export type InsertEvaluationSubmission = z.infer<typeof insertEvaluationSubmissionSchema>;
export type EvaluationSubmission = typeof evaluationSubmissions.$inferSelect;

// Tipos para Sistema de Certificados Acadêmicos
export type InsertAcademicCourse = z.infer<typeof insertAcademicCourseSchema>;
export type AcademicCourse = typeof academicCourses.$inferSelect;

export type InsertAcademicProfessor = z.infer<typeof insertAcademicProfessorSchema>;
export type AcademicProfessor = typeof academicProfessors.$inferSelect;

export type InsertAcademicDiscipline = z.infer<typeof insertAcademicDisciplineSchema>;
export type AcademicDiscipline = typeof academicDisciplines.$inferSelect;

export type InsertCourseDiscipline = z.infer<typeof insertCourseDisciplineSchema>;
export type CourseDiscipline = typeof courseDisciplines.$inferSelect;

export type InsertAcademicStudent = z.infer<typeof insertAcademicStudentSchema>;
export type AcademicStudent = typeof academicStudents.$inferSelect;

export type InsertAcademicGrade = z.infer<typeof insertAcademicGradeSchema>;
export type AcademicGrade = typeof academicGrades.$inferSelect;

export type InsertAcademicCertificate = z.infer<typeof insertAcademicCertificateSchema>;
export type AcademicCertificate = typeof academicCertificates.$inferSelect;

export type InsertCertificateTemplate = z.infer<typeof insertCertificateTemplateSchema>;
export type CertificateTemplate = typeof certificateTemplates.$inferSelect;
