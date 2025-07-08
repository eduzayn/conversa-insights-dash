import { db } from './server/db';
import { certifications } from './shared/schema';
import { eq } from 'drizzle-orm';

// Dados processados da planilha de junho de 2025
const certificacoesJunho2025 = [
  {
    inicio: 'Análise Concluída',
    aluno: 'Felipe Nazário da Silva',
    cpf: '074.168.709-76',
    modalidade: 'Segunda Licenciatura',
    curso: 'Música',
    financeiro: 'Inicio: 08/01/2024 Situação: Quitado Expirou em: 08/05/2025',
    documentacao: 'Entregue e Deferida',
    plataforma: 'Aprovado em todas disciplinas',
    tutoria: 'PPI ok, falta envio da PPII',
    observacao: '',
    inicioCertificacao: '2024-01-08',
    dataPrevista: '2025-05-08',
    dataEntrega: null,
    diploma: null,
    status: 'concluido',
    categoria: 'segunda_graduacao',
    subcategoria: 'segunda_licenciatura',
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'Hellane de Sena Oliveira',
    cpf: '099.663.967-56',
    modalidade: 'Segunda Licenciatura',
    curso: 'Pedagogia',
    financeiro: 'Inicio: 10/03/2023 Situação: Quitada Expirou em: 03/05/2025 (extensão)',
    documentacao: 'Não encaminhou nenhum documento',
    plataforma: 'Aprovado em todas disciplinas',
    tutoria: 'PPI ok, falta envio da PPII, aguardando documentação para sinalizar',
    observacao: 'Falta Documentação',
    inicioCertificacao: '2023-03-10',
    dataPrevista: '2025-05-03',
    dataEntrega: null,
    diploma: null,
    status: 'em_andamento',
    categoria: 'segunda_graduacao',
    subcategoria: 'segunda_licenciatura',
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'Vinicius Barros Noman',
    cpf: '126.977.116-78',
    modalidade: 'Ensino Fundamental e Médio',
    curso: 'EJA',
    financeiro: 'Inicio: 30/04/2025 Situação: Quitado',
    documentacao: 'Não encaminhou nenhum documento',
    plataforma: 'Aprovado em todas disciplinas',
    tutoria: 'Atividades pré aprovadas, falta documentação',
    observacao: '',
    inicioCertificacao: '2025-04-30',
    dataPrevista: null,
    dataEntrega: null,
    diploma: null,
    status: 'em_andamento',
    categoria: 'eja',
    subcategoria: null,
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'Yana Valena Fernandes Nicácio',
    cpf: '031.762.122-08',
    modalidade: 'Pós-Graduação',
    curso: 'Ensino de Geografia',
    financeiro: 'Inicio: 16/02/2024 Situação: Quitada Expira em: 16/06/2025',
    documentacao: 'Não encaminhou nenhum documento',
    plataforma: 'Aprovado em todas disciplinas',
    tutoria: 'Não exige',
    observacao: '',
    inicioCertificacao: '2024-02-16',
    dataPrevista: '2025-06-16',
    dataEntrega: null,
    diploma: null,
    status: 'em_andamento',
    categoria: 'pos_graduacao',
    subcategoria: null,
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'João Pedro Amorim de Oliveira Araújo',
    cpf: '114.501.706-17',
    modalidade: 'Formação Pedagógica',
    curso: 'Matemática',
    financeiro: 'Inicio: 14/02/2023 Situação: Quitado Expirou em: 14/06/2024 Contratou extensão: (20/05/2025 - 20/06/2025)',
    documentacao: 'Entregue e Deferida',
    plataforma: 'Resta concluir 01 disciplina',
    tutoria: 'PPI ok, falta enviar a PPII',
    observacao: '',
    inicioCertificacao: '2023-02-14',
    dataPrevista: '2025-06-20',
    dataEntrega: null,
    diploma: null,
    status: 'em_andamento',
    categoria: 'segunda_graduacao',
    subcategoria: 'formacao_pedagogica',
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'Jefferson da Costa Rato',
    cpf: '262.038.008-13',
    modalidade: 'Formação Pedagógica',
    curso: 'Educação Física',
    financeiro: 'Inicio: 06/02/2025 Situação: Quitado no Cartão de Crédito Expira em: 06/08/2026',
    documentacao: 'Entregue e Deferida',
    plataforma: 'Aprovado em todas disciplinas',
    tutoria: 'Aprovado via email em 2 de julho de 2025',
    observacao: '',
    inicioCertificacao: '2025-02-06',
    dataPrevista: '2026-08-06',
    dataEntrega: null,
    diploma: null,
    status: 'concluido',
    categoria: 'segunda_graduacao',
    subcategoria: 'formacao_pedagogica',
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'Gineide Barbosa dos Santos',
    cpf: '045.791.717-21',
    modalidade: 'Formação Livre',
    curso: 'Psicanálise',
    financeiro: 'Inicio: 26/07/2023 Situação: Quitada Expirou em: 26/11/2024',
    documentacao: 'Incompleto',
    plataforma: 'Resta concluir 01 disciplina',
    tutoria: 'Não exige',
    observacao: '',
    inicioCertificacao: '2023-07-26',
    dataPrevista: '2024-11-26',
    dataEntrega: null,
    diploma: null,
    status: 'em_andamento',
    categoria: 'formacao_livre',
    subcategoria: null,
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'Graziele Damaceno de Azevedo',
    cpf: '056.223.167-66',
    modalidade: 'Formação Livre',
    curso: 'Psicanálise',
    financeiro: 'Inicio: 13/04/2023 Situação: Pagou 14 de 16 parcelas (há uma parcela unificando várias) Expirou em: 13/08/2024',
    documentacao: 'Incompleto',
    plataforma: 'Aprovado em todas disciplinas',
    tutoria: 'Não exige',
    observacao: '',
    inicioCertificacao: '2023-04-13',
    dataPrevista: '2024-08-13',
    dataEntrega: null,
    diploma: null,
    status: 'concluido',
    categoria: 'formacao_livre',
    subcategoria: null,
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'Renata Vilhena Lisboa de Almeida',
    cpf: '004.045.392-89',
    modalidade: 'Formação Livre',
    curso: 'Sexologia',
    financeiro: 'Inicio: 15/12/2022 Situação: Pagou 13 parcelas (verificar se foi alguma promoção) Expirou em: 15/04/2024',
    documentacao: 'Entregue e Deferida',
    plataforma: 'Aprovado em todas disciplinas',
    tutoria: 'Não exige',
    observacao: 'Aluna encaminhou os documentos via e-mail',
    inicioCertificacao: '2022-12-15',
    dataPrevista: '2024-04-15',
    dataEntrega: null,
    diploma: null,
    status: 'concluido',
    categoria: 'formacao_livre',
    subcategoria: null,
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'Angela Maria Rosa Barrnabe',
    cpf: '162.099.312-00',
    modalidade: 'Diplomação por Competência',
    curso: 'Pedagogia',
    financeiro: 'Inicio: 05/04/2025 Situação: Em dia Expira em: 05/08/2026',
    documentacao: 'Incompleto',
    plataforma: 'Aprovado em todas disciplinas',
    tutoria: 'Enviou apenas Comprovação de Experiência (Pré-Aprovado), aguardando envio da Avaliação Prática e do retorno da análise, falta documentação',
    observacao: '',
    inicioCertificacao: '2025-04-05',
    dataPrevista: '2026-08-05',
    dataEntrega: null,
    diploma: null,
    status: 'em_andamento',
    categoria: 'diplomacao_competencia',
    subcategoria: null,
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'Rafael Ramos da Silva Dantas',
    cpf: '062.939.744-92',
    modalidade: 'Diplomação por Competência',
    curso: 'Música',
    financeiro: 'Inicio: 27/02/2025 Situação: Quitado no cartão de crédito Expira em: 27/08/2026',
    documentacao: 'Entregue e Deferida',
    plataforma: 'Aprovado em todas disciplinas',
    tutoria: 'Aprovado',
    observacao: '',
    inicioCertificacao: '2025-02-27',
    dataPrevista: '2026-08-27',
    dataEntrega: null,
    diploma: null,
    status: 'concluido',
    categoria: 'diplomacao_competencia',
    subcategoria: null,
    prioridade: 'normal'
  },
  {
    inicio: 'Análise Concluída',
    aluno: 'Juliana Lisboa de Oliveira',
    cpf: '075.397.334-03',
    modalidade: 'Formação Livre',
    curso: 'Psicanálise',
    financeiro: 'Inicio: 08/08/2023 Situação: Pagou 06 de 16 parcelas Expirou em: 08/12/2024',
    documentacao: 'Não Localizado',
    plataforma: 'Aprovado em todas disciplinas',
    tutoria: 'Não exige',
    observacao: '',
    inicioCertificacao: '2023-08-08',
    dataPrevista: '2024-12-08',
    dataEntrega: null,
    diploma: null,
    status: 'em_andamento',
    categoria: 'formacao_livre',
    subcategoria: null,
    prioridade: 'mediana'
  }
];

