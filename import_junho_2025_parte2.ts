import { db } from './server/db';
import { certifications } from './shared/schema';
import { eq } from 'drizzle-orm';

// Dados adicionais processados da planilha de junho de 2025
const certificacoesJunho2025Parte2 = [
  {
    inicio: 'Análise Concluída',
    aluno: 'Cintia Carla Natale Purisco Alves',
    cpf: '320.967.148-69',
    modalidade: 'Formação Pedagógica',
    curso: 'Matemática',
    financeiro: 'Inicio: 08/05/2024 Situação: Encontrei apenas 3 parcelas, dando um total de R$ 1.219,60 Expira em: 08/09/2025',
    documentacao: 'Incompleto',
    plataforma: 'Aprovado em todas disciplinas',
    tutoria: 'Não localizado',
    observacao: '',
    inicioCertificacao: '2024-05-08',
    dataPrevista: '2025-09-08',
    dataEntrega: null,
    diploma: null,
    status: 'em_andamento',
    categoria: 'segunda_graduacao',
    subcategoria: 'formacao_pedagogica',
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'Cintia Carla Natale Purisco Alves',
    cpf: '320.967.148-69',
    modalidade: 'Formação Pedagógica',
    curso: 'História',
    financeiro: 'Inicio: 08/05/2024 Situação: Encontrei apenas 3 parcelas, dando um total de R$ 1.219,60 Expira em: 08/09/2025',
    documentacao: 'Incompleto',
    plataforma: 'Aprovado em todas disciplinas',
    tutoria: 'Não localizado',
    observacao: '',
    inicioCertificacao: '2024-05-08',
    dataPrevista: '2025-09-08',
    dataEntrega: null,
    diploma: null,
    status: 'em_andamento',
    categoria: 'segunda_graduacao',
    subcategoria: 'formacao_pedagogica',
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'Rafaela Macedo de Araújo',
    cpf: '015.078.382-55',
    modalidade: 'Pós-Graduação',
    curso: 'Neuropsicologia Clínica',
    financeiro: 'Inicio: 23/10/2022 Situação: Quitado Expirou em: 06/05/2025 (estendeu)',
    documentacao: 'Incompleto',
    plataforma: 'Aprovado em todas disciplinas',
    tutoria: 'Em análise (recebimento: 20/05/2025)',
    observacao: '',
    inicioCertificacao: '2022-10-23',
    dataPrevista: '2025-05-06',
    dataEntrega: null,
    diploma: null,
    status: 'em_andamento',
    categoria: 'pos_graduacao',
    subcategoria: null,
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'Lais Pinheiro Assumpção',
    cpf: '345.237.068-24',
    modalidade: 'Pós-Graduação',
    curso: 'Psicologia Educacional',
    financeiro: 'Inicio: 08/01/2024 Situação: Quitada Expira em: 08/05/2025',
    documentacao: 'Incompleto',
    plataforma: 'Aprovado em todas disciplinas',
    tutoria: 'Não exige',
    observacao: '',
    inicioCertificacao: '2024-01-08',
    dataPrevista: '2025-05-08',
    dataEntrega: null,
    diploma: null,
    status: 'em_andamento',
    categoria: 'pos_graduacao',
    subcategoria: null,
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'Flávio Luiz Souza dos Santos',
    cpf: '141.502.267-41',
    modalidade: 'Segunda Licenciatura',
    curso: 'Música',
    financeiro: 'Inicio: 27/02/2024 Situação: Quitado Expira em: 27/06/2025',
    documentacao: 'Incompleto',
    plataforma: 'Aprovado em todas disciplinas',
    tutoria: 'PPI reprovado, não tem 4 laudas de dissertação e falta a PPII (Recebimento: 23/05/2025)',
    observacao: '',
    inicioCertificacao: '2024-02-27',
    dataPrevista: '2025-06-27',
    dataEntrega: null,
    diploma: null,
    status: 'em_andamento',
    categoria: 'segunda_graduacao',
    subcategoria: 'segunda_licenciatura',
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'Márcia Pires de Almeida Santos',
    cpf: '010.391.961-95',
    modalidade: 'Segunda Licenciatura',
    curso: 'Pedagogia',
    financeiro: 'Inicio: 24/01/2023 Situação: Quitada Expira em: 27/06/2025 (contratou extensão)',
    documentacao: 'Entregue e Deferida',
    plataforma: 'Aprovado em todas disciplinas',
    tutoria: 'Terá que realizar correções nas Praticas',
    observacao: '',
    inicioCertificacao: '2023-01-24',
    dataPrevista: '2025-06-27',
    dataEntrega: null,
    diploma: null,
    status: 'em_andamento',
    categoria: 'segunda_graduacao',
    subcategoria: 'segunda_licenciatura',
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'Ruana Beth de Almeida',
    cpf: '129.821.847-02',
    modalidade: 'Pós-Graduação',
    curso: 'Em Atendimento Educacional Especializado Ênfase em Educação Especial e Inclusiva',
    financeiro: 'Inicio: 12/06/2024 Situação: Quitada Expira em: 12/10/2025',
    documentacao: 'Entregue e Deferida',
    plataforma: 'Aprovado em todas disciplinas',
    tutoria: 'Não exige',
    observacao: '',
    inicioCertificacao: '2024-06-12',
    dataPrevista: '2025-10-12',
    dataEntrega: null,
    diploma: null,
    status: 'em_andamento',
    categoria: 'pos_graduacao',
    subcategoria: null,
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'Sonia Izabel Forcelli',
    cpf: '089.651.148-02',
    modalidade: 'Formação Pedagógica',
    curso: 'Música',
    financeiro: 'Inicio: 10/10/2022 Situação: Pagou 14 de 16 parcelas Expirou em: 10/02/2024',
    documentacao: 'Não encaminhou nenhum documento',
    plataforma: 'Não concluiu nenhuma disciplina',
    tutoria: 'Não localizado',
    observacao: '',
    inicioCertificacao: '2022-10-10',
    dataPrevista: '2024-02-10',
    dataEntrega: null,
    diploma: null,
    status: 'cancelado',
    categoria: 'segunda_graduacao',
    subcategoria: 'formacao_pedagogica',
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'Giancarlo Lucena dos Santos',
    cpf: '659.791.094-04',
    modalidade: 'Formação Pedagógica',
    curso: 'Geografia',
    financeiro: 'Inicio: 10/01/2024 Situação: Quitado Expira em: 06/06/2025',
    documentacao: 'Incompleto',
    plataforma: 'Aprovado em todas disciplinas',
    tutoria: 'PPI pré-aprovada, falta o envio da PPII, aguardando documentação para sinalizar (curso expirado)',
    observacao: '',
    inicioCertificacao: '2024-01-10',
    dataPrevista: '2025-06-06',
    dataEntrega: null,
    diploma: null,
    status: 'em_andamento',
    categoria: 'segunda_graduacao',
    subcategoria: 'formacao_pedagogica',
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'Giancarlo Lucena dos Santos',
    cpf: '659.791.094-05',
    modalidade: 'Pós-Graduação',
    curso: 'Ensino de Geografia',
    financeiro: 'Brinde, Inicio: 10/01/2024 Situação: Quitada Expira em: 06/06/2025',
    documentacao: 'Incompleto',
    plataforma: 'Resta concluir 09 disciplinas',
    tutoria: 'Não exige',
    observacao: '',
    inicioCertificacao: '2024-01-10',
    dataPrevista: '2025-06-06',
    dataEntrega: null,
    diploma: null,
    status: 'em_andamento',
    categoria: 'pos_graduacao',
    subcategoria: null,
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'Bianca Clemencia Teixeira da Silva de Freitas',
    cpf: '056.203.607-50',
    modalidade: 'Segunda Licenciatura',
    curso: 'Pedagogia',
    financeiro: 'Inicio: 07/11/2024 Situação: Quitada no Cartão de Crédito Expira em: 07/03/2026',
    documentacao: 'Incompleto',
    plataforma: 'Aprovado em todas disciplinas',
    tutoria: 'PPS pré-aprovadas, aguardando documentação',
    observacao: 'Leandro Teodoro',
    inicioCertificacao: '2024-11-07',
    dataPrevista: '2026-03-07',
    dataEntrega: null,
    diploma: null,
    status: 'em_andamento',
    categoria: 'segunda_graduacao',
    subcategoria: 'segunda_licenciatura',
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'Gilmar Rodrigues',
    cpf: '039.985.886-55',
    modalidade: 'Pós-Graduação',
    curso: 'Neuropsicanálise Clínica',
    financeiro: 'Inicio: 15/12/2023 Situação: Quitada Expirou em: 15/04/2025',
    documentacao: 'Entregue e Deferida',
    plataforma: 'Aprovado em todas disciplinas',
    tutoria: 'Não localizado',
    observacao: '',
    inicioCertificacao: '2023-12-15',
    dataPrevista: '2025-04-15',
    dataEntrega: null,
    diploma: null,
    status: 'concluido',
    categoria: 'pos_graduacao',
    subcategoria: null,
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'Gilmar Rodrigues',
    cpf: '039.985.886-55',
    modalidade: 'Pós-Graduação',
    curso: 'Psicanálise',
    financeiro: 'Inicio: 15/12/2023 Situação: Quitada Expirou em: 15/04/2025',
    documentacao: 'Entregue e Deferida',
    plataforma: 'Aprovado em todas disciplinas',
    tutoria: 'Não exige',
    observacao: '',
    inicioCertificacao: '2023-12-15',
    dataPrevista: '2025-04-15',
    dataEntrega: null,
    diploma: null,
    status: 'concluido',
    categoria: 'pos_graduacao',
    subcategoria: null,
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'Thiago Alexandre Gomes Fávaris',
    cpf: '057.885.887-82',
    modalidade: 'Formação Pedagógica',
    curso: 'Em Letras– Português e Espanhol',
    financeiro: 'Iniciou em: 14/02/2024 Situação: Quitado Expira em: 14/06/2025',
    documentacao: 'Entregue e Deferida',
    plataforma: 'Aprovado em todas disciplinas',
    tutoria: 'Aprovada',
    observacao: '',
    inicioCertificacao: '2024-02-14',
    dataPrevista: '2025-06-14',
    dataEntrega: null,
    diploma: null,
    status: 'concluido',
    categoria: 'segunda_graduacao',
    subcategoria: 'formacao_pedagogica',
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'Janaína Marchioretto Mella',
    cpf: '004.912.910-43',
    modalidade: 'Pós-Graduação',
    curso: 'Arteterapia',
    financeiro: 'Inicio: 05/03/2025 Situação: Quitada no Cartão de Crédito Expira em: 05/09/2026',
    documentacao: 'Entregue e Deferida',
    plataforma: 'Aprovado em todas disciplinas',
    tutoria: 'Termo de conclusão sem autenticação, trabalho sem referencias e não possui as 80h',
    observacao: '',
    inicioCertificacao: '2025-03-05',
    dataPrevista: '2026-09-05',
    dataEntrega: null,
    diploma: null,
    status: 'em_andamento',
    categoria: 'pos_graduacao',
    subcategoria: null,
    prioridade: 'normal'
  }
];

