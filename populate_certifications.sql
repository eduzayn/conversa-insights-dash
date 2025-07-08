-- Inserir dados de exemplo para o módulo de certificações
INSERT INTO certifications (
  aluno, 
  cpf, 
  modalidade, 
  curso, 
  financeiro, 
  documentacao, 
  plataforma, 
  tutoria, 
  observacao, 
  inicio_certificacao, 
  data_prevista, 
  data_entrega, 
  diploma, 
  status, 
  categoria,
  created_at,
  updated_at
) VALUES 
-- Análises do Mês
('Maria Silva Santos', '123.456.789-01', 'EAD', 'Análise de Sistemas', 'Quitado', 'Completa', 'Aprovado', 'Concluído', 'Documentação em ordem', '2024-01-15', '2024-03-15', '2024-03-10', 'Enviado', 'concluido', 'Análises do Mês', NOW(), NOW()),

('João Pedro Oliveira', '987.654.321-02', 'Presencial', 'Análise de Dados', 'Pendente', 'Parcial', 'Em análise', 'Em andamento', 'Faltam documentos pessoais', '2024-02-01', '2024-04-01', NULL, 'Pendente', 'em_andamento', 'Análises do Mês', NOW(), NOW()),

('Ana Lúcia Costa', '456.789.123-03', 'Semipresencial', 'Análise Financeira', 'Quitado', 'Completa', 'Aprovado', 'Concluído', 'Processo finalizado com sucesso', '2024-01-20', '2024-03-20', '2024-03-18', 'Enviado', 'concluido', 'Análises do Mês', NOW(), NOW()),

('Carlos Eduardo Mendes', '789.123.456-04', 'EAD', 'Análise de Negócios', 'Quitado', 'Completa', 'Aprovado', 'Concluído', 'Aguardando assinatura digital', '2024-02-10', '2024-04-10', NULL, 'Pendente', 'em_andamento', 'Análises do Mês', NOW(), NOW()),

-- Certificação Pós
('Fernanda Rodrigues', '321.654.987-05', 'EAD', 'Pós-Graduação em Gestão de Projetos', 'Quitado', 'Completa', 'Aprovado', 'Concluído', 'Certificado emitido', '2023-08-01', '2024-02-01', '2024-01-28', 'Enviado', 'concluido', 'Certificação Pós', NOW(), NOW()),

('Ricardo Almeida', '654.321.987-06', 'Presencial', 'Pós-Graduação em Marketing Digital', 'Pendente', 'Parcial', 'Em análise', 'Em andamento', 'Falta TCC', '2023-09-15', '2024-03-15', NULL, 'Pendente', 'em_andamento', 'Certificação Pós', NOW(), NOW()),

('Patrícia Santos', '147.258.369-07', 'Semipresencial', 'Pós-Graduação em Recursos Humanos', 'Quitado', 'Completa', 'Aprovado', 'Concluído', 'Processo concluído', '2023-07-01', '2024-01-01', '2023-12-28', 'Enviado', 'concluido', 'Certificação Pós', NOW(), NOW()),

('Gustavo Lima', '258.147.369-08', 'EAD', 'Pós-Graduação em Tecnologia da Informação', 'Quitado', 'Completa', 'Aprovado', 'Concluído', 'Documentação revisada', '2023-10-01', '2024-04-01', NULL, 'Pendente', 'em_andamento', 'Certificação Pós', NOW(), NOW()),

-- 2ª Graduação
('Juliana Pereira', '369.258.147-09', 'EAD', 'Licenciatura em Pedagogia', 'Quitado', 'Completa', 'Aprovado', 'Concluído', 'Diploma registrado', '2022-02-01', '2024-02-01', '2024-01-30', 'Enviado', 'concluido', '2ª Graduação', NOW(), NOW()),

('Roberto Silva', '741.852.963-10', 'Presencial', 'Bacharelado em Administração', 'Pendente', 'Parcial', 'Em análise', 'Em andamento', 'Aguardando documentos do MEC', '2022-08-01', '2024-08-01', NULL, 'Pendente', 'em_andamento', '2ª Graduação', NOW(), NOW()),

('Camila Ferreira', '852.963.741-11', 'Semipresencial', 'Licenciatura em Letras', 'Quitado', 'Completa', 'Aprovado', 'Concluído', 'Processo finalizado', '2022-03-01', '2024-03-01', '2024-02-28', 'Enviado', 'concluido', '2ª Graduação', NOW(), NOW()),

('Daniel Martins', '963.741.852-12', 'EAD', 'Bacharelado em Ciências Contábeis', 'Quitado', 'Completa', 'Aprovado', 'Concluído', 'Documentação em ordem', '2022-06-01', '2024-06-01', NULL, 'Pendente', 'em_andamento', '2ª Graduação', NOW(), NOW());