async function importJunho2025() {
  let importados = 0;
  let existentes = 0;
  
  try {
    console.log('🔄 Iniciando importação dos dados de junho de 2025...\n');
    
    for (const certificacao of certificacoesJunho2025) {
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
    
    console.log(`\n📊 Resumo da importação:`);
    console.log(`   ✅ Importados: ${importados}`);
    console.log(`   ⚠️  Já existentes: ${existentes}`);
    console.log(`   📋 Total processados: ${certificacoesJunho2025.length}`);
    
    // Verificar totais por categoria
    const totalPorCategoria = await db.select()
      .from(certifications);
    
    const categorias = {
      'pos_graduacao': 0,
      'segunda_graduacao': 0,
      'formacao_livre': 0,
      'diplomacao_competencia': 0,
      'eja': 0
    };
    
    totalPorCategoria.forEach(cert => {
      if (categorias.hasOwnProperty(cert.categoria)) {
        categorias[cert.categoria]++;
      }
    });
    
    console.log(`\n📈 Total por categoria no sistema:`);
    console.log(`   🎓 Pós-Graduação: ${categorias.pos_graduacao}`);
    console.log(`   📚 Segunda Graduação: ${categorias.segunda_graduacao}`);
    console.log(`   🔄 Formação Livre: ${categorias.formacao_livre}`);
    console.log(`   🏆 Diplomação por Competência: ${categorias.diplomacao_competencia}`);
    console.log(`   📖 EJA: ${categorias.eja}`);
    
  } catch (error) {
    console.error('❌ Erro ao importar:', error);
  }
}

// Executar a importação
importJunho2025()
  .then(() => {
    console.log('\n✅ Importação de junho de 2025 concluída!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na importação:', error);
    process.exit(1);
  });