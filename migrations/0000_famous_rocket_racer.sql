CREATE TABLE "academic_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"studentid" integer NOT NULL,
	"courseid" integer NOT NULL,
	"templateid" integer,
	"numeroregistro" text,
	"dataemissao" date,
	"datavalidade" date,
	"datasolicitacao" date DEFAULT now(),
	"status" text DEFAULT 'solicitado' NOT NULL,
	"observacoes" text,
	"qrcodehash" text,
	"linkvalidacao" text,
	"pdfurl" text,
	"registroid" text,
	"livro" text,
	"folha" text,
	"solicitadopor" integer,
	"autorizadopor" integer,
	"emitidopor" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "academic_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"descricao" text,
	"categoria" text NOT NULL,
	"areaconhecimento" text NOT NULL,
	"modalidade" text NOT NULL,
	"cargahoraria" integer,
	"duracao" text,
	"preco" integer,
	"status" text DEFAULT 'ativo' NOT NULL,
	"coordenadorid" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "academic_disciplines" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"codigo" text,
	"professorid" integer,
	"cargahoraria" integer,
	"ementa" text,
	"prerequeisitos" text[],
	"status" text DEFAULT 'ativo',
	"isactive" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "academic_grades" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"discipline_id" integer NOT NULL,
	"nota" integer NOT NULL,
	"frequencia" integer NOT NULL,
	"status" text DEFAULT 'aprovado' NOT NULL,
	"observacoes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "academic_professors" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"titulacao" text,
	"especializacao" text,
	"biografia" text,
	"isactive" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "academic_students" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"email" text NOT NULL,
	"cpf" text NOT NULL,
	"telefone" text,
	"datanascimento" date,
	"endereco" text,
	"courseid" integer NOT NULL,
	"datamatricula" date,
	"status" text DEFAULT 'cursando' NOT NULL,
	"notafinal" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "attendance_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"sender_id" integer,
	"sender_type" text NOT NULL,
	"content" text NOT NULL,
	"type" text DEFAULT 'text' NOT NULL,
	"file_url" text,
	"file_name" text,
	"audio_duration" integer,
	"read" boolean DEFAULT false,
	"external_id" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "certificacoes_fadyc" (
	"id" serial PRIMARY KEY NOT NULL,
	"aluno" text NOT NULL,
	"cpf" text NOT NULL,
	"curso" text NOT NULL,
	"categoria" text NOT NULL,
	"status_processo" text DEFAULT 'pendente' NOT NULL,
	"data_inicio" date,
	"data_previsao_entrega" date,
	"data_conclusao" date,
	"numero_processo" text,
	"documentos_recebidos" text[],
	"observacoes" text,
	"colaborador_responsavel" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "certificate_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"categoria" text NOT NULL,
	"tipo" text DEFAULT 'completo' NOT NULL,
	"html_template" text NOT NULL,
	"template_verso" text NOT NULL,
	"variaveis" json DEFAULT '[]'::json NOT NULL,
	"instituicao_nome" text DEFAULT 'Instituição de Ensino Superior' NOT NULL,
	"instituicao_endereco" text,
	"instituicao_logo" text,
	"assinatura_digital_1" text,
	"assinatura_digital_2" text,
	"texto_legal" text NOT NULL,
	"qr_code_position" text DEFAULT 'bottom-right' NOT NULL,
	"orientation" text DEFAULT 'portrait' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "certification_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"certification_id" integer NOT NULL,
	"tipo_documento" text NOT NULL,
	"nome_arquivo" text,
	"status" text DEFAULT 'pendente',
	"data_envio" timestamp,
	"data_aprovacao" timestamp,
	"observacoes" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "certification_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"certification_id" integer NOT NULL,
	"campo" text NOT NULL,
	"valor_anterior" text,
	"valor_novo" text,
	"usuario_id" integer,
	"alterado_em" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "certifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"inicio" text,
	"aluno" text NOT NULL,
	"cpf" text,
	"modalidade" text,
	"curso" text,
	"financeiro" text,
	"documentacao" text,
	"plataforma" text,
	"tutoria" text,
	"observacao" text,
	"inicio_certificacao" text,
	"data_prevista" text,
	"diploma" text,
	"status" text DEFAULT 'pendente' NOT NULL,
	"categoria" text DEFAULT 'geral' NOT NULL,
	"prioridade" text DEFAULT 'mediana',
	"situacao_analise" text,
	"data_inicio" date,
	"data_expiracao" date,
	"extensao_contratada" boolean DEFAULT false,
	"extensao_data" date,
	"disciplinas_restantes" integer,
	"telefone" text,
	"carga_horaria" integer,
	"tcc" text DEFAULT 'nao_possui',
	"praticas_pedagogicas" text DEFAULT 'nao_possui',
	"estagio" text DEFAULT 'nao_possui',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "chat_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"chat_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"joined_at" timestamp DEFAULT now(),
	"left_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "chats" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"team_id" integer,
	"created_by" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"attendant_id" integer,
	"status" text DEFAULT 'novo' NOT NULL,
	"resultado" text,
	"customer_name" text,
	"customer_phone" text,
	"botconversa_manager_id" integer,
	"botconversa_manager_name" text,
	"botconversa_manager_email" text,
	"company_account" text,
	"hora" text,
	"atendente" text,
	"equipe" text,
	"duracao" text,
	"assunto" text,
	"observacoes" text,
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "course_disciplines" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"discipline_id" integer NOT NULL,
	"ordem" integer DEFAULT 1,
	"periodo" integer DEFAULT 1,
	"obrigatoria" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cursos_fadyc" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"categoria" text NOT NULL,
	"carga_horaria" integer,
	"area" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "envios_famar" (
	"id" serial PRIMARY KEY NOT NULL,
	"certification_id" integer NOT NULL,
	"aluno" text NOT NULL,
	"cpf" text NOT NULL,
	"curso" text NOT NULL,
	"categoria" text NOT NULL,
	"status_envio" text DEFAULT 'nao_enviado' NOT NULL,
	"numero_oficio" text,
	"data_envio" date,
	"observacoes" text,
	"colaborador_responsavel" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "envios_unicv" (
	"id" serial PRIMARY KEY NOT NULL,
	"certification_id" integer NOT NULL,
	"aluno" text NOT NULL,
	"cpf" text NOT NULL,
	"curso" text NOT NULL,
	"categoria" text NOT NULL,
	"status_envio" text DEFAULT 'nao_enviado' NOT NULL,
	"numero_oficio" text,
	"data_envio" date,
	"data_cadastro" date,
	"observacoes" text,
	"colaborador_responsavel" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "evaluation_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"evaluation_id" integer NOT NULL,
	"enunciado" text NOT NULL,
	"tipo" text DEFAULT 'multipla_escolha' NOT NULL,
	"alternativas" json,
	"gabarito" text NOT NULL,
	"explicacao" text,
	"peso" integer DEFAULT 1,
	"ordem" integer DEFAULT 0,
	"imagem_url" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "evaluation_submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"evaluation_id" integer NOT NULL,
	"student_id" integer NOT NULL,
	"respostas" json NOT NULL,
	"nota" integer,
	"tempo_gasto" integer,
	"tentativa" integer DEFAULT 1,
	"status" text DEFAULT 'pendente' NOT NULL,
	"iniciada_em" timestamp DEFAULT now(),
	"finalizada_em" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "goal_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"goal_id" integer NOT NULL,
	"user_id" integer,
	"current" integer DEFAULT 0 NOT NULL,
	"achieved" boolean DEFAULT false,
	"period" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "goals" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"indicator" text NOT NULL,
	"target" integer NOT NULL,
	"period" text NOT NULL,
	"team_id" integer,
	"user_id" integer,
	"reward" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "internal_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"author_id" integer NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"phone" text,
	"course" text,
	"source" text,
	"status" text DEFAULT 'novo' NOT NULL,
	"assigned_to" integer,
	"team_id" integer,
	"company_account" text DEFAULT 'COMERCIAL' NOT NULL,
	"notes" text,
	"last_interaction" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"chat_id" integer NOT NULL,
	"sender_id" integer NOT NULL,
	"content" text NOT NULL,
	"type" text DEFAULT 'text' NOT NULL,
	"file_url" text,
	"file_name" text,
	"mentions" text[],
	"reply_to_id" integer,
	"reactions" json,
	"edited" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "negociacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"cliente_nome" text NOT NULL,
	"cliente_email" text,
	"cliente_cpf" text,
	"cliente_telefone" text,
	"curso" text,
	"categoria" text,
	"curso_referencia" text,
	"data_negociacao" date NOT NULL,
	"previsao_pagamento" date NOT NULL,
	"parcelas_atraso" integer DEFAULT 0 NOT NULL,
	"data_vencimento_mais_antiga" date,
	"valor_negociado" numeric(10, 2),
	"gateway_pagamento" text,
	"observacoes" text,
	"colaborador_responsavel" text NOT NULL,
	"origem" text DEFAULT 'certificacao' NOT NULL,
	"status" text DEFAULT 'aguardando_pagamento' NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "negociacoes_expirados" (
	"id" serial PRIMARY KEY NOT NULL,
	"cliente_nome" text NOT NULL,
	"cliente_email" text,
	"cliente_cpf" text,
	"curso" text NOT NULL,
	"categoria" text NOT NULL,
	"data_expiracao" date NOT NULL,
	"data_proposta" date,
	"data_previsa_pagamento" date,
	"proposta_reativacao" text,
	"valor_proposta" numeric(10, 2),
	"gateway_pagamento" text,
	"status_proposta" text DEFAULT 'pendente' NOT NULL,
	"observacoes" text,
	"colaborador_responsavel" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pre_registered_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"modalidade" text NOT NULL,
	"categoria" text NOT NULL,
	"carga_horaria" integer NOT NULL,
	"area" text,
	"ativo" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "professor_evaluations" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_id" integer NOT NULL,
	"professor_id" integer NOT NULL,
	"titulo" text NOT NULL,
	"tipo" text NOT NULL,
	"descricao" text,
	"tempo_limite" integer,
	"tentativas_permitidas" integer DEFAULT 1,
	"nota_minima" integer DEFAULT 60,
	"embaralhar_questoes" boolean DEFAULT true,
	"mostrar_resultado" boolean DEFAULT true,
	"is_active" boolean DEFAULT true NOT NULL,
	"data_abertura" timestamp,
	"data_fechamento" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "professor_subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"professor_id" integer NOT NULL,
	"subject_id" integer NOT NULL,
	"can_edit" boolean DEFAULT true NOT NULL,
	"assigned_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "quitacoes" (
	"id" serial PRIMARY KEY NOT NULL,
	"cliente_nome" text NOT NULL,
	"cliente_cpf" text,
	"curso_referencia" text NOT NULL,
	"data_quitacao" date NOT NULL,
	"valor_quitado" numeric(10, 2) NOT NULL,
	"data_ultima_parcela_quitada" date,
	"parcelas_quitadas" integer NOT NULL,
	"gateway_pagamento" text,
	"colaborador_responsavel" text NOT NULL,
	"status" text DEFAULT 'aguardando_pagamento' NOT NULL,
	"observacoes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "registration_tokens" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"role" text DEFAULT 'agent' NOT NULL,
	"created_by" integer NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"used_by" integer,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"used_at" timestamp,
	CONSTRAINT "registration_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "simplified_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenant_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"student_id" integer,
	"student_name" text NOT NULL,
	"student_email" text NOT NULL,
	"student_cpf" text NOT NULL,
	"student_phone" text,
	"consultant_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"installments" integer DEFAULT 1 NOT NULL,
	"payment_method" text DEFAULT 'BOLETO' NOT NULL,
	"external_reference" text,
	"payment_url" text,
	"asaas_customer_id" text,
	"asaas_payment_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "student_cards" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"numero_carteirinha" text NOT NULL,
	"token_validacao" text NOT NULL,
	"qr_code_data" text NOT NULL,
	"status" text DEFAULT 'ativa' NOT NULL,
	"valido_ate" timestamp NOT NULL,
	"foto_url" text,
	"curso_atual" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "student_cards_numero_carteirinha_unique" UNIQUE("numero_carteirinha"),
	CONSTRAINT "student_cards_token_validacao_unique" UNIQUE("token_validacao")
);
--> statement-breakpoint
CREATE TABLE "student_certificates" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"enrollment_id" integer NOT NULL,
	"tipo_certificado" text NOT NULL,
	"titulo" text NOT NULL,
	"status" text DEFAULT 'processando' NOT NULL,
	"url_download" text,
	"codigo_verificacao" text,
	"data_emissao" timestamp,
	"data_solicitacao" timestamp DEFAULT now(),
	"valido_ate" timestamp,
	"observacoes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "student_certificates_codigo_verificacao_unique" UNIQUE("codigo_verificacao")
);
--> statement-breakpoint
CREATE TABLE "student_documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"tipo_documento" text NOT NULL,
	"nome_arquivo" text NOT NULL,
	"url_arquivo" text NOT NULL,
	"status" text DEFAULT 'pendente',
	"data_envio" timestamp DEFAULT now(),
	"data_analise" timestamp,
	"observacoes" text,
	"analisado_por" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"certification_id" integer,
	"status" text DEFAULT 'ativo' NOT NULL,
	"progresso" integer DEFAULT 0,
	"data_matricula" timestamp DEFAULT now(),
	"data_inicio" timestamp,
	"data_conclusao" timestamp,
	"nota_final" integer,
	"link_plataforma" text,
	"observacoes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_evaluations" (
	"id" serial PRIMARY KEY NOT NULL,
	"enrollment_id" integer NOT NULL,
	"tipo_avaliacao" text NOT NULL,
	"titulo" text NOT NULL,
	"nota" integer,
	"status" text DEFAULT 'pendente' NOT NULL,
	"data_aplicacao" timestamp,
	"data_correcao" timestamp,
	"feedback_tutor" text,
	"tentativas" integer DEFAULT 1,
	"peso" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "student_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"enrollment_id" integer,
	"valor" integer NOT NULL,
	"descricao" text NOT NULL,
	"status" text DEFAULT 'pendente' NOT NULL,
	"data_vencimento" timestamp NOT NULL,
	"data_pagamento" timestamp,
	"metodo_pagamento" text,
	"referencia" text,
	"url_boleto" text,
	"is_recorrente" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subject_contents" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_id" integer NOT NULL,
	"professor_id" integer NOT NULL,
	"titulo" text NOT NULL,
	"tipo" text NOT NULL,
	"conteudo" text NOT NULL,
	"descricao" text,
	"ordem" integer DEFAULT 0,
	"is_active" boolean DEFAULT true NOT NULL,
	"visualizacoes" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"codigo" text NOT NULL,
	"descricao" text,
	"carga_horaria" integer NOT NULL,
	"area" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "subjects_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"login_time" timestamp,
	"logout_time" timestamp,
	"total_online_time" integer DEFAULT 0,
	"inactivity_count" integer DEFAULT 0,
	"last_activity" timestamp,
	"date" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" text DEFAULT 'agent' NOT NULL,
	"company_account" text,
	"department" text,
	"multi_company_access" json,
	"is_active" boolean DEFAULT true NOT NULL,
	"cpf" text,
	"telefone" text,
	"data_nascimento" date,
	"endereco" text,
	"cidade" text,
	"estado" text,
	"cep" text,
	"foto_url" text,
	"matricula_ativa" boolean DEFAULT true,
	"documentacao_status" text DEFAULT 'pendente',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "academic_certificates" ADD CONSTRAINT "academic_certificates_studentid_academic_students_id_fk" FOREIGN KEY ("studentid") REFERENCES "public"."academic_students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_certificates" ADD CONSTRAINT "academic_certificates_courseid_academic_courses_id_fk" FOREIGN KEY ("courseid") REFERENCES "public"."academic_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_certificates" ADD CONSTRAINT "academic_certificates_templateid_certificate_templates_id_fk" FOREIGN KEY ("templateid") REFERENCES "public"."certificate_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_certificates" ADD CONSTRAINT "academic_certificates_solicitadopor_users_id_fk" FOREIGN KEY ("solicitadopor") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_certificates" ADD CONSTRAINT "academic_certificates_autorizadopor_users_id_fk" FOREIGN KEY ("autorizadopor") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_certificates" ADD CONSTRAINT "academic_certificates_emitidopor_users_id_fk" FOREIGN KEY ("emitidopor") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_disciplines" ADD CONSTRAINT "academic_disciplines_professorid_academic_professors_id_fk" FOREIGN KEY ("professorid") REFERENCES "public"."academic_professors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_grades" ADD CONSTRAINT "academic_grades_student_id_academic_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."academic_students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_grades" ADD CONSTRAINT "academic_grades_discipline_id_academic_disciplines_id_fk" FOREIGN KEY ("discipline_id") REFERENCES "public"."academic_disciplines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_students" ADD CONSTRAINT "academic_students_courseid_academic_courses_id_fk" FOREIGN KEY ("courseid") REFERENCES "public"."academic_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_messages" ADD CONSTRAINT "attendance_messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_messages" ADD CONSTRAINT "attendance_messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificate_templates" ADD CONSTRAINT "certificate_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certification_documents" ADD CONSTRAINT "certification_documents_certification_id_certifications_id_fk" FOREIGN KEY ("certification_id") REFERENCES "public"."certifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certification_history" ADD CONSTRAINT "certification_history_certification_id_certifications_id_fk" FOREIGN KEY ("certification_id") REFERENCES "public"."certifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certification_history" ADD CONSTRAINT "certification_history_usuario_id_users_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_attendant_id_users_id_fk" FOREIGN KEY ("attendant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_disciplines" ADD CONSTRAINT "course_disciplines_course_id_academic_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."academic_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_disciplines" ADD CONSTRAINT "course_disciplines_discipline_id_academic_disciplines_id_fk" FOREIGN KEY ("discipline_id") REFERENCES "public"."academic_disciplines"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios_famar" ADD CONSTRAINT "envios_famar_certification_id_certifications_id_fk" FOREIGN KEY ("certification_id") REFERENCES "public"."certifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "envios_unicv" ADD CONSTRAINT "envios_unicv_certification_id_certifications_id_fk" FOREIGN KEY ("certification_id") REFERENCES "public"."certifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_questions" ADD CONSTRAINT "evaluation_questions_evaluation_id_professor_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."professor_evaluations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_submissions" ADD CONSTRAINT "evaluation_submissions_evaluation_id_professor_evaluations_id_fk" FOREIGN KEY ("evaluation_id") REFERENCES "public"."professor_evaluations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_submissions" ADD CONSTRAINT "evaluation_submissions_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_progress" ADD CONSTRAINT "goal_progress_goal_id_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "public"."goals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal_progress" ADD CONSTRAINT "goal_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internal_notes" ADD CONSTRAINT "internal_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professor_evaluations" ADD CONSTRAINT "professor_evaluations_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professor_evaluations" ADD CONSTRAINT "professor_evaluations_professor_id_users_id_fk" FOREIGN KEY ("professor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professor_subjects" ADD CONSTRAINT "professor_subjects_professor_id_users_id_fk" FOREIGN KEY ("professor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professor_subjects" ADD CONSTRAINT "professor_subjects_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_tokens" ADD CONSTRAINT "registration_tokens_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_tokens" ADD CONSTRAINT "registration_tokens_used_by_users_id_fk" FOREIGN KEY ("used_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simplified_enrollments" ADD CONSTRAINT "simplified_enrollments_tenant_id_teams_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simplified_enrollments" ADD CONSTRAINT "simplified_enrollments_course_id_pre_registered_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."pre_registered_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simplified_enrollments" ADD CONSTRAINT "simplified_enrollments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simplified_enrollments" ADD CONSTRAINT "simplified_enrollments_consultant_id_users_id_fk" FOREIGN KEY ("consultant_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_cards" ADD CONSTRAINT "student_cards_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_certificates" ADD CONSTRAINT "student_certificates_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_certificates" ADD CONSTRAINT "student_certificates_enrollment_id_student_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."student_enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_analisado_por_users_id_fk" FOREIGN KEY ("analisado_por") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_course_id_pre_registered_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."pre_registered_courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_enrollments" ADD CONSTRAINT "student_enrollments_certification_id_certifications_id_fk" FOREIGN KEY ("certification_id") REFERENCES "public"."certifications"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_evaluations" ADD CONSTRAINT "student_evaluations_enrollment_id_student_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."student_enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_payments" ADD CONSTRAINT "student_payments_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_payments" ADD CONSTRAINT "student_payments_enrollment_id_student_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."student_enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_contents" ADD CONSTRAINT "subject_contents_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subject_contents" ADD CONSTRAINT "subject_contents_professor_id_users_id_fk" FOREIGN KEY ("professor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_activity" ADD CONSTRAINT "user_activity_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;