async function importJunho2025Parte2() {
  let importados = 0;
  let existentes = 0;
  
  try {
    console.log('🔄 Iniciando importação da parte 2 dos dados de junho de 2025...\n');
    
    for (const certificacao of certificacoesJunho2025Parte2) {
      // Verificar se o aluno com o mesmo CPF e curso já existe
      const existingStudent = await db.select()
        .from(certifications)
        .where(eq(certifications.cpf, certificacao.cpf));
      
      // Verificar se já existe com o mesmo curso
      const existingCourse = existingStudent.find(cert => 
        cert.curso === certificacao.curso && 
        cert.modalidade === certificacao.modalidade
      );
      
      if (existingCourse) {
        console.log(`⚠️  Já existe: ${certificacao.aluno} - ${certificacao.curso} (${certificacao.modalidade})`);
        existentes++;
        continue;
      }
      
      // Inserir nova certificação
      await db.insert(certifications).values(certificacao);
      console.log(`✅ Importado: ${certificacao.aluno} - ${certificacao.curso} (${certificacao.modalidade})`);
      importados++;
    }
    
    console.log(`\n📊 Resumo da importação Parte 2:`);
    console.log(`   ✅ Importados: ${importados}`);
    console.log(`   ⚠️  Já existentes: ${existentes}`);
    console.log(`   📋 Total processados: ${certificacoesJunho2025Parte2.length}`);
    
  } catch (error) {
    console.error('❌ Erro ao importar:', error);
  }
}

// Executar a importação
importJunho2025Parte2()
  .then(() => {
    console.log('\n✅ Importação parte 2 de junho de 2025 concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na importação:', error);
    process.exit(1);
